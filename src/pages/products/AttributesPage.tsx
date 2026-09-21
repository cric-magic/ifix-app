import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useCurrentUser } from '../../contexts/AuthContext'
import { canManageProductAttributes } from '../../constants/roles'
import { AttributePanel } from './components/AttributePanel'

// The global Color/Storage lists every merchant's SKU form picks from.
// Platform-level data, so it sits under Super Admin's own Products section
// rather than a merchant workspace — merchants read these values but can't
// extend them. AppLayout leaves this tab out of their Products sub-nav, and
// the redirect covers the route being reached directly by URL.
export function AttributesPage() {
  const actor = useCurrentUser()
  const [version, setVersion] = useState(0)
  void version // re-render after mutating the mock records in place

  if (!canManageProductAttributes(actor)) {
    return <Navigate to="/products/catalog" replace />
  }

  function refresh() {
    setVersion(v => v + 1)
  }

  return (
    <div>
      <AttributePanel type="color" title="Colors" noun="color" onChanged={refresh} />
      <AttributePanel type="storage" title="Storage" noun="storage" onChanged={refresh} />
    </div>
  )
}
