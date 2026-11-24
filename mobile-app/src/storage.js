import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

export async function getStored(key) {
  if (Platform.OS === 'web') {
    return window.localStorage.getItem(key)
  }
  return SecureStore.getItemAsync(key)
}

export async function setStored(key, value) {
  if (Platform.OS === 'web') {
    window.localStorage.setItem(key, value)
    return
  }
  await SecureStore.setItemAsync(key, value)
}

export async function deleteStored(key) {
  try {
    if (Platform.OS === 'web') {
      window.localStorage.removeItem(key)
      return
    }
    await SecureStore.deleteItemAsync(key)
  } catch {
    // Стара сесия без запис не спира екрана.
  }
}
