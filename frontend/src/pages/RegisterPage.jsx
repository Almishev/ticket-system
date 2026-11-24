import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import Form from 'react-bootstrap/Form'
import { api } from '../Helper/api'
import { useAuth } from '../auth'
import { isValidEik } from '../Helper/eik'
import { useToast } from '../toast'

export default function RegisterPage() {
  const { user, ready, acceptToken } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [token, setToken] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [eik, setEik] = useState('')
  const [activity, setActivity] = useState('')
  const [eikError, setEikError] = useState('')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const value = params.get('token')
    if (value) {
      setToken(value)
      return
    }
    window.location.replace('/api/auth/kinde/login?screen=register')
  }, [])

  if (!ready || !token) {
    return <div className="text-center text-secondary">Отваряне на регистрацията...</div>
  }

  if (user) {
    return <Navigate to={user.role === 'SUPER_ADMIN' ? '/companies' : '/tickets'} replace />
  }

  async function onSubmit(event) {
    event.preventDefault()
    const number = eik.trim()
    if (!isValidEik(number)) {
      setEikError('Невалиден ЕИК.')
      toast.error('Невалиден ЕИК.')
      return
    }
    setPending(true)
    try {
      await api('/auth/register/company', {
        method: 'POST',
        body: {
          token,
          companyName: companyName.trim(),
          eik: number,
          activity: activity.trim(),
        },
      })
      const profile = await acceptToken(token)
      toast.success('Фирмата е създадена.')
      navigate(profile.role === 'SUPER_ADMIN' ? '/companies' : '/tickets', { replace: true })
    } catch (requestError) {
      toast.error(requestError.message)
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="login-card shadow-sm">
      <Card.Body className="p-4">
        <h1 className="h3 mb-3">Фирма</h1>
        <p className="text-secondary">Акаунтът в Kinde е готов. Остават данните на фирмата.</p>
        <Form onSubmit={onSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Име на фирма</Form.Label>
            <Form.Control value={companyName} maxLength={200} onChange={(event) => setCompanyName(event.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>ЕИК</Form.Label>
            <Form.Control
              value={eik}
              inputMode="numeric"
              maxLength={13}
              isInvalid={Boolean(eikError)}
              onChange={(event) => {
                setEik(event.target.value.replace(/\D/g, '').slice(0, 13))
                setEikError('')
              }}
              required
            />
            <Form.Control.Feedback type="invalid">{eikError}</Form.Control.Feedback>
            <Form.Text>9 цифри за фирма или 13 цифри за поделение.</Form.Text>
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Label>Сфера на дейност</Form.Label>
            <Form.Control value={activity} maxLength={200} onChange={(event) => setActivity(event.target.value)} required />
          </Form.Group>
          <Button type="submit" className="w-100" disabled={pending}>
            {pending ? 'Създаване...' : 'Създай фирмата'}
          </Button>
        </Form>
        <p className="mt-3 mb-0">
          Вече имаш профил? <a href="/api/auth/kinde/login">Вход</a>
        </p>
      </Card.Body>
    </Card>
  )
}
