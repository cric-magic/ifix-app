import { theme } from 'antd'
import type { ContractStatus } from '../../../types/contract'

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  under_review: 'Under Review',
  rejected: 'Rejected',
  approved: 'Approved',
  awaiting_signature: 'Awaiting Signature',
  pending_payment: 'Pending Payment',
  active: 'Active',
  overdue: 'Overdue',
  settled: 'Settled',
  defaulted: 'Defaulted',
  closed: 'Closed',
}

// The statuses the Contracts list filters by, in lifecycle order.
export const FILTERABLE_CONTRACT_STATUSES: ContractStatus[] = [
  'draft',
  'pending_approval',
  'under_review',
  'rejected',
  'approved',
  'awaiting_signature',
  'pending_payment',
  'active',
  'overdue',
  'settled',
]

// Each status's colour — the dot and tint of its tag in the table
// (ContractStatusTag) and of its filter chip above it (ContractStatusChips),
// so the two always match.
export function useContractStatusColors(): Record<ContractStatus, string> {
  const { token } = theme.useToken()
  return {
    draft: token.colorTextTertiary,
    pending_approval: token.colorWarning,
    under_review: token.colorWarning,
    rejected: token.colorError,
    approved: token.colorPrimary,
    awaiting_signature: token.colorPrimary,
    pending_payment: token.colorPrimary,
    active: token.colorSuccess,
    overdue: token.colorError,
    settled: token.colorSuccess,
    defaulted: token.colorError,
    closed: token.colorTextTertiary,
  }
}
