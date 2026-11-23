import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import Form from 'react-bootstrap/Form'
import { useAuth } from '../auth'
import { useToast } from '../toast'

export default function LoginPage() {
  const { user, ready, login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)

  if (!ready) {
    return <div className="text-center text-secondary">Зареждане...</div>
  }

  if (user) {
    return <Navigate to="/tickets" replace />
  }

  async function onSubmit(event) {
    event.preventDefault()
    setPending(true)
    try {
      await login(email, password)
      navigate('/tickets', { replace: true })
    } catch (requestError) {
      toast.error(requestError.status === 401 ? 'Грешен имейл или парола.' : requestError.message)
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="login-card shadow-sm">
      <Card.Body className="p-4">
        <h1 className="h3 mb-4">Вход</h1>
        <Form onSubmit={onSubmit}>
          <Form.Group className="mb-3" controlId="email">
            <Form.Label>Имейл</Form.Label>
            <Form.Control
              type="email"
              value={email}
              autoComplete="username"
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-4" controlId="password">
            <Form.Label>Парола</Form.Label>
            <Form.Control
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </Form.Group>
          <Button type="submit" className="w-100" disabled={pending}>
            {pending ? 'Влизане...' : 'Вход'}
          </Button>
        </Form>
        <p className="mt-3 mb-0">
          Нямаш профил? <Link to="/register">Регистрация</Link>
        </p>
      </Card.Body>
    </Card>
  )
}
