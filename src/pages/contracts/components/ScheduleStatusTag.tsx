import type { ScheduleItem } from '../../../types/contract'
import { StatusTag } from '../../../components/DotTag'
import { SCHEDULE_STATUS_BADGES } from '../../../constants/statusBadges'

export function ScheduleStatusTag({ status }: { status: ScheduleItem['status'] }) {
  return <StatusTag badge={SCHEDULE_STATUS_BADGES[status]} />
}
