const STORAGE_KEY = 'auth.tokens'

const isBrowser = typeof window !== 'undefined' && !!window.localStorage

const storage = isBrowser ? window.localStorage : null

export function loadTokens() {
  if (!storage) {
    return null
  }

  const raw = storage.getItem(STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw)
    if (!parsed?.accessToken) {
      return null
    }
    return parsed
  } catch (error) {
    console.warn('Не удалось прочитать токены из localStorage', error)
    storage.removeItem(STORAGE_KEY)
    return null
  }
}

export function persistTokens(tokens) {
  if (!storage) {
    return
  }

  if (!tokens) {
    storage.removeItem(STORAGE_KEY)
    return
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(tokens))
}

export function clearTokens() {
  if (!storage) {
    return
  }
  storage.removeItem(STORAGE_KEY)
}
