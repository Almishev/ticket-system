import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import Form from 'react-bootstrap/Form'
import { api } from '../api'
import { useAuth } from '../auth'
import { useToast } from '../toast'

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  department: '',
}

export default function RegisterPage() {
  const { user, ready, login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [pending, setPending] = useState(false)

  if (!ready) {
    return <div className="text-center text-secondary">Зареждане...</div>
  }

  if (user) {
    return <Navigate to="/tickets" replace />
  }

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function onSubmit(event) {
    event.preventDefault()
    setPending(true)
    try {
      await api('/auth/register', {
        method: 'POST',
        body: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          password: form.password,
          department: form.department.trim(),
          role: 'EMPLOYEE',
        },
      })
      await login(form.email.trim(), form.password)
      toast.success('Профилът е създаден.')
      navigate('/tickets', { replace: true })
    } catch (requestError) {
      toast.error(requestError.message)
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="login-card shadow-sm">
      <Card.Body className="p-4">
        <h1 className="h3 mb-4">Регистрация</h1>
        <Form onSubmit={onSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Име</Form.Label>
            <Form.Control
              value={form.firstName}
              maxLength={100}
              onChange={(event) => update('firstName', event.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Фамилия</Form.Label>
            <Form.Control
              value={form.lastName}
              maxLength={100}
              onChange={(event) => update('lastName', event.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Имейл</Form.Label>
            <Form.Control
              type="email"
              value={form.email}
              autoComplete="email"
              onChange={(event) => update('email', event.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Отдел</Form.Label>
            <Form.Control
              value={form.department}
              onChange={(event) => update('department', event.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Label>Парола</Form.Label>
            <Form.Control
              type="password"
              minLength={4}
              autoComplete="new-password"
              value={form.password}
              onChange={(event) => update('password', event.target.value)}
              required
            />
            <Form.Text>Поне 4 символа. Новият профил е със роля служител.</Form.Text>
          </Form.Group>
          <Button type="submit" className="w-100" disabled={pending}>
            {pending ? 'Създаване...' : 'Създай профил'}
          </Button>
        </Form>
        <p className="mt-3 mb-0">
          Вече имаш профил? <Link to="/login">Вход</Link>
        </p>
      </Card.Body>
    </Card>
  )
}
