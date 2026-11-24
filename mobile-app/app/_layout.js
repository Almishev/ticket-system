import { useEffect } from 'react'
import { Stack, useRouter } from 'expo-router'
import * as Notifications from 'expo-notifications'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from '../src/auth'

function NotificationLink() {
  const router = useRouter()

  useEffect(() => {
    function openTicket(response) {
      const ticketId = response?.notification?.request?.content?.data?.ticketId
      if (ticketId) {
        router.push(`/tickets/${ticketId}`)
      }
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(openTicket)
    Notifications.getLastNotificationResponseAsync().then(openTicket).catch(() => {})
    return () => subscription.remove()
  }, [router])

  return null
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NotificationLink />
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </SafeAreaProvider>
  )
}
