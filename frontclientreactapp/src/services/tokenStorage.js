const STORAGE_KEY = 'auth.tokens'
const PERSISTENCE_KEY = 'auth.tokens.persistence'

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

const getStorage = (type) => {
  if (!isBrowser) {
    return null
  }
  if (type === 'session') {
    return typeof window.sessionStorage !== 'undefined' ? window.sessionStorage : null
  }
  return window.localStorage
}

function safeParse(raw, storage) {
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
    console.warn('Не удалось прочитать токены из persistent storage', error)
    storage?.removeItem(STORAGE_KEY)
    return null
  }
}

export function loadTokens() {
  if (!isBrowser) {
    return null
  }

  const persistenceHint = window.localStorage?.getItem(PERSISTENCE_KEY)
  const preference = persistenceHint === 'session' ? ['session', 'local'] : ['local', 'session']

  for (const type of preference) {
    const storage = getStorage(type)
    const raw = storage?.getItem(STORAGE_KEY)
    const parsed = safeParse(raw, storage)
    if (parsed) {
      return { tokens: parsed, persistence: type }
    }
  }

  return null
}

export function persistTokens(tokens, { persistence = 'local' } = {}) {
  if (!isBrowser) {
    return
  }

  const target = getStorage(persistence)
  const fallback = getStorage(persistence === 'session' ? 'local' : 'session')

  if (!tokens) {
    target?.removeItem(STORAGE_KEY)
    fallback?.removeItem(STORAGE_KEY)
    window.localStorage?.removeItem(PERSISTENCE_KEY)
    return
  }

  const payload = JSON.stringify(tokens)
  target?.setItem(STORAGE_KEY, payload)
  fallback?.removeItem(STORAGE_KEY)
  window.localStorage?.setItem(PERSISTENCE_KEY, persistence)
}

export function clearTokens() {
  if (!isBrowser) {
    return
  }

  getStorage('local')?.removeItem(STORAGE_KEY)
  getStorage('session')?.removeItem(STORAGE_KEY)
  window.localStorage?.removeItem(PERSISTENCE_KEY)
}
