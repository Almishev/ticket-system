import { Pressable, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { LOGIN_ERRORS } from '../src/labels'
import { styles } from '../src/theme'

export default function LoginScreen() {
  const params = useLocalSearchParams()
  const router = useRouter()
  const error = LOGIN_ERRORS[params.error] || 'Входът не мина.'

  return (
    <View style={[styles.screen, styles.content, { justifyContent: 'center' }]}>
      <Text style={styles.title}>Вход</Text>
      <Text style={styles.error}>{error}</Text>
      <Pressable style={styles.button} onPress={() => router.replace('/')}>
        <Text style={styles.buttonText}>Към началото</Text>
      </Pressable>
    </View>
  )
}
