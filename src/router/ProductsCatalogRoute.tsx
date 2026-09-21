import { useCurrentUser } from '../contexts/AuthContext'
import { ProductsPage } from '../pages/products/ProductsPage'
import { GlobalCatalogPage } from '../pages/products/GlobalCatalogPage'

// /products/catalog means "my catalog" to a merchant and "the standard
// catalog every merchant adopts from" to Super Admin, who has no merchant
// SKUs of their own. Same URL, split here by role rather than given a
// separate route space, matching how the sidebar already varies this
// section's sub-tabs per role.
export function ProductsCatalogRoute() {
  const user = useCurrentUser()
  return user.role === 'super_admin' ? <GlobalCatalogPage /> : <ProductsPage />
}
