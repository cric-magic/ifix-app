import { Navigate } from 'react-router-dom'
import { useCurrentUser } from '../contexts/AuthContext'
import { productsHomePath } from '../constants/roles'

// /products means different things per role: merchants land on their own
// catalog, Super Admin on the platform-level Attributes they actually
// manage (their catalog tab arrives with the global SKU catalog). Same
// shape as HomeRedirect above it — a plain <Navigate to="/products/catalog">
// would have sent Super Admin to a page that blocks their role.
export function ProductsIndexRedirect() {
  const user = useCurrentUser()
  return <Navigate to={productsHomePath(user)} replace />
}
