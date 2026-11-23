import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth'
import { ToastProvider } from './toast'
import { RequireAuth } from './components/AppLayout'
import PublicLayout from './components/PublicLayout'
import CategoriesPage from './pages/CategoriesPage'
import CompaniesPage from './pages/CompaniesPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import TicketPage from './pages/TicketPage'
import TicketsPage from './pages/TicketsPage'
import UsersPage from './pages/UsersPage'

function StartPage() {
  const { user, ready } = useAuth()
  if (!ready) {
    return <div className="p-5 text-center text-secondary">Зареждане...</div>
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return <Navigate to={user.role === 'SUPER_ADMIN' ? '/companies' : '/tickets'} replace />
}

export default function App() {
  return (
    <ToastProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
          <Route element={<RequireAuth />}>
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/tickets/:id" element={<TicketPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/companies" element={<CompaniesPage />} />
          </Route>
          <Route path="*" element={<StartPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ToastProvider>
  )
}
