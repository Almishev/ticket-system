import { useState } from 'react'
import { Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import Landing from '../src/Landing'
import { startKinde, useAuth } from '../src/auth'
import { styles } from '../src/theme'

export default function HomeScreen() {
  const { user, ready, acceptToken } = useAuth()
  const router = useRouter()
  const [message, setMessage] = useState('')

  function enterApp(profile) {
    router.push(profile.role === 'SUPER_ADMIN' ? '/companies' : '/tickets')
  }

  async function open(screen) {
    setMessage('')
    try {
      const params = await startKinde(screen)
      if (!params) {
        return
      }
      if (params.screen === 'register' && params.token) {
        router.push({ pathname: '/register', params: { token: params.token } })
        return
      }
      if (params.token) {
        const profile = await acceptToken(params.token)
        enterApp(profile)
        return
      }
      if (params.error) {
        router.push({ pathname: '/login', params: { error: String(params.error) } })
      }
    } catch (error) {
      setMessage(error.message)
    }
  }

  if (!ready) {
    return (
      <View style={[styles.screen, styles.content, { justifyContent: 'center' }]}>
        <Text style={styles.muted}>Зареждане...</Text>
      </View>
    )
  }

  return (
    <Landing
      user={user}
      message={message}
      onLogin={() => open()}
      onRegister={() => open('register')}
      onEnterApp={() => enterApp(user)}
    />
  )
}
