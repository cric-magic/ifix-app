import type { UserStatus } from '../../../types/user'
import { StatusTag } from '../../../components/DotTag'
import { USER_STATUS_BADGES } from '../../../constants/statusBadges'

export function UserStatusTag({ status }: { status: UserStatus }) {
  return <StatusTag badge={USER_STATUS_BADGES[status]} />
}
