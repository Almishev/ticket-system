import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import Constants from 'expo-constants'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { Platform } from 'react-native'
import { api, apiUrl } from './api'
import { registerPush, unregisterPush } from './notifications'
import { deleteStored, getStored, setStored } from './storage'

WebBrowser.maybeCompleteAuthSession()

const TOKEN_KEY = 'helpdesk-token'
const AuthContext = createContext(null)

function returnUrl(path) {
  if (Platform.OS === 'web') {
    const origin = window.location.origin
    return path ? `${origin}/${path}` : origin
  }
  const configured = Constants.expoConfig?.hostUri?.split('?')[0]
  const fromLink = Constants.linkingUri?.match(/^exps?:\/\/([^/]+)/)?.[1]
  const host = configured || fromLink || '192.168.80.110:8082'
  return path ? `exp://${host}/--/${path}` : `exp://${host}`
}

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const stored = await getStored(TOKEN_KEY)
        if (!stored) {
          return
        }
        const response = await api('/auth/me', { token: stored })
        if (!cancelled) {
          setToken(stored)
          setUser(response.data)
          registerPush(stored).catch(() => {})
        }
      } catch {
        await deleteStored(TOKEN_KEY)
      } finally {
        if (!cancelled) {
          setReady(true)
        }
      }
    }
    load().finally(() => {
      if (!cancelled) {
        setReady(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(
    () => ({
      token,
      user,
      ready,
      async acceptToken(nextToken) {
        await setStored(TOKEN_KEY, nextToken)
        const response = await api('/auth/me', { token: nextToken })
        setToken(nextToken)
        setUser(response.data)
        registerPush(nextToken).catch(() => {})
        return response.data
      },
      async logout() {
        await unregisterPush(token).catch(() => {})
        await deleteStored(TOKEN_KEY)
        setToken(null)
        setUser(null)
        const returnTo = returnUrl('')
        const logoutUrl = `https://studentsuniversityregister.kinde.com/logout?redirect=${encodeURIComponent(returnTo)}`
        await WebBrowser.openAuthSessionAsync(logoutUrl, returnTo).catch(() => {})
      },
    }),
    [token, user, ready],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export async function exchangeKindeCode(code, state) {
  const response = await api('/auth/kinde/mobile/exchange', {
    method: 'POST',
    body: { code: String(code), state: String(state) },
  })
  return response.data
}

export async function startKinde(screen) {
  const returnTo = returnUrl('auth')
  let url = `${apiUrl()}/auth/kinde/login?client=mobile&returnTo=${encodeURIComponent(returnTo)}`
  if (screen) {
    url += `&screen=${encodeURIComponent(screen)}`
  }
  const result = await WebBrowser.openAuthSessionAsync(url, returnTo)
  if (result.type !== 'success' || !result.url) {
    return null
  }
  const parsed = Linking.parse(result.url)
  const params = parsed.queryParams || {}
  if (params.code && params.state) {
    return exchangeKindeCode(params.code, params.state)
  }
  return {
    ...params,
    screen: parsed.hostname || String(parsed.path || '').replace(/^\//, ''),
  }
}
