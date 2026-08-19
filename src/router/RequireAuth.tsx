import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'signed_out') {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />
  }
  if (status === 'must_set_password') {
    return <Navigate to="/set-password" replace />
  }
  return <>{children}</>
}
