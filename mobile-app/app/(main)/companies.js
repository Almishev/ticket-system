import { useCallback, useState } from 'react'
import { Alert, Pressable, ScrollView, Text, View } from 'react-native'
import { Redirect, useFocusEffect } from 'expo-router'
import { api } from '../../src/api'
import { useAuth } from '../../src/auth'
import { COMPANY_STATUS_LABELS, formatDate } from '../../src/labels'
import { styles } from '../../src/theme'

export default function CompaniesScreen() {
  const { token, user } = useAuth()
  const [companies, setCompanies] = useState([])

  const load = useCallback(async () => {
    const response = await api('/companies', { token })
    setCompanies(response.data || [])
  }, [token])

  useFocusEffect(
    useCallback(() => {
      if (user?.role === 'SUPER_ADMIN') {
        load().catch((error) => Alert.alert('Грешка', error.message))
      }
    }, [load, user?.role]),
  )

  if (user && user.role !== 'SUPER_ADMIN') {
    return <Redirect href="/tickets" />
  }

  async function toggle(company) {
    const status = company.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    try {
      await api(`/companies/${company.id}/status`, { method: 'PATCH', token, body: { status } })
      await load()
    } catch (error) {
      Alert.alert('Грешка', error.message)
    }
  }

  function remove(company) {
    Alert.alert('Изтриване', company.name, [
      { text: 'Отказ', style: 'cancel' },
      {
        text: 'Изтрий',
        style: 'destructive',
        onPress: async () => {
          try {
            await api(`/companies/${company.id}`, { method: 'DELETE', token })
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
      <Text style={styles.title}>Фирми</Text>
      {companies.map((company) => (
        <View key={company.id} style={styles.card}>
          <Text style={{ fontWeight: '700', fontSize: 16 }}>{company.name}</Text>
          <Text>ЕИК {company.eik}</Text>
          <Text style={styles.muted}>{company.activity || '—'}</Text>
          <Text>{COMPANY_STATUS_LABELS[company.status]} · {formatDate(company.createdAt)}</Text>
          <View style={styles.row}>
            <Pressable onPress={() => toggle(company)}>
              <Text>{company.status === 'ACTIVE' ? 'Спри' : 'Пусни'}</Text>
            </Pressable>
            <Pressable onPress={() => remove(company)}>
              <Text style={styles.error}>Изтрий</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  )
}
