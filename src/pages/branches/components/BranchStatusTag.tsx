import { theme } from 'antd'
import type { BranchStatus } from '../../../types/branch'
import { DotTag } from '../../../components/DotTag'

const LABELS: Record<BranchStatus, string> = {
  active: 'Active',
  archived: 'Archived',
}

export function BranchStatusTag({ status }: { status: BranchStatus }) {
  const { token } = theme.useToken()
  const dotColor = {
    active: token.colorSuccess,
    archived: token.colorError,
  }[status]
  return <DotTag dotColor={dotColor}>{LABELS[status]}</DotTag>
}
