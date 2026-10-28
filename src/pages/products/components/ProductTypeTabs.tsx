import type { ProductType } from '../../../types/product'
import { TYPE_LABELS } from '../../../constants/products'
import { CountTabs } from '../../../components/CountTabs'
import { PRODUCT_CONDITION_BADGES } from '../../../constants/statusBadges'

// 'removed' is the Catalog's soft-deleted products, the place they can be
// restored from — not a condition, but it sits on the same row of tabs.
export type TypeFilter = 'all' | ProductType | 'removed'

const ORDER: TypeFilter[] = ['all', 'new', 'opened', 'used', 'removed']

interface Props {
  activeType: TypeFilter
  onChange: (type: TypeFilter) => void
  // How many products (SKUs) each condition holds, within the search.
  // removed only where the Removed tab is offered.
  counts: Record<Exclude<TypeFilter, 'removed'>, number> & { removed?: number }
  // Whether to offer the Removed tab at all — only to roles that can
  // remove and restore products (not the platform's global catalog).
  showRemoved?: boolean
}

// Condition (New, Opened, Used) splits the whole catalog, and for the client
// it's the first thing they narrow by — so it's tabs showing every option
// at once, each with its count, placed first in the filter row ahead of
// search rather than a dropdown that hides them. The same CountTabs as the
// Units list's status tabs. Removed comes last, and only while there's
// something in it (or it's the tab you're on), like the Units list's Not
// for sale.
export function ProductTypeTabs({ activeType, onChange, counts, showRemoved = false }: Props) {
  return (
    <CountTabs<TypeFilter>
      value={activeType}
      onChange={onChange}
      tabs={ORDER
        .filter(type => type !== 'removed' || (showRemoved && ((counts.removed ?? 0) > 0 || activeType === 'removed')))
        .map(type => ({
          value: type,
          label: type === 'all' ? 'All' : type === 'removed' ? 'Removed' : TYPE_LABELS[type],
          count: (type === 'removed' ? counts.removed : counts[type]) ?? 0,
          // All, the total, in the brand blue as on the Units list; each
          // condition in its own tone, the same as its tag; Removed neutral.
          tone: type === 'all' ? 'primary' : type === 'removed' ? 'neutral' : PRODUCT_CONDITION_BADGES[type].tone,
        }))}
    />
  )
}
