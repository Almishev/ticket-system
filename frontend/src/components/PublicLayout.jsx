import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth'

const productName = 'Хелпдеск'
const loginHref = '/api/auth/kinde/login'

const sectionLinks = [
  ['/how', 'Как работи'],
  ['/product', 'Какво включва'],
  ['/price', 'Цена'],
  ['/faq', 'Въпроси'],
]

export default function PublicLayout() {
  const { user } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const year = new Date().getFullYear()
  const appPath = user?.role === 'SUPER_ADMIN' ? '/companies' : '/tickets'
  const appLabel = user?.role === 'SUPER_ADMIN' ? 'Фирми' : 'Заявки'

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname, location.hash])

  return (
    <div className="app-shell">
      <header className="app-header public-header">
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={menuOpen}
          aria-controls="public-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="sr-only">{menuOpen ? 'Затвори менюто' : 'Отвори менюто'}</span>
          <span className="nav-toggle-bars" aria-hidden="true" />
        </button>
        <div className="public-header-start">
          <NavLink to="/" end className="brand">
            <span className="logo-mark" aria-hidden="true" />
            {productName}
          </NavLink>
        </div>
        <nav id="public-menu" className={menuOpen ? 'public-nav is-open' : 'public-nav'}>
          {sectionLinks.map(([hash, label]) => (
            <Link key={hash} to={`/#${hash.slice(1)}`} onClick={() => setMenuOpen(false)}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="public-header-end">
          {user ? (
            <NavLink className="nav-cta" to={appPath}>{appLabel}</NavLink>
          ) : (
            <a className="nav-cta" href={loginHref}>Вход</a>
          )}
        </div>
      </header>
      <main className="app-main public-main">
        <Outlet />
      </main>
      <footer className="app-footer public-footer">
        <span className="brand footer-brand">
          <span className="logo-mark" aria-hidden="true" />
          {productName}
        </span>
        <span className="public-footer-meta">
          продукт на <a href="https://www.pirinpixel.com/" target="_blank" rel="noreferrer">Pirin Pixel</a>
          {' · '}<a href="tel:+359877382224">0877 382 224</a>
          {' · '}<a href="mailto:pirinpixel@gmail.com">pirinpixel@gmail.com</a>
        </span>
        <span>© {year}</span>
      </footer>
    </div>
  )
}
