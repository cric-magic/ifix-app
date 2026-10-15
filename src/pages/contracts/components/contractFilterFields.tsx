import { Select } from '../../../components/AppSelect'
import type { ListFilterField } from '../../../components/ListToolbar'
import { BRANCHES } from '../../../constants/mockData'
import { ContractStatusSelect, type ContractStatusFilter } from './ContractFilters'

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
      control: <ContractStatusSelect value={status} onChange={onStatusChange} />,
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
