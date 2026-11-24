import { useCallback, useState } from 'react'
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { api } from '../../src/api'
import { useAuth } from '../../src/auth'
import { styles } from '../../src/theme'

export default function CategoriesScreen() {
  const { token } = useAuth()
  const [categories, setCategories] = useState([])
  const [name, setName] = useState('')

  const load = useCallback(async () => {
    const response = await api('/categories', { token })
    setCategories(response.data || [])
  }, [token])

  useFocusEffect(
    useCallback(() => {
      load().catch((error) => Alert.alert('Грешка', error.message))
    }, [load]),
  )

  async function createCategory() {
    if (!name.trim()) {
      return
    }
    try {
      await api('/categories', { method: 'POST', token, body: { name: name.trim() } })
      setName('')
      await load()
    } catch (error) {
      Alert.alert('Грешка', error.message)
    }
  }

  async function toggle(category) {
    try {
      await api(`/categories/${category.id}/status`, { method: 'PATCH', token, body: { status: !category.active } })
      await load()
    } catch (error) {
      Alert.alert('Грешка', error.message)
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Категории</Text>
      <TextInput style={styles.input} placeholder="Нова категория" value={name} onChangeText={setName} />
      <Pressable style={styles.button} onPress={createCategory}>
        <Text style={styles.buttonText}>Добави</Text>
      </Pressable>
      {categories.map((category) => (
        <View key={category.id} style={styles.card}>
          <View style={styles.row}>
            <Text style={{ fontWeight: '700' }}>{category.name}</Text>
            <Pressable onPress={() => toggle(category)}>
              <Text>{category.active ? 'Активна' : 'Спряна'}</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  )
}
