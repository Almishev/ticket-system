import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth'

const productName = 'Хелпдеск'

export default function PublicLayout() {
  const { user } = useAuth()
  const year = new Date().getFullYear()

  return (
    <div className="app-shell">
      <header className="app-header public-header">
        <NavLink to="/" end className="brand">
          <span className="logo-mark" aria-hidden="true" />
          {productName}
        </NavLink>
        <nav className="public-nav">
          {user ? (
            <NavLink to={user.role === 'SUPER_ADMIN' ? '/companies' : '/tickets'}>
              {user.role === 'SUPER_ADMIN' ? 'Фирми' : 'Заявки'}
            </NavLink>
          ) : (
            <a href="/api/auth/kinde/login">Вход</a>
          )}
        </nav>
      </header>
      <main className="app-main public-main">
        <Outlet />
      </main>
      <footer className="app-footer">
        <span className="brand footer-brand">
          <span className="logo-mark" aria-hidden="true" />
          {productName}
        </span>
        <span>© {year}</span>
      </footer>
    </div>
  )
}
