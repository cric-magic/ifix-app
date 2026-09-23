import { useCurrentUser } from '../contexts/AuthContext'
import { ProductDetailPage } from '../pages/products/ProductDetailPage'
import { CatalogProductDetailPage } from '../pages/products/CatalogProductDetailPage'

// Same role split as ProductsCatalogRoute, one level down: a row on
// /products/catalog opens a merchant's own product for a merchant and a
// standard catalog entry for Super Admin.
export function ProductDetailRoute() {
  const user = useCurrentUser()
  return user.role === 'super_admin' ? <CatalogProductDetailPage /> : <ProductDetailPage />
}
