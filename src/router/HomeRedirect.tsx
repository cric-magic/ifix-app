import { Navigate } from 'react-router-dom'
import { useCurrentUser } from '../contexts/AuthContext'
import { homePath } from '../constants/roles'

// The index route's target depends on role — Contracts for everyone except
// Super Admin, whose own workspace home is Merchants instead (they can't
// view Contracts at all). A plain <Navigate to="/contracts" /> here used to
// send every signed-in user, Super Admin included, straight to a page that
// immediately told them it wasn't applicable to their role.
export function HomeRedirect() {
  const user = useCurrentUser()
  return <Navigate to={homePath(user)} replace />
}
