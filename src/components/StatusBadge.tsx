import { theme } from 'antd'
import type { ContractStatus, PaymentStatus } from '../types/installment'
import { DotTag } from './DotTag'

type StatusValue = ContractStatus | PaymentStatus | 'future'

const LABELS: Record<StatusValue, string> = {
  normal: 'Normal',
  bad_debt: 'Bad Debt',
  paid: 'Paid',
  due: 'Due',
  overdue: 'Overdue',
  future: 'Upcoming',
}

export function StatusBadge({ status }: { status: StatusValue }) {
  const { token } = theme.useToken()
  const dotColor: Record<StatusValue, string> = {
    normal: token.colorSuccess,
    bad_debt: token.colorError,
    paid: token.colorPrimary,
    due: token.colorWarning,
    overdue: token.colorError,
    future: token.colorTextTertiary,
  }
  const label = LABELS[status] ?? status
  return <DotTag dotColor={dotColor[status] ?? token.colorTextTertiary}>{label}</DotTag>
}
