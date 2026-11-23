import { Link } from 'react-router-dom'
import Button from 'react-bootstrap/Button'
import { useAuth } from '../auth'

export default function HomePage() {
  const { user, ready } = useAuth()

  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="hero-kicker">За екипа</p>
        <h1>
          <span className="logo-mark" aria-hidden="true" />
          Хелпдеск
        </h1>
        <p className="hero-lead">Система за заявки към поддръжката</p>
        <p className="hero-text">
          Служителят описва проблема. Поддръжката поема заявката и я води до решение.
        </p>
        <div className="hero-actions">
          {ready && user ? (
            <Button as={Link} to={user.role === 'SUPER_ADMIN' ? '/companies' : '/tickets'}>
              {user.role === 'SUPER_ADMIN' ? 'Към фирмите' : 'Към заявките'}
            </Button>
          ) : (
            <Button as={Link} to="/login">
              Вход
            </Button>
          )}
          {ready && !user && (
            <p className="hero-register mb-0">
              Нямаш профил? <Link to="/register">Регистрация</Link>
            </p>
          )}
        </div>
      </div>
      <div className="hero-media">
        <img src="/images/help-desk.jpg" alt="Работа по заявка за поддръжка" />
      </div>
    </section>
  )
}
