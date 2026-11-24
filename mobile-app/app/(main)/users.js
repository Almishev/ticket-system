import { useCallback, useState } from 'react'
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Redirect, useFocusEffect } from 'expo-router'
import { api } from '../../src/api'
import { useAuth } from '../../src/auth'
import { ROLE_LABELS, USER_STATUS_LABELS } from '../../src/labels'
import { isValidPassword, PASSWORD_MESSAGE } from '../../src/password'
import { styles } from '../../src/theme'

const empty = { firstName: '', lastName: '', email: '', password: '', role: 'EMPLOYEE', department: '' }

export default function UsersScreen() {
  const { token, user } = useAuth()
  const [people, setPeople] = useState([])
  const [form, setForm] = useState(empty)
  const isAdmin = user?.role === 'ADMIN'

  const load = useCallback(async () => {
    const response = await api('/users', { token })
    setPeople(response.data || [])
  }, [token])

  useFocusEffect(
    useCallback(() => {
      if (user?.role === 'ADMIN' || user?.role === 'SUPPORT') {
        load().catch((error) => Alert.alert('Грешка', error.message))
      }
    }, [load, user?.role]),
  )

  if (user && user.role !== 'ADMIN' && user.role !== 'SUPPORT') {
    return <Redirect href="/tickets" />
  }

  async function createUser() {
    if (!isValidPassword(form.password)) {
      Alert.alert('Парола', PASSWORD_MESSAGE)
      return
    }
    try {
      await api('/users', { method: 'POST', token, body: { ...form, status: 'ACTIVE' } })
      setForm(empty)
      await load()
    } catch (error) {
      Alert.alert('Грешка', error.message)
    }
  }

  async function toggle(person) {
    const status = person.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    try {
      await api(`/users/${person.id}/status`, { method: 'PATCH', token, body: { status } })
      await load()
    } catch (error) {
      Alert.alert('Грешка', error.message)
    }
  }

  function remove(person) {
    Alert.alert('Изтриване', `${person.firstName} ${person.lastName}`, [
      { text: 'Отказ', style: 'cancel' },
      {
        text: 'Изтрий',
        style: 'destructive',
        onPress: async () => {
          try {
            await api(`/users/${person.id}`, { method: 'DELETE', token })
            await load()
          } catch (error) {
            Alert.alert('Грешка', error.message)
          }
        },
      },
    ])
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Потребители</Text>
      {isAdmin && (
        <View style={styles.card}>
          <TextInput style={styles.input} placeholder="Име" value={form.firstName} onChangeText={(firstName) => setForm({ ...form, firstName })} />
          <TextInput style={styles.input} placeholder="Фамилия" value={form.lastName} onChangeText={(lastName) => setForm({ ...form, lastName })} />
          <TextInput style={styles.input} placeholder="Имейл" autoCapitalize="none" value={form.email} onChangeText={(email) => setForm({ ...form, email })} />
          <TextInput style={styles.input} placeholder="Парола" secureTextEntry value={form.password} onChangeText={(password) => setForm({ ...form, password })} />
          <TextInput style={styles.input} placeholder="Отдел" value={form.department} onChangeText={(department) => setForm({ ...form, department })} />
          <View style={styles.row}>
            {['EMPLOYEE', 'SUPPORT', 'ADMIN'].map((role) => (
              <Pressable key={role} onPress={() => setForm({ ...form, role })}>
                <Text style={{ fontWeight: form.role === role ? '700' : '400' }}>{ROLE_LABELS[role]}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.button} onPress={createUser}>
            <Text style={styles.buttonText}>Нов потребител</Text>
          </Pressable>
        </View>
      )}
      {people.map((person) => (
        <View key={person.id} style={styles.card}>
          <Text style={{ fontWeight: '700' }}>{person.firstName} {person.lastName}</Text>
          <Text style={styles.muted}>{person.email}</Text>
          <Text>{ROLE_LABELS[person.role]} · {person.department}</Text>
          <Text>{USER_STATUS_LABELS[person.status]}</Text>
          {isAdmin && person.id !== user.id && (
            <View style={styles.row}>
              <Pressable onPress={() => toggle(person)}><Text>{person.status === 'ACTIVE' ? 'Спри' : 'Пусни'}</Text></Pressable>
              <Pressable onPress={() => remove(person)}><Text style={styles.error}>Изтрий</Text></Pressable>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  )
}
