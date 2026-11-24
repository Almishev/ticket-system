import { useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { api } from '../src/api'
import { useAuth } from '../src/auth'
import { isValidEik } from '../src/eik'
import { styles } from '../src/theme'

export default function RegisterScreen() {
  const { token } = useLocalSearchParams()
  const { acceptToken } = useAuth()
  const router = useRouter()
  const [companyName, setCompanyName] = useState('')
  const [eik, setEik] = useState('')
  const [activity, setActivity] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit() {
    const number = eik.trim()
    if (!isValidEik(number)) {
      setError('Невалиден ЕИК.')
      return
    }
    setPending(true)
    setError('')
    try {
      await api('/auth/register/company', {
        method: 'POST',
        body: { token, companyName: companyName.trim(), eik: number, activity: activity.trim() },
      })
      const profile = await acceptToken(String(token))
      router.replace(profile.role === 'SUPER_ADMIN' ? '/companies' : '/tickets')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setPending(false)
    }
  }

  return (
    <View style={[styles.screen, styles.content]}>
      <Text style={styles.title}>Фирма</Text>
      <Text style={styles.muted}>Акаунтът в Kinde е готов. Остават данните на фирмата.</Text>
      <Text style={styles.label}>Име на фирма</Text>
      <TextInput style={styles.input} value={companyName} onChangeText={setCompanyName} />
      <Text style={styles.label}>ЕИК</Text>
      <TextInput
        style={styles.input}
        value={eik}
        keyboardType="number-pad"
        maxLength={13}
        onChangeText={(value) => setEik(value.replace(/\D/g, '').slice(0, 13))}
      />
      <Text style={styles.muted}>9 цифри за фирма или 13 цифри за поделение.</Text>
      <Text style={styles.label}>Сфера на дейност</Text>
      <TextInput style={styles.input} value={activity} onChangeText={setActivity} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.button} disabled={pending} onPress={submit}>
        <Text style={styles.buttonText}>{pending ? 'Създаване...' : 'Създай фирмата'}</Text>
      </Pressable>
    </View>
  )
}
