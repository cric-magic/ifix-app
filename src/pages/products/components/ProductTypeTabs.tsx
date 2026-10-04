import type { ProductType } from '../../../types/product'
import { TYPE_LABELS } from '../../../constants/products'
import { CountTabs } from '../../../components/CountTabs'
import { CONDITION_TONES } from './conditionTones'

export type TypeFilter = 'all' | ProductType

const ORDER: TypeFilter[] = ['all', 'new', 'opened', 'used']

interface Props {
  activeType: TypeFilter
  onChange: (type: TypeFilter) => void
  // How many products (SKUs) each condition holds, within the search.
  counts: Record<TypeFilter, number>
}

// Condition (New, Opened, Used) splits the whole catalog, and for the client
// it's the first thing they narrow by — so it's tabs showing every option
// at once, each with its count, placed first in the filter row ahead of
// search rather than a dropdown that hides them. The same CountTabs as the
// Units list's status tabs.
export function ProductTypeTabs({ activeType, onChange, counts }: Props) {
  return (
    <CountTabs<TypeFilter>
      value={activeType}
      onChange={onChange}
      tabs={ORDER.map(type => ({
        value: type,
        label: type === 'all' ? 'All' : TYPE_LABELS[type],
        count: counts[type],
        // All, the total, in the brand blue as on the Units list; each
        // condition in its own tone, the same as its tag.
        tone: type === 'all' ? 'primary' : CONDITION_TONES[type],
      }))}
    />
  )
}
