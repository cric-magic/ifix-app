import type { AuthUser } from '../../../types/installment'
import type { Contract } from '../../../types/contract'
import { canApproveContract } from '../../../constants/roles'
import { getOutstandingBalance } from '../../../utils/contract'

// Whether LifecycleActions renders a button for this contract right now —
// mirrors its per-status branches, so ContractDetailPage's mobile action bar
// knows if the lifecycle step gets the bar or Edit does. Keep in step with
// LifecycleActions when a status gains or loses an action.
export function hasLifecycleAction(contract: Contract, actor: AuthUser): boolean {
  const canReview = canApproveContract(actor)
  switch (contract.status) {
    case 'pending_approval':
    case 'under_review':
      return canReview
    case 'approved':
    case 'awaiting_signature':
    case 'pending_payment':
      return true
    case 'active':
    case 'overdue':
      return getOutstandingBalance(contract) === 0
    default:
      return false
  }
}
