import type { ContractStatus } from '../../../types/contract'
import { ListSearch } from '../../../components/ListSearch'

export type ContractStatusFilter = 'all' | ContractStatus

// The Contracts list's search box.
export function ContractSearch({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  return (
    <ListSearch
      value={value}
      onChange={onChange}
      placeholder="Search by contract number, customer, or serial"
      mobilePlaceholder="Search contracts"
    />
  )
}
