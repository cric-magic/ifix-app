import { Segmented } from 'antd'
import type { ProductType } from '../../../types/product'
import { TYPE_LABELS } from '../../../constants/products'

export type TypeFilter = 'all' | ProductType

const OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'new', label: TYPE_LABELS.new },
  { value: 'opened', label: TYPE_LABELS.opened },
  { value: 'used', label: TYPE_LABELS.used },
]

interface Props {
  activeType: TypeFilter
  onChange: (type: TypeFilter) => void
}

// Condition (New, Opened, Used) splits the whole catalog, and for the client
// it's the first thing they narrow by — so it's a Segmented control showing
// every option at once, placed first in the filter row ahead of search,
// rather than a dropdown that hides them. (Other list pages keep the
// search-then-dropdowns order; their filters are narrower cuts.)
export function ProductTypeTabs({ activeType, onChange }: Props) {
  return (
    <Segmented<TypeFilter>
      value={activeType}
      onChange={onChange}
      options={OPTIONS}
      style={{ flexShrink: 0 }}
    />
  )
}
