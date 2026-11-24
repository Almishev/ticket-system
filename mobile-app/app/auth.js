import { useEffect } from 'react'
import { Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { exchangeKindeCode, useAuth } from '../src/auth'
import { styles } from '../src/theme'

export default function AuthScreen() {
  const params = useLocalSearchParams()
  const { acceptToken } = useAuth()
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    async function enter(token) {
      const profile = await acceptToken(String(token))
      if (!cancelled) {
        router.replace(profile.role === 'SUPER_ADMIN' ? '/companies' : '/tickets')
      }
    }

    async function finish() {
      try {
        if (params.code && params.state) {
          const result = await exchangeKindeCode(params.code, params.state)
          if (cancelled) {
            return
          }
          if (result?.screen === 'register' && result.token) {
            router.replace({ pathname: '/register', params: { token: result.token } })
            return
          }
          if (result?.token) {
            await enter(result.token)
            return
          }
          router.replace({ pathname: '/login', params: { error: String(result?.error || 'state') } })
          return
        }
        if (!params.token) {
          router.replace('/')
          return
        }
        await enter(params.token)
      } catch {
        if (!cancelled) {
          router.replace({ pathname: '/login', params: { error: 'state' } })
        }
      }
    }

    finish()
    return () => {
      cancelled = true
    }
  }, [acceptToken, params.code, params.state, params.token, router])

  return (
    <View style={[styles.screen, styles.content]}>
      <Text style={styles.muted}>Влизане...</Text>
    </View>
  )
}
