import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth'
import { ROLE_LABELS } from '../Helper/labels'

const productName = 'Хелпдеск'

const ROLE_NAMES = {
  ADMIN: 'Администратор',
  SUPPORT: 'Поддръжка',
  EMPLOYEE: 'Служител',
  SUPER_ADMIN: 'Супер администратор',
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const year = new Date().getFullYear()
  const isSuper = user?.role === 'SUPER_ADMIN'
  if (isSuper && location.pathname !== '/companies') {
    return <Navigate to="/companies" replace />
  }
  if (!isSuper && location.pathname.startsWith('/companies')) {
    return <Navigate to="/tickets" replace />
  }
  const links = isSuper
    ? [{ to: '/companies', label: 'Фирми', icon: '🏢' }]
    : [
        { to: '/tickets', label: 'Заявки', icon: '🎫' },
        { to: '/categories', label: 'Категории', icon: '🏷️' },
      ]
  if (!isSuper && (user?.role === 'ADMIN' || user?.role === 'SUPPORT')) {
    links.push({ to: '/users', label: 'Потребители', icon: '👤' })
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>
          <span className="logo-mark" aria-hidden="true" />
          {productName}
        </h1>
        <div className="app-header-user">
          <span>
            {user?.firstName} {user?.lastName}
            {user?.companyName ? ` · ${user.companyName}` : ''} ({ROLE_NAMES[user?.role] || ROLE_LABELS[user?.role]})
          </span>
          <button type="button" className="btn-logout" onClick={logout}>
            Изход
          </button>
        </div>
      </header>
      <div className="app-body">
        <aside className="app-sidebar">
          <nav>
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? 'active' : undefined)}>
                <span className="nav-icon">{link.icon}</span>
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="app-main">
          <Outlet />
        </main>
      </div>
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

export function RequireAuth() {
  const { user, ready } = useAuth()
  if (!ready) {
    return <div className="p-5 text-center text-secondary">Зареждане...</div>
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return <AppLayout />
}
