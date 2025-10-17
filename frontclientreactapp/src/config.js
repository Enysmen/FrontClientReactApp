export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'https://localhost:5001/api'

export const AUTH_ENDPOINTS = {
  login: '/auth/login',
  refresh: '/auth/refresh',
  revoke: '/auth/revoke',
}

export const TOKEN_REFRESH_SKEW_MS = 30_000
