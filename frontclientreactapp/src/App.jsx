import { useState } from 'react'

const API_ENDPOINT = 'https://localhost:5001/api/auth/login'

function App() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [rememberMe, setRememberMe] = useState(false)
  const [status, setStatus] = useState({ state: 'idle', message: '' })

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setStatus({ state: 'loading', message: 'Отправляем данные на сервер…' })

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          rememberMe,
        }),
      })

      if (!response.ok) {
        const errorMessage = await response.text()
        throw new Error(errorMessage || 'Не удалось выполнить вход')
      }

      const data = await response.json().catch(() => null)
      const successMessage = data?.message || 'Вход выполнен успешно. Токен получен.'

      setStatus({ state: 'success', message: successMessage })
    } catch (error) {
      setStatus({
        state: 'error',
        message: error instanceof Error ? error.message : 'Произошла неизвестная ошибка',
      })
    }
  }

  const isLoading = status.state === 'loading'

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
              Введите логин и пароль, чтобы войти в панель управления.
            </p>
          </div>

          {status.state !== 'idle' && (
            <div className={`form-alert form-alert--${status.state}`} role="alert">
              {status.message}
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
                disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>

            <div className="login-form__footer">
              <label className="remember-me">
                <input
                  type="checkbox"
                  className="remember-me__checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  disabled={isLoading}
                />
                <span className="remember-me__label">Запомнить меня</span>
              </label>
              <span className="login-form__secure">Защищённое соединение</span>
            </div>

            <button type="submit" className="login-form__submit" disabled={isLoading}>
              {isLoading ? 'Входим…' : 'Войти'}
            </button>
          </form>

          <p className="integration-hint">
            Запрос отправляется на ASP.NET Web API по адресу:
            <br />
            <span className="integration-hint__endpoint">{API_ENDPOINT}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
