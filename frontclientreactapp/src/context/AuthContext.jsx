import { useCallback, useEffect, useMemo, useState } from 'react'
import { authClient } from '../services/authClient'
import { AuthContext } from './authContext'

export function AuthProvider({ children }) {
  const [status, setStatus] = useState(() => (authClient.getAccessToken() ? 'authenticated' : 'idle'))
  const [tokens, setTokens] = useState(() => authClient.getSnapshot())
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsubscribe = authClient.onChange((snapshot) => {
      setTokens(snapshot)
      if (snapshot.accessToken) {
        setStatus('authenticated')
      } else {
        setStatus('idle')
      }
    })
    return unsubscribe
  }, [])

  const login = useCallback(async (credentials) => {
    setStatus('pending')
    setError(null)
    try {
      const snapshot = await authClient.login(credentials)
      setTokens(snapshot)
      setStatus('authenticated')
      return snapshot
    } catch (err) {
      setStatus('error')
      const message = err instanceof Error ? err.message : 'Неизвестная ошибка'
      setError(message)
      throw err
    }
  }, [])

  const logout = useCallback(() => {
    authClient.logout()
    setStatus('idle')
    setTokens(authClient.getSnapshot())
    setError(null)
  }, [])

  const value = useMemo(
    () => ({
      status,
      tokens,
      error,
      login,
      logout,
    }),
    [error, login, logout, status, tokens],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
