import Constants from 'expo-constants'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { api } from './api'
import { deleteStored, getStored, setStored } from './storage'

const PUSH_KEY = 'helpdesk-push'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export async function registerPush(authToken) {
  if (Platform.OS === 'web') {
    return null
  }
  const permission = await Notifications.requestPermissionsAsync()
  if (permission.status !== 'granted') {
    return null
  }
  const projectId = Constants.expoConfig?.extra?.eas?.projectId
  const push = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)
  await setStored(PUSH_KEY, push.data)
  await api('/notifications/token', { method: 'POST', token: authToken, body: { token: push.data } })
  return push.data
}

export async function unregisterPush(authToken) {
  const push = await getStored(PUSH_KEY)
  if (push && authToken) {
    await api('/notifications/token', { method: 'DELETE', token: authToken, body: { token: push } })
  }
  await deleteStored(PUSH_KEY)
}
