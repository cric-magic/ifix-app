import type { BranchStatus } from '../../../types/branch'
import { StatusTag } from '../../../components/DotTag'
import { BRANCH_STATUS_BADGES } from '../../../constants/statusBadges'

export function BranchStatusTag({ status }: { status: BranchStatus }) {
  return <StatusTag badge={BRANCH_STATUS_BADGES[status]} />
}
