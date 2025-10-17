import { API_BASE_URL } from '../config'
import { authClient } from './authClient'

function buildUrl(path) {
  if (/^https?:/i.test(path)) {
    return path
  }
  const base = API_BASE_URL.replace(/\/$/, '')
  const suffix = path.startsWith('/') ? path : `/${path}`
  return `${base}${suffix}`
}

export async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {})
  const accessToken = authClient.getAccessToken()

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
    credentials: options.credentials ?? 'include',
  })

  if (response.status !== 401 || !authClient.getAccessToken()) {
    return response
  }

  try {
    await authClient.refreshToken()
  } catch (error) {
    authClient.logout()
    throw error
  }

  const retryHeaders = new Headers(options.headers || {})
  const newToken = authClient.getAccessToken()
  if (newToken) {
    retryHeaders.set('Authorization', `Bearer ${newToken}`)
  }

  return fetch(buildUrl(path), {
    ...options,
    headers: retryHeaders,
    credentials: options.credentials ?? 'include',
  })
}
