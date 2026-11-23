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
          {productName}
        </NavLink>
        <nav className="public-nav">
          {user ? <NavLink to="/tickets">Заявки</NavLink> : <NavLink to="/login">Вход</NavLink>}
        </nav>
      </header>
      <main className="app-main public-main">
        <Outlet />
      </main>
      <footer className="app-footer">
        <span>{productName}</span>
        <span>© {year}</span>
      </footer>
    </div>
  )
}
