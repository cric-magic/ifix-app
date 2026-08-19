import { theme } from 'antd'
import type { UserStatus } from '../../../types/user'
import { DotTag } from '../../../components/DotTag'

const LABELS: Record<UserStatus, string> = {
  created: 'Created',
  active: 'Active',
  suspended: 'Suspended',
}

export function UserStatusTag({ status }: { status: UserStatus }) {
  const { token } = theme.useToken()
  const dotColor = {
    created: token.colorWarning,
    active: token.colorSuccess,
    suspended: token.colorError,
  }[status]
  return <DotTag dotColor={dotColor}>{LABELS[status]}</DotTag>
}
