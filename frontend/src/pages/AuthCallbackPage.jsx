import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'

export default function AuthCallbackPage() {
  const { acceptToken } = useAuth()
  const navigate = useNavigate()
  const started = useRef(false)

  useEffect(() => {
    if (started.current) {
      return
    }
    started.current = true
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const token = params.get('token')
    if (!token) {
      navigate('/login?error=state', { replace: true })
      return
    }
    acceptToken(token)
      .then((profile) => {
        navigate(profile.role === 'SUPER_ADMIN' ? '/companies' : '/tickets', { replace: true })
      })
      .catch(() => {
        navigate('/login?error=missing', { replace: true })
      })
  }, [acceptToken, navigate])

  return <div className="text-center text-secondary">Влизане...</div>
}
