import type { ContractStatus } from '../../../types/contract'
import { StatusTag } from '../../../components/DotTag'
import { CONTRACT_STATUS_BADGES } from '../../../constants/statusBadges'

export function ContractStatusTag({ status }: { status: ContractStatus }) {
  return <StatusTag badge={CONTRACT_STATUS_BADGES[status]} />
}
