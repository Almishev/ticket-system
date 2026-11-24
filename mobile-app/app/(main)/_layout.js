import { Pressable, Text, View } from 'react-native'
import { Redirect, Tabs } from 'expo-router'
import { useAuth } from '../../src/auth'
import { ROLE_NAMES } from '../../src/labels'
import { colors } from '../../src/theme'

export default function MainLayout() {
  const { user, ready, logout } = useAuth()
  if (!ready) {
    return null
  }
  if (!user) {
    return <Redirect href="/" />
  }
  const superAdmin = user.role === 'SUPER_ADMIN'
  const canUsers = user.role === 'ADMIN' || user.role === 'SUPPORT'

  return (
    <View style={{ flex: 1 }}>
      <View style={{ backgroundColor: colors.header, paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12 }}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 18 }}>Хелпдеск</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <Text style={{ color: '#e2e8f0', flex: 1 }}>
            {user.firstName} {user.lastName}
            {user.companyName ? ` · ${user.companyName}` : ''} ({ROLE_NAMES[user.role]})
          </Text>
          <Pressable onPress={logout}>
            <Text style={{ color: '#fecaca', fontWeight: '700' }}>Изход</Text>
          </Pressable>
        </View>
      </View>
      <Tabs style={{ flex: 1 }} screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary }}>
        <Tabs.Screen name="tickets" options={{ title: 'Заявки', href: superAdmin ? null : undefined }} />
        <Tabs.Screen name="categories" options={{ title: 'Категории', href: superAdmin ? null : undefined }} />
        <Tabs.Screen name="users" options={{ title: 'Потребители', href: canUsers ? undefined : null }} />
        <Tabs.Screen name="companies" options={{ title: 'Фирми', href: superAdmin ? undefined : null }} />
      </Tabs>
    </View>
  )
}
