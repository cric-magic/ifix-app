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
