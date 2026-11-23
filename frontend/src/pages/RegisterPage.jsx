import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import Form from 'react-bootstrap/Form'
import { api } from '../Helper/api'
import { useAuth } from '../auth'
import { isValidEik } from '../Helper/eik'
import { isValidPassword, PASSWORD_MESSAGE } from '../Helper/password'
import { useToast } from '../toast'

const emptyForm = {
  companyName: '',
  eik: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  activity: '',
}

export default function RegisterPage() {
  const { user, ready, login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [eikError, setEikError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [pending, setPending] = useState(false)

  if (!ready) {
    return <div className="text-center text-secondary">Зареждане...</div>
  }

  if (user) {
    return <Navigate to={user.role === 'SUPER_ADMIN' ? '/companies' : '/tickets'} replace />
  }

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    if (field === 'eik') {
      setEikError('')
    }
    if (field === 'password') {
      setPasswordError('')
    }
  }

  async function onSubmit(event) {
    event.preventDefault()
    const eik = form.eik.trim()
    if (!isValidEik(eik)) {
      setEikError('Невалиден ЕИК.')
      toast.error('Невалиден ЕИК.')
      return
    }
    if (!isValidPassword(form.password)) {
      setPasswordError(PASSWORD_MESSAGE)
      toast.error(PASSWORD_MESSAGE)
      return
    }
    setPending(true)
    try {
      await api('/auth/register', {
        method: 'POST',
        body: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          password: form.password,
          activity: form.activity.trim(),
          companyName: form.companyName.trim(),
          eik,
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
            <Form.Label>Име на фирма</Form.Label>
            <Form.Control
              value={form.companyName}
              maxLength={200}
              onChange={(event) => update('companyName', event.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>ЕИК</Form.Label>
            <Form.Control
              value={form.eik}
              inputMode="numeric"
              maxLength={13}
              isInvalid={Boolean(eikError)}
              onChange={(event) => update('eik', event.target.value.replace(/\D/g, '').slice(0, 13))}
              required
            />
            <Form.Control.Feedback type="invalid">{eikError}</Form.Control.Feedback>
            <Form.Text>9 цифри за фирма или 13 цифри за поделение.</Form.Text>
          </Form.Group>
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
            <Form.Label>Сфера на дейност</Form.Label>
            <Form.Control
              value={form.activity}
              maxLength={200}
              onChange={(event) => update('activity', event.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Label>Парола</Form.Label>
            <Form.Control
              type="password"
              autoComplete="new-password"
              value={form.password}
              isInvalid={Boolean(passwordError)}
              onChange={(event) => update('password', event.target.value)}
              required
            />
            <Form.Control.Feedback type="invalid">{passwordError}</Form.Control.Feedback>
            <Form.Text>{PASSWORD_MESSAGE} Първият потребител е администратор на фирмата.</Form.Text>
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
