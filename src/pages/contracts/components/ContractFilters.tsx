import { Input } from 'antd'
import { Search } from 'lucide-react'
import { Select } from '../../../components/AppSelect'
import { useIconColors } from '../../../constants/iconColors'
import type { ContractStatus } from '../../../types/contract'
import { BRANCHES } from '../../../constants/mockData'

export type ContractStatusFilter = 'all' | ContractStatus

const STATUS_OPTIONS: { value: ContractStatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'approved', label: 'Approved' },
  { value: 'awaiting_signature', label: 'Awaiting Signature' },
  { value: 'pending_payment', label: 'Pending Payment' },
  { value: 'active', label: 'Active' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'settled', label: 'Settled' },
]

interface Props {
  search: string
  onSearchChange: (val: string) => void
  status: ContractStatusFilter
  onStatusChange: (val: ContractStatusFilter) => void
  showBranchFilter: boolean
  branch: string | undefined
  onBranchChange: (val: string | undefined) => void
}

export function ContractFilters({ search, onSearchChange, status, onStatusChange, showBranchFilter, branch, onBranchChange }: Props) {
  const iconColors = useIconColors()

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <Input
        placeholder="Search by contract number, customer, or IMEI"
        prefix={<Search size={15} strokeWidth={2.25} color={iconColors.secondary} />}
        allowClear
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        style={{ maxWidth: 320 }}
      />
      <Select
        value={status}
        onChange={onStatusChange}
        options={STATUS_OPTIONS}
        style={{ width: 200 }}
      />
      {showBranchFilter && (
        <Select
          placeholder="All branches"
          allowClear
          value={branch}
          onChange={onBranchChange}
          options={BRANCHES.map(b => ({ value: b, label: b }))}
          style={{ width: 180 }}
        />
      )}
    </div>
  )
}
