import { StyleSheet } from 'react-native'

export const colors = {
  header: '#1e293b',
  page: '#f4f6f8',
  card: '#ffffff',
  text: '#1e293b',
  muted: '#64748b',
  line: '#e2e8f0',
  primary: '#2563eb',
  danger: '#dc2626',
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  content: { padding: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  muted: { color: colors.muted, fontSize: 15 },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.line, gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  label: { color: colors.muted, fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  button: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  danger: { backgroundColor: colors.danger },
  ghost: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line },
  ghostText: { color: colors.text, fontWeight: '600' },
  chip: { backgroundColor: '#e2e8f0', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  chipText: { fontSize: 12, color: colors.text },
  error: { color: colors.danger },
})
