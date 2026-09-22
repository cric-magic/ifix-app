import { Navigate } from 'react-router-dom'
import { useCurrentUser } from '../../contexts/AuthContext'
import { ContractTemplatesTab } from '../merchants/detail/ContractTemplatesTab'

// The merchant's own view of its contract templates. Same split as Bank
// Accounts: one component, rendered here for the merchant's own users and
// on Merchant Detail for Super Admin, who manages a merchant's templates
// from that merchant rather than from a screen that re-picks one.
export function WorkspaceContractTemplatesPage() {
  const actor = useCurrentUser()

  // Super Admin has no merchant of their own — they reach any merchant's
  // templates through Merchant Detail. AppLayout hides this tab from them
  // for the same reason; this redirect covers a direct URL.
  if (!actor.merchantId) {
    return <Navigate to="/settings/account" replace />
  }

  return <ContractTemplatesTab merchantId={actor.merchantId} standalone />
}
