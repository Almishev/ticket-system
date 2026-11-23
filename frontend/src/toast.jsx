import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import Toast from 'react-bootstrap/Toast'
import ToastContainer from 'react-bootstrap/ToastContainer'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const push = useCallback((message, variant) => {
    const id = crypto.randomUUID()
    setToasts((current) => [...current, { id, message, variant }])
  }, [])

  const toast = useMemo(
    () => ({
      success: (message) => push(message, 'success'),
      error: (message) => push(message, 'danger'),
    }),
    [push],
  )

  function dismiss(id) {
    setToasts((current) => current.filter((item) => item.id !== id))
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer position="top-end" className="p-3 toast-stack">
        {toasts.map((item) => (
          <Toast key={item.id} bg={item.variant} show autohide delay={4000} onClose={() => dismiss(item.id)}>
            <Toast.Header closeButton>
              <strong className="me-auto">{item.variant === 'danger' ? 'Грешка' : 'Готово'}</strong>
            </Toast.Header>
            <Toast.Body className={item.variant === 'danger' || item.variant === 'success' ? 'text-white' : ''}>
              {item.message}
            </Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
