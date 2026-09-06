import { theme } from 'antd'
import type { ScheduleItem } from '../../../types/contract'
import { DotTag } from '../../../components/DotTag'

const LABELS: Record<ScheduleItem['status'], string> = {
  paid: 'Paid',
  paid_late: 'Paid (Late)',
  due: 'Due',
  overdue: 'Overdue',
  future: 'Upcoming',
}

export function ScheduleStatusTag({ status }: { status: ScheduleItem['status'] }) {
  const { token } = theme.useToken()
  const dotColor: Record<ScheduleItem['status'], string> = {
    paid: token.colorSuccess,
    paid_late: token.colorSuccess,
    due: token.colorWarning,
    overdue: token.colorError,
    future: token.colorTextTertiary,
  }
  return <DotTag dotColor={dotColor[status]}>{LABELS[status]}</DotTag>
}
