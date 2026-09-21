import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useCurrentUser } from '../../contexts/AuthContext'
import { canManageProductOptions } from '../../constants/roles'
import { ProductOptionPanel } from './components/ProductOptionPanel'

// Global Color/Storage master data — the one settings tab that belongs to
// Super Admin rather than a merchant workspace. Merchants read these lists
// when creating a SKU but can't extend them, so the screen has no
// merchant-facing counterpart; AppLayout hides the nav entry for everyone
// else and this redirect covers the route being reached directly by URL.
export function ProductOptionsPage() {
  const actor = useCurrentUser()
  const [version, setVersion] = useState(0)
  void version // re-render after mutating the mock records in place

  if (!canManageProductOptions(actor)) {
    return <Navigate to="/settings/account" replace />
  }

  function refresh() {
    setVersion(v => v + 1)
  }

  return (
    <div>
      <ProductOptionPanel type="color" title="Colors" noun="color" onChanged={refresh} />
      <ProductOptionPanel type="storage" title="Storage" noun="storage" onChanged={refresh} />
    </div>
  )
}
