import type { ContractStatus } from '../../../types/contract'
import { DotTag } from '../../../components/DotTag'
import { CONTRACT_STATUS_LABELS, useContractStatusColors } from './contractStatus'

export function ContractStatusTag({ status }: { status: ContractStatus }) {
  const colors = useContractStatusColors()
  return <DotTag dotColor={colors[status]}>{CONTRACT_STATUS_LABELS[status]}</DotTag>
}
