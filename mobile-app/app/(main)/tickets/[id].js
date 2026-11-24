import { useCallback, useState } from 'react'
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { api } from '../../../src/api'
import { useAuth } from '../../../src/auth'
import { NEXT_TICKET_STATUS, PRIORITY_LABELS, TICKET_STATUS_LABELS, VISIBILITY_LABELS, formatDate } from '../../../src/labels'
import { styles } from '../../../src/theme'

export default function TicketScreen() {
  const { id } = useLocalSearchParams()
  const { token, user } = useAuth()
  const router = useRouter()
  const [ticket, setTicket] = useState(null)
  const [comments, setComments] = useState([])
  const [support, setSupport] = useState([])
  const [message, setMessage] = useState('')
  const [visibility, setVisibility] = useState('PUBLIC')
  const canManage = user?.role === 'ADMIN' || user?.role === 'SUPPORT'
  const employee = user?.role === 'EMPLOYEE'

  const load = useCallback(async () => {
    const ticketResponse = await api(`/tickets/${id}`, { token })
    const commentResponse = await api(`/tickets/${id}/comments`, { token })
    setTicket(ticketResponse.data)
    setComments(commentResponse.data || [])
    if (canManage) {
      const users = await api('/users', { token })
      setSupport((users.data || []).filter((person) => person.role === 'SUPPORT' && person.status === 'ACTIVE'))
    }
  }, [canManage, id, token])

  useFocusEffect(
    useCallback(() => {
      load().catch((error) => Alert.alert('Грешка', error.message))
    }, [load]),
  )

  async function changeStatus(status) {
    try {
      await api(`/tickets/${id}/status`, { method: 'PUT', token, body: { status } })
      await load()
    } catch (error) {
      Alert.alert('Грешка', error.message)
    }
  }

  async function assign(supportUserId) {
    try {
      await api(`/tickets/${id}/assign`, { method: 'PUT', token, body: { supportUserId } })
      await load()
    } catch (error) {
      Alert.alert('Грешка', error.message)
    }
  }

  async function addComment() {
    if (!message.trim()) {
      return
    }
    try {
      await api(`/tickets/${id}/comments`, {
        method: 'POST',
        token,
        body: { message: message.trim(), userId: user.id, visiblity: employee ? 'PUBLIC' : visibility },
      })
      setMessage('')
      await load()
    } catch (error) {
      Alert.alert('Грешка', error.message)
    }
  }

  function remove() {
    Alert.alert('Изтриване', 'Заявката ще бъде изтрита.', [
      { text: 'Отказ', style: 'cancel' },
      {
        text: 'Изтрий',
        style: 'destructive',
        onPress: async () => {
          try {
            await api(`/tickets/${id}`, { method: 'DELETE', token })
            router.replace('/tickets')
          } catch (error) {
            Alert.alert('Грешка', error.message)
          }
        },
      },
    ])
  }

  if (!ticket) {
    return <View style={[styles.screen, styles.content]}><Text style={styles.muted}>Зареждане...</Text></View>
  }

  const nextStatuses = NEXT_TICKET_STATUS[ticket.status] || []

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()}><Text style={styles.muted}>Към заявките</Text></Pressable>
      <Text style={styles.muted}>{ticket.ticketNumber}</Text>
      <Text style={styles.title}>{ticket.title}</Text>
      <Text>{PRIORITY_LABELS[ticket.priority]} · {TICKET_STATUS_LABELS[ticket.status]}</Text>
      {ticket.description ? <Text>{ticket.description}</Text> : null}
      <Text style={styles.muted}>Категория: {ticket.categoryName}</Text>
      <Text style={styles.muted}>Създал: {ticket.createdByName}</Text>
      <Text style={styles.muted}>Възложен: {ticket.assignedToName || '—'}</Text>
      <Text style={styles.muted}>{formatDate(ticket.createdAt)}</Text>
      {user?.role === 'ADMIN' && (
        <Pressable style={[styles.button, styles.danger]} onPress={remove}>
          <Text style={styles.buttonText}>Изтрий</Text>
        </Pressable>
      )}
      {canManage && nextStatuses.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.label}>Статус</Text>
          {nextStatuses.map((status) => (
            <Pressable key={status} style={styles.button} onPress={() => changeStatus(status)}>
              <Text style={styles.buttonText}>{TICKET_STATUS_LABELS[status]}</Text>
            </Pressable>
          ))}
        </View>
      )}
      {canManage && (
        <View style={styles.card}>
          <Text style={styles.label}>Възложи</Text>
          {support.map((person) => (
            <Pressable key={person.id} onPress={() => assign(person.id)}>
              <Text>{person.firstName} {person.lastName}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <Text style={styles.title}>Коментари</Text>
      {comments.map((comment) => (
        <View key={comment.id} style={styles.card}>
          <View style={styles.row}>
            <Text style={{ fontWeight: '700' }}>{comment.userName}</Text>
            <Text style={styles.muted}>{formatDate(comment.createdAt)}</Text>
          </View>
          <Text style={styles.muted}>{VISIBILITY_LABELS[comment.visiblity]}</Text>
          <Text>{comment.message}</Text>
        </View>
      ))}
      <TextInput style={styles.input} placeholder="Коментар" value={message} onChangeText={setMessage} />
      {!employee && (
        <View style={styles.row}>
          <Pressable onPress={() => setVisibility('PUBLIC')}><Text style={{ fontWeight: visibility === 'PUBLIC' ? '700' : '400' }}>Публичен</Text></Pressable>
          <Pressable onPress={() => setVisibility('INTERNAL')}><Text style={{ fontWeight: visibility === 'INTERNAL' ? '700' : '400' }}>Вътрешен</Text></Pressable>
        </View>
      )}
      <Pressable style={styles.button} onPress={addComment}>
        <Text style={styles.buttonText}>Добави коментар</Text>
      </Pressable>
    </ScrollView>
  )
}
