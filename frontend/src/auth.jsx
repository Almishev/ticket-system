import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from './Helper/api'

const AuthContext = createContext(null)
const STORAGE_KEY = 'ticket-auth'

export function AuthProvider({ children }) {
  const [credentials, setCredentials] = useState(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  })
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadUser() {
      if (!credentials) {
        setUser(null)
        setReady(true)
        return
      }
      try {
        const response = await api('/auth/me', { auth: credentials })
        if (!cancelled) {
          setUser(response.data)
        }
      } catch {
        sessionStorage.removeItem(STORAGE_KEY)
        if (!cancelled) {
          setCredentials(null)
          setUser(null)
        }
      } finally {
        if (!cancelled) {
          setReady(true)
        }
      }
    }

    setReady(false)
    loadUser()
    return () => {
      cancelled = true
    }
  }, [credentials])

  const value = useMemo(
    () => ({
      user,
      ready,
      credentials,
      async acceptToken(token) {
        const auth = { token }
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
        setCredentials(auth)
        const response = await api('/auth/me', { auth })
        setUser(response.data)
        return response.data
      },
      logout() {
        sessionStorage.removeItem(STORAGE_KEY)
        setCredentials(null)
        setUser(null)
        const redirect = encodeURIComponent(window.location.origin)
        window.location.assign(`https://studentsuniversityregister.kinde.com/logout?redirect=${redirect}`)
      },
    }),
    [user, ready, credentials],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
