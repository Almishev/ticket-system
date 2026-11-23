export const PRIORITY_RANK = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
}

function valueOf(row, key) {
  if (typeof key === 'function') {
    return key(row)
  }
  return row?.[key]
}

export function compareValues(left, right, type) {
  if (left == null && right == null) {
    return 0
  }
  if (left == null || left === '') {
    return 1
  }
  if (right == null || right === '') {
    return -1
  }
  if (type === 'date') {
    return new Date(left).getTime() - new Date(right).getTime()
  }
  if (type === 'priority') {
    return (PRIORITY_RANK[left] || 0) - (PRIORITY_RANK[right] || 0)
  }
  return String(left).localeCompare(String(right), 'bg', { sensitivity: 'base' })
}

export function sortRows(rows, sort) {
  return [...rows].sort((left, right) => {
    const result = compareValues(valueOf(left, sort.key), valueOf(right, sort.key), sort.type)
    return sort.direction === 'desc' ? -result : result
  })
}

export function nextSort(current, key, type) {
  if (current.key === key) {
    return { key, type, direction: current.direction === 'asc' ? 'desc' : 'asc' }
  }
  return { key, type, direction: type === 'date' || type === 'priority' ? 'desc' : 'asc' }
}
