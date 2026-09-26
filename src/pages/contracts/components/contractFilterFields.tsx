import { Select } from '../../../components/AppSelect'
import type { ListFilterField } from '../../../components/ListToolbar'
import { BRANCHES } from '../../../constants/mockData'
import type { ContractStatusFilter } from './ContractFilters'

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

// The Contracts list's filters, as ListToolbar fields — inline dropdowns on
// desktop, labelled and stacked in the filter sheet on mobile.
export function contractFilterFields({ status, onStatusChange, showBranchFilter, branch, onBranchChange }: {
  status: ContractStatusFilter
  onStatusChange: (val: ContractStatusFilter) => void
  showBranchFilter: boolean
  branch: string | undefined
  onBranchChange: (val: string | undefined) => void
}): ListFilterField[] {
  return [
    {
      key: 'status',
      label: 'Status',
      control: <Select value={status} onChange={onStatusChange} options={STATUS_OPTIONS} style={{ width: 200 }} />,
    },
    ...(showBranchFilter ? [{
      key: 'branch',
      label: 'Branch',
      control: (
        <Select
          placeholder="All branches"
          allowClear
          value={branch}
          onChange={onBranchChange}
          options={BRANCHES.map(b => ({ value: b, label: b }))}
          style={{ width: 180 }}
        />
      ),
    }] : []),
  ]
}
