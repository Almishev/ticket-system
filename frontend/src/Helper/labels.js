export const ROLE_LABELS = {
  EMPLOYEE: 'Служител',
  SUPPORT: 'Поддръжка',
  ADMIN: 'Админ',
  SUPER_ADMIN: 'Супер администратор',
}

export const COMPANY_STATUS_LABELS = {
  ACTIVE: 'Активна',
  INACTIVE: 'Неактивна',
}

export const USER_STATUS_LABELS = {
  ACTIVE: 'Активен',
  INACTIVE: 'Неактивен',
}

export const PRIORITY_LABELS = {
  LOW: 'Нисък',
  MEDIUM: 'Среден',
  HIGH: 'Висок',
  CRITICAL: 'Критичен',
}

export const TICKET_STATUS_LABELS = {
  NEW: 'Нов',
  OPEN: 'Отворен',
  ASSIGNED: 'Възложен',
  IN_PROGRESS: 'В процес',
  WAITING_FOR_USER: 'Чака потребител',
  RESOLVED: 'Решен',
  CLOSED: 'Затворен',
  CANCELLED: 'Отменен',
}

export const VISIBILITY_LABELS = {
  PUBLIC: 'Публичен',
  INTERNAL: 'Вътрешен',
}

export const NEXT_TICKET_STATUS = {
  OPEN: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['WAITING_FOR_USER', 'RESOLVED'],
  WAITING_FOR_USER: ['IN_PROGRESS'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: [],
  CANCELLED: [],
  NEW: [],
}

export function formatDate(value) {
  if (!value) {
    return '—'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString('bg-BG', { dateStyle: 'short', timeStyle: 'short' })
}

export function statusBadge(status) {
  const map = {
    OPEN: 'secondary',
    ASSIGNED: 'info',
    IN_PROGRESS: 'primary',
    WAITING_FOR_USER: 'warning',
    RESOLVED: 'success',
    CLOSED: 'dark',
    CANCELLED: 'danger',
    NEW: 'secondary',
    ACTIVE: 'success',
    INACTIVE: 'secondary',
    LOW: 'secondary',
    MEDIUM: 'info',
    HIGH: 'warning',
    CRITICAL: 'danger',
    PUBLIC: 'success',
    INTERNAL: 'dark',
  }
  return map[status] || 'secondary'
}
