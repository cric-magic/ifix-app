import { theme } from 'antd'
import type { ContractStatus } from '../../../types/contract'
import { DotTag } from '../../../components/DotTag'

const LABELS: Record<ContractStatus, string> = {
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

export function ContractStatusTag({ status }: { status: ContractStatus }) {
  const { token } = theme.useToken()
  const dotColor: Record<ContractStatus, string> = {
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
  return <DotTag dotColor={dotColor[status]}>{LABELS[status]}</DotTag>
}
