import { useEffect } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import { useAuth } from '../auth'
import { useToast } from '../toast'

const ERRORS = {
  missing: 'Този имейл го има в Kinde, но няма фирма в хелпдеска. Отвори Регистрация и използвай същия имейл.',
  blocked: 'Фирмата е спряна или профилът не е активен.',
  state: 'Входът беше прекъснат. Опитай отново.',
}

export default function LoginPage() {
  const { user, ready } = useAuth()
  const toast = useToast()
  const [params] = useSearchParams()
  const error = params.get('error')

  useEffect(() => {
    if (!ready || user) {
      return
    }
    if (ERRORS[error]) {
      toast.error(ERRORS[error])
      return
    }
    window.location.replace('/api/auth/kinde/login')
  }, [error, ready, toast, user])

  if (!ready) {
    return <div className="text-center text-secondary">Зареждане...</div>
  }

  if (user) {
    return <Navigate to={user.role === 'SUPER_ADMIN' ? '/companies' : '/tickets'} replace />
  }

  if (!ERRORS[error]) {
    return <div className="text-center text-secondary">Отваряне на входа...</div>
  }

  return (
    <Card className="login-card shadow-sm">
      <Card.Body className="p-4">
        <h1 className="h3 mb-3">Вход</h1>
        {ERRORS[error] && <p className="text-danger">{ERRORS[error]}</p>}
        <p className="text-secondary">Входът продължава в Kinde с имейл и парола.</p>
        <Button as="a" href="/api/auth/kinde/login" className="w-100">
          Вход
        </Button>
        <p className="mt-3 mb-0">
          Нямаш профил? <a href="/api/auth/kinde/login?screen=register">Регистрация</a>
        </p>
      </Card.Body>
    </Card>
  )
}
