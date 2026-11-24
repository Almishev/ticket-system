import { useCallback, useState } from 'react'
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { api } from '../../../src/api'
import { useAuth } from '../../../src/auth'
import { PRIORITY_LABELS, TICKET_STATUS_LABELS, formatDate } from '../../../src/labels'
import { styles } from '../../../src/theme'

const empty = { title: '', description: '', priority: 'MEDIUM', categoryId: '' }

export default function TicketsScreen() {
  const { token, user } = useAuth()
  const router = useRouter()
  const employee = user?.role === 'EMPLOYEE'
  const [mineOnly, setMineOnly] = useState(false)
  const [tickets, setTickets] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(empty)
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    const path = employee || mineOnly ? `/tickets/my?userId=${user.id}` : '/tickets'
    const [ticketResponse, categoryResponse] = await Promise.all([
      api(path, { token }),
      api('/categories', { token }),
    ])
    setTickets(ticketResponse.data || [])
    setCategories((categoryResponse.data || []).filter((category) => category.active))
  }, [employee, mineOnly, token, user?.id])

  useFocusEffect(
    useCallback(() => {
      load().catch((error) => Alert.alert('Грешка', error.message))
    }, [load]),
  )

  async function createTicket() {
    if (!form.title.trim() || !form.categoryId) {
      Alert.alert('Заявка', 'Попълни заглавие и категория.')
      return
    }
    try {
      await api('/tickets', {
        method: 'POST',
        token,
        body: {
          title: form.title.trim(),
          description: form.description.trim(),
          priority: form.priority,
          categoryId: Number(form.categoryId),
          createdById: user.id,
        },
      })
      setForm(empty)
      setCreating(false)
      await load()
    } catch (error) {
      Alert.alert('Грешка', error.message)
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.row}>
        <Text style={styles.title}>Заявки</Text>
        <Pressable style={styles.button} onPress={() => setCreating((value) => !value)}>
          <Text style={styles.buttonText}>Нова заявка</Text>
        </Pressable>
      </View>
      {!employee && (
        <View style={styles.row}>
          <Pressable style={[styles.button, mineOnly ? styles.ghost : null]} onPress={() => setMineOnly(false)}>
            <Text style={mineOnly ? styles.ghostText : styles.buttonText}>Всички</Text>
          </Pressable>
          <Pressable style={[styles.button, mineOnly ? null : styles.ghost]} onPress={() => setMineOnly(true)}>
            <Text style={mineOnly ? styles.buttonText : styles.ghostText}>Моите</Text>
          </Pressable>
        </View>
      )}
      {creating && (
        <View style={styles.card}>
          <TextInput style={styles.input} placeholder="Заглавие" value={form.title} onChangeText={(title) => setForm({ ...form, title })} />
          <TextInput
            style={styles.input}
            placeholder="Описание"
            value={form.description}
            onChangeText={(description) => setForm({ ...form, description })}
          />
          <View style={styles.row}>
            {Object.keys(PRIORITY_LABELS).map((priority) => (
              <Pressable key={priority} onPress={() => setForm({ ...form, priority })}>
                <Text style={{ fontWeight: form.priority === priority ? '700' : '400' }}>{PRIORITY_LABELS[priority]}</Text>
              </Pressable>
            ))}
          </View>
          {categories.map((category) => (
            <Pressable key={category.id} onPress={() => setForm({ ...form, categoryId: category.id })}>
              <Text style={{ fontWeight: form.categoryId === category.id ? '700' : '400' }}>{category.name}</Text>
            </Pressable>
          ))}
          <Pressable style={styles.button} onPress={createTicket}>
            <Text style={styles.buttonText}>Създай</Text>
          </Pressable>
        </View>
      )}
      <Text style={styles.muted}>{tickets.length} записа</Text>
      {tickets.map((ticket) => (
        <Pressable key={ticket.id} style={styles.card} onPress={() => router.push(`/tickets/${ticket.id}`)}>
          <Text style={styles.muted}>{ticket.ticketNumber}</Text>
          <Text style={{ fontWeight: '700', fontSize: 16 }}>{ticket.title}</Text>
          <Text>
            {PRIORITY_LABELS[ticket.priority]} · {TICKET_STATUS_LABELS[ticket.status]}
          </Text>
          <Text style={styles.muted}>{formatDate(ticket.createdAt)}</Text>
        </Pressable>
      ))}
      {tickets.length === 0 && <Text style={styles.muted}>Няма заявки</Text>}
    </ScrollView>
  )
}
