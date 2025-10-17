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
  const { skipAuth = false, ...requestInit } = options
  const headers = new Headers(requestInit.headers || {})

  if (!skipAuth) {
    const validToken = await authClient.ensureValidAccessToken()
    const token = validToken ?? authClient.getAccessToken()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  const response = await fetch(buildUrl(path), {
    ...requestInit,
    headers,
    credentials: requestInit.credentials ?? 'include',
  })

  if (skipAuth || response.status !== 401 || !authClient.getAccessToken()) {
    return response
  }

  try {
    await authClient.refreshToken()
  } catch (error) {
    authClient.logout()
    throw error
  }

  const retryHeaders = new Headers(requestInit.headers || {})
  const newToken = authClient.getAccessToken()
  if (newToken) {
    retryHeaders.set('Authorization', `Bearer ${newToken}`)
  }

  return fetch(buildUrl(path), {
    ...requestInit,
    headers: retryHeaders,
    credentials: requestInit.credentials ?? 'include',
  })
}
