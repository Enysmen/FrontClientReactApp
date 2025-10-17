import { useEffect, useMemo, useState } from 'react'
import { AuthProvider } from './context/AuthContext.jsx'
import { useAuth } from './context/useAuth'
import { API_BASE_URL, AUTH_ENDPOINTS } from './config'
import { apiFetch } from './services/apiClient'

const PROTECTED_PROBE_DEFAULT = '/auth/session'

function formatDuration(milliseconds) {
  if (milliseconds == null) {
    return '—'
  }

  if (milliseconds <= 0) {
    return 'истёк'
  }

  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (minutes > 0) {
    return `${minutes} мин ${remainingSeconds.toString().padStart(2, '0')} с`
  }
  return `${seconds} с`
}

function formatDate(value) {
  if (!value) {
    return '—'
  }
  return new Date(value).toLocaleString()
}

function LoginExperience() {
  const { status: authStatus, tokens, error: authError, login, logout } = useAuth()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [rememberMe, setRememberMe] = useState(false)
  const [feedback, setFeedback] = useState({ variant: 'idle', text: '' })
  const [probePath, setProbePath] = useState(PROTECTED_PROBE_DEFAULT)
  const [probeState, setProbeState] = useState({ state: 'idle', message: '' })
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!tokens?.accessToken) {
      setFeedback({ variant: 'idle', text: '' })
      return
    }

    if (authStatus === 'authenticated') {
      setFeedback((prev) => {
        if (prev.variant === 'error') {
          return prev
        }
        return {
          variant: 'success',
          text: 'Сессия активна. Access token автоматически обновится при истечении срока.',
        }
      })
    }
  }, [authStatus, tokens?.accessToken, tokens?.accessTokenExpiresAt])

  useEffect(() => {
    if (authStatus === 'error' && authError) {
      setFeedback({ variant: 'error', text: authError })
    }
  }, [authError, authStatus])

  const isPending = authStatus === 'pending'

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFeedback({ variant: 'loading', text: 'Отправляем данные на сервер…' })
    setProbeState({ state: 'idle', message: '' })
    try {
      await login({ ...formData, rememberMe })
      setFeedback({
        variant: 'success',
        text: 'Вход выполнен. Можно вызывать защищённые методы API.',
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось выполнить вход'
      setFeedback({ variant: 'error', text: message })
    }
  }

  const handleProbeRequest = async () => {
    setProbeState({ state: 'loading', message: 'Отправляем запрос к защищённому ресурсу…' })
    try {
      const response = await apiFetch(probePath, { method: 'GET' })
      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || `Ошибка ${response.status}`)
      }
      const contentType = response.headers.get('content-type') || ''
      const payload = contentType.includes('application/json')
        ? await response.json()
        : await response.text()
      const message = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2)
      setProbeState({ state: 'success', message })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось выполнить запрос'
      setProbeState({ state: 'error', message })
    }
  }

  const accessExpiresIn = useMemo(() => {
    if (!tokens?.accessTokenExpiresAt) {
      return null
    }
    return Math.max(0, tokens.accessTokenExpiresAt - now)
  }, [now, tokens?.accessTokenExpiresAt])

  const refreshExpiresIn = useMemo(() => {
    if (!tokens?.refreshTokenExpiresAt) {
      return null
    }
    return Math.max(0, tokens.refreshTokenExpiresAt - now)
  }, [now, tokens?.refreshTokenExpiresAt])

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-card__body">
          <div className="login-card__header">
            <div className="brand-circle">
              <span className="brand-initials">WS</span>
            </div>
            <h1 className="login-card__title">Добро пожаловать!</h1>
            <p className="login-card__subtitle">
              Введите логин и пароль, чтобы получить JWT и refresh токен от ASP.NET Web API.
            </p>
          </div>

          {feedback.variant !== 'idle' && (
            <div className={`form-alert form-alert--${feedback.variant}`} role="alert">
              {feedback.text}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="login-form__group">
              <label htmlFor="loginEmail" className="login-form__label">
                Email
              </label>
              <input
                type="email"
                className="login-form__input"
                id="loginEmail"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="username"
                placeholder="name@example.com"
                disabled={isPending}
              />
            </div>

            <div className="login-form__group">
              <div className="login-form__label-row">
                <label htmlFor="loginPassword" className="login-form__label">
                  Пароль
                </label>
                <a className="login-form__link" href="/account/recover">
                  Забыли пароль?
                </a>
              </div>
              <input
                type="password"
                className="login-form__input"
                id="loginPassword"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                placeholder="Введите пароль"
                disabled={isPending}
              />
            </div>

            <div className="login-form__footer">
              <label className="remember-me">
                <input
                  type="checkbox"
                  className="remember-me__checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  disabled={isPending}
                />
                <span className="remember-me__label">Запомнить меня</span>
              </label>
              <span className="login-form__secure">Защищённое соединение</span>
            </div>

            <button type="submit" className="login-form__submit" disabled={isPending}>
              {isPending ? 'Входим…' : 'Войти'}
            </button>
          </form>

          <section className="integration-panel">
            <h2 className="integration-panel__title">Подключение к Web API</h2>
            <ul className="integration-panel__list">
              <li>
                <span className="integration-panel__label">Базовый URL</span>
                <span className="integration-panel__value">{API_BASE_URL}</span>
              </li>
              <li>
                <span className="integration-panel__label">Login endpoint</span>
                <span className="integration-panel__value">{AUTH_ENDPOINTS.login}</span>
              </li>
              <li>
                <span className="integration-panel__label">Refresh endpoint</span>
                <span className="integration-panel__value">{AUTH_ENDPOINTS.refresh}</span>
              </li>
            </ul>
          </section>

          <section className="token-panel">
            <div className="token-panel__header">
              <h2 className="token-panel__title">Статус токенов</h2>
              {tokens?.accessToken ? (
                <button type="button" className="token-panel__logout" onClick={logout}>
                  Выйти и очистить токены
                </button>
              ) : null}
            </div>
            <div className="token-grid">
              <article className="token-card">
                <h3 className="token-card__title">Access token</h3>
                <p className="token-card__value token-card__value--code">
                  {tokens?.accessToken ? `${tokens.accessToken.slice(0, 32)}…` : '—'}
                </p>
                <dl className="token-card__meta">
                  <div>
                    <dt>Истекает</dt>
                    <dd>{formatDate(tokens?.accessTokenExpiresAt)}</dd>
                  </div>
                  <div>
                    <dt>Осталось</dt>
                    <dd>{formatDuration(accessExpiresIn)}</dd>
                  </div>
                </dl>
              </article>
              <article className="token-card">
                <h3 className="token-card__title">Refresh token</h3>
                <p className="token-card__value token-card__value--code">
                  {tokens?.refreshToken ? `${tokens.refreshToken.slice(0, 32)}…` : '—'}
                </p>
                <dl className="token-card__meta">
                  <div>
                    <dt>Истекает</dt>
                    <dd>{formatDate(tokens?.refreshTokenExpiresAt)}</dd>
                  </div>
                  <div>
                    <dt>Осталось</dt>
                    <dd>{formatDuration(refreshExpiresIn)}</dd>
                  </div>
                </dl>
              </article>
            </div>
            <p className="token-panel__hint">
              Автообновление запускается за 30 секунд до окончания срока действия access token.
              Refresh токен хранится в localStorage и передаётся в ASP.NET Web API в теле запроса.
            </p>
          </section>

          <section className="probe-panel">
            <h2 className="probe-panel__title">Проверка защищённого запроса</h2>
            <p className="probe-panel__subtitle">
              После успешного входа можно вызвать любой эндпоинт Web API. Клиент автоматически
              прикрепит актуальный access token и обновит его при ответе 401.
            </p>
            <div className="probe-panel__form">
              <label className="probe-panel__label" htmlFor="probePath">
                Относительный путь или абсолютный URL
              </label>
              <input
                id="probePath"
                className="probe-panel__input"
                value={probePath}
                onChange={(event) => setProbePath(event.target.value)}
                placeholder="/auth/session"
              />
              <button
                type="button"
                className="probe-panel__submit"
                onClick={handleProbeRequest}
                disabled={isPending || !tokens?.accessToken}
              >
                Выполнить запрос
              </button>
            </div>
            {probeState.state !== 'idle' && (
              <pre className={`probe-panel__result probe-panel__result--${probeState.state}`}>
                {probeState.message}
              </pre>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <LoginExperience />
    </AuthProvider>
  )
}

export default App
