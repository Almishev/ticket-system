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

export async function api(path, { method = 'GET', body, auth } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  if (auth?.token) {
    headers.Authorization = `Bearer ${auth.token}`
  }

  const response = await fetch(`/api${path}`, {
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
    error.payload = payload
    throw error
  }
  return payload
}
