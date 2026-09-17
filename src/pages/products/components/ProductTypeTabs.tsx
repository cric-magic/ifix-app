import { Select } from '../../../components/AppSelect'
import type { ProductType } from '../../../types/product'
import { TYPE_LABELS } from '../../../constants/products'

export type TypeFilter = 'all' | ProductType

const OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'new', label: TYPE_LABELS.new },
  { value: 'used', label: TYPE_LABELS.used },
]

interface Props {
  activeType: TypeFilter
  onChange: (type: TypeFilter) => void
}

// Dropdown, not Segmented — matches every other list page's filter row
// (ContractFilters' status/branch Selects, search-then-filter order), which
// this one used to be the sole exception to.
export function ProductTypeTabs({ activeType, onChange }: Props) {
  return (
    <Select
      value={activeType}
      onChange={onChange}
      options={OPTIONS}
      style={{ width: 140 }}
    />
  )
}
