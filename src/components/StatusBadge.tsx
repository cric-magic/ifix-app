import { Tag } from 'antd'
import type { ContractStatus, PaymentStatus } from '../types/installment'

type StatusValue = ContractStatus | PaymentStatus | 'future'

const CONFIG: Record<StatusValue, { color: string; label: string }> = {
  normal: { color: 'green', label: 'Normal' },
  bad_debt: { color: 'red', label: 'Bad Debt' },
  paid: { color: 'blue', label: 'Paid' },
  due: { color: 'orange', label: 'Due' },
  overdue: { color: 'red', label: 'Overdue' },
  future: { color: 'default', label: 'Upcoming' },
}

export function StatusBadge({ status }: { status: StatusValue }) {
  const { color, label } = CONFIG[status] ?? { color: 'default', label: status }
  return <Tag color={color}>{label}</Tag>
}
