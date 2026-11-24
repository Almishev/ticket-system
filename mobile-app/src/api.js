import Constants from 'expo-constants'
import { Platform } from 'react-native'

export function apiUrl() {
  if (Platform.OS === 'web') {
    return 'http://localhost:8081/api'
  }
  return Constants.expoConfig?.extra?.apiUrl || 'http://192.168.80.110:8081/api'
}

function errorMessage(payload) {
  if (!payload) {
    return 'Заявката не успя'
  }
  if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    const details = Object.entries(payload.data)
      .map(([field, message]) => `${field}: ${message}`)
      .join(' ')
    if (details) {
      return `${payload.message}. ${details}`
    }
  }
  return payload.message || 'Заявката не успя'
}

export async function api(path, { method = 'GET', body, token } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${apiUrl()}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const text = await response.text()
  let payload = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = { message: text }
    }
  }
  if (!response.ok) {
    const error = new Error(errorMessage(payload))
    error.status = response.status
    throw error
  }
  return payload
}
