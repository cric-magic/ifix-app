import type { ContractStatus } from '../../../types/contract'
import { ListSearch } from '../../../components/ListSearch'
import { Select } from '../../../components/AppSelect'
import { useTones } from '../../../components/tones'
import { CONTRACT_STATUS_BADGES } from '../../../constants/statusBadges'
import { FILTERABLE_CONTRACT_STATUSES } from './contractStatus'

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

// The Contracts list's Status filter: a dropdown as before, with each
// status's coloured dot beside its name — the same colour as its tag in the
// table (its tone in CONTRACT_STATUS_BADGES), in the list and on the picked value.
export function ContractStatusSelect({ value, onChange }: { value: ContractStatusFilter; onChange: (val: ContractStatusFilter) => void }) {
  const tones = useTones()
  const options = [
    { value: 'all' as const, label: 'All statuses' },
    ...FILTERABLE_CONTRACT_STATUSES.map(s => ({
      value: s,
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: tones[CONTRACT_STATUS_BADGES[s].tone].dot, flexShrink: 0 }} />
          {CONTRACT_STATUS_BADGES[s].label}
        </span>
      ),
    })),
  ]
  // Wider than before (220, was 200) and a menu sized to its longest name:
  // the dot takes room the plain labels didn't need, and "Awaiting
  // Signature" was cut short.
  return <Select<ContractStatusFilter> value={value} onChange={onChange} options={options} popupMatchSelectWidth={false} style={{ width: 220 }} />
}
