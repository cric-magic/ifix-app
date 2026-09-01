import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useCurrentUser } from '../../contexts/AuthContext'
import { MOCK_MERCHANTS } from '../../constants/mockMerchants'
import { canManageBankAccounts } from '../../constants/roles'
import { BankAccountsTab } from '../merchants/detail/BankAccountsTab'

// Split out of WorkspaceAccountPage — bank accounts are financial data
// distinct enough from company profile info to earn their own settings
// tab (alongside Members), rather than being just another panel stacked
// under Account.
export function WorkspaceBankAccountsPage() {
  const actor = useCurrentUser()
  const [version, setVersion] = useState(0)
  void version

  // Super Admin has no merchantId — bank accounts are merchant business
  // data, not something the platform itself has, and they already manage
  // any given merchant's bank accounts from that merchant's own Detail
  // page (same BankAccountsTab, non-standalone there). AppLayout already
  // hides this tab from Super Admin's sidebar for the same reason; redirect
  // here too in case this route is reached directly by URL, rather than
  // showing a dead-end "not applicable" page for a tab they should never
  // see the entry point to in the first place.
  if (!actor.merchantId) {
    return <Navigate to="/settings/account" replace />
  }

  const merchant = MOCK_MERCHANTS.find(m => m.id === actor.merchantId)
  if (!merchant) return null

  function refresh() {
    setVersion(v => v + 1)
  }

  return (
    <BankAccountsTab
      merchant={merchant}
      canManage={canManageBankAccounts(actor, merchant)}
      onChanged={refresh}
      standalone
    />
  )
}
