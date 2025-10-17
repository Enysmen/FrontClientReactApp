import { API_BASE_URL, AUTH_ENDPOINTS, TOKEN_REFRESH_SKEW_MS } from '../config'
import { clearTokens, loadTokens, persistTokens } from './tokenStorage'

const base64Decode = (value) => {
  if (typeof window !== 'undefined' && typeof window.atob === 'function') {
    return window.atob(value)
  }
  if (typeof globalThis !== 'undefined' && typeof globalThis.atob === 'function') {
    return globalThis.atob(value)
  }
  if (typeof globalThis !== 'undefined' && typeof globalThis.Buffer !== 'undefined') {
    return globalThis.Buffer.from(value, 'base64').toString('binary')
  }
  throw new Error('Base64 decode не поддерживается в текущем окружении')
}

function decodeJwt(token) {
  try {
    const payload = token.split('.')[1]
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = base64Decode(normalized)
    return JSON.parse(
      decodeURIComponent(
        decoded
          .split('')
          .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
          .join(''),
      ),
    )
  } catch (error) {
    console.warn('Не удалось декодировать JWT', error)
    return null
  }
}

function resolveExpiry({ accessToken, accessTokenExpiresIn, accessTokenExpiresAt }) {
  if (accessTokenExpiresAt) {
    return accessTokenExpiresAt
  }

  if (accessTokenExpiresIn) {
    return Date.now() + accessTokenExpiresIn * 1000
  }

  const decoded = accessToken ? decodeJwt(accessToken) : null
  if (decoded?.exp) {
    return decoded.exp * 1000
  }

  return Date.now() + 15 * 60 * 1000
}

class AuthClient {
  constructor() {
    const persisted = loadTokens()
    this.tokens = persisted?.tokens ?? null
    this.persistence = persisted?.persistence ?? 'local'
    this.refreshTimeout = null
    this.refreshPromise = null

    if (this.tokens?.accessToken) {
      this.scheduleRefresh()
    }

    this.listeners = new Set()
  }

  onChange(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  notify() {
    const snapshot = this.getSnapshot()
    this.listeners.forEach((listener) => listener(snapshot))
  }

  getSnapshot() {
    return {
      accessToken: this.tokens?.accessToken ?? null,
      refreshToken: this.tokens?.refreshToken ?? null,
      accessTokenExpiresAt: this.tokens?.accessTokenExpiresAt ?? null,
      refreshTokenExpiresAt: this.tokens?.refreshTokenExpiresAt ?? null,
      persistence: this.persistence,
      claims: this.tokens?.accessToken ? decodeJwt(this.tokens.accessToken) : null,
    }
  }

  getAccessToken() {
    return this.tokens?.accessToken ?? null
  }

  isAccessTokenExpired() {
    if (!this.tokens?.accessTokenExpiresAt) {
      return false
    }
    return Date.now() >= this.tokens.accessTokenExpiresAt - TOKEN_REFRESH_SKEW_MS
  }

  isRefreshTokenExpired() {
    if (!this.tokens?.refreshToken || !this.tokens.refreshTokenExpiresAt) {
      return false
    }
    return Date.now() >= this.tokens.refreshTokenExpiresAt
  }

  async ensureValidAccessToken() {
    if (!this.tokens?.accessToken) {
      return null
    }

    if (!this.isAccessTokenExpired()) {
      return this.tokens.accessToken
    }

    try {
      const snapshot = await this.refreshToken()
      return snapshot.accessToken ?? null
    } catch (error) {
      this.logout()
      throw error
    }
  }

  setTokens(rawTokens) {
    if (!rawTokens) {
      this.tokens = null
      clearTokens()
      this.clearRefreshTimer()
      this.notify()
      return
    }

    const now = Date.now()

    const normalized = {
      accessToken: rawTokens.accessToken,
      refreshToken: rawTokens.refreshToken ?? this.tokens?.refreshToken ?? null,
      refreshTokenExpiresAt:
        rawTokens.refreshTokenExpiresAt ??
        (rawTokens.refreshTokenExpiresIn ? now + rawTokens.refreshTokenExpiresIn * 1000 : null) ??
        this.tokens?.refreshTokenExpiresAt ?? null,
      accessTokenExpiresAt: resolveExpiry({
        accessToken: rawTokens.accessToken,
        accessTokenExpiresIn: rawTokens.expiresIn ?? rawTokens.accessTokenExpiresIn,
        accessTokenExpiresAt: rawTokens.accessTokenExpiresAt,
      }),
    }

    this.tokens = normalized
    persistTokens(normalized, { persistence: this.persistence })
    this.scheduleRefresh()
    this.notify()
  }

  clearRefreshTimer() {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout)
      this.refreshTimeout = null
    }
  }

  scheduleRefresh() {
    this.clearRefreshTimer()

    if (!this.tokens?.accessTokenExpiresAt || !this.tokens.refreshToken) {
      return
    }

    if (this.isRefreshTokenExpired()) {
      this.logout()
      return
    }

    const delay = Math.max(
      500,
      this.tokens.accessTokenExpiresAt - Date.now() - TOKEN_REFRESH_SKEW_MS,
    )

    this.refreshTimeout = setTimeout(() => {
      this.refreshToken().catch((error) => {
        console.error('Не удалось обновить access token', error)
        this.logout()
      })
    }, delay)
  }

  async login(credentials, options = {}) {
    const { remember = true, signal } = options
    this.persistence = remember ? 'local' : 'session'

    const response = await fetch(`${API_BASE_URL}${AUTH_ENDPOINTS.login}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(credentials),
      signal,
    })

    if (!response.ok) {
      const message = await response.text()
      throw new Error(message || 'Ошибка аутентификации')
    }

    const payload = await response.json()
    this.setTokens(payload)
    return this.getSnapshot()
  }

  async refreshToken() {
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    if (!this.tokens?.refreshToken) {
      throw new Error('Отсутствует refresh token')
    }

    if (this.isRefreshTokenExpired()) {
      throw new Error('Refresh token истёк, требуется повторный вход')
    }

    this.refreshPromise = (async () => {
      const response = await fetch(`${API_BASE_URL}${AUTH_ENDPOINTS.refresh}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ refreshToken: this.tokens.refreshToken }),
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Не удалось обновить токен')
      }

      const payload = await response.json()
      this.setTokens({ ...payload, refreshToken: payload.refreshToken ?? this.tokens.refreshToken })
      this.refreshPromise = null
      return this.getSnapshot()
    })()

    try {
      return await this.refreshPromise
    } finally {
      this.refreshPromise = null
    }
  }

  async revokeSession() {
    if (!this.tokens?.refreshToken) {
      return
    }

    try {
      await fetch(`${API_BASE_URL}${AUTH_ENDPOINTS.revoke}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ refreshToken: this.tokens.refreshToken }),
      })
    } catch (error) {
      console.warn('Не удалось уведомить API об отзыве сессии', error)
    }
  }

  logout() {
    this.revokeSession().finally(() => {
      this.setTokens(null)
      this.persistence = 'local'
    })
  }
}

export const authClient = new AuthClient()
