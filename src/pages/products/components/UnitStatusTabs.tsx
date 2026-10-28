import type { UnitDisplayStatus } from '../../../types/product'
import { CountTabs } from '../../../components/CountTabs'
import type { Tone } from '../../../components/tones'
import { UNIT_AVAILABILITY_BADGES } from '../../../constants/statusBadges'

export type StatusFilter = 'all' | UnitDisplayStatus

// Not for sale sits next to Available: both are in stock, split by whether
// they can be sold.
const ORDER: StatusFilter[] = ['all', 'available', 'not_for_sale', 'reserved', 'sold']

// Each count's tone matches its status's tag in the list
// (UnitAvailabilityTag); All, the total, takes the brand blue.
const toneOf = (status: StatusFilter): Tone => status === 'all' ? 'primary' : UNIT_AVAILABILITY_BADGES[status].tone

interface Props {
  value: StatusFilter
  onChange: (status: StatusFilter) => void
  // How many units each status holds, within whatever the search leaves.
  counts: Record<StatusFilter, number>
}

// The Units list's status, as tabs with their counts — the same CountTabs
// the Catalog uses for its conditions (ProductTypeTabs). Not for sale only
// shows while there's something in it (or it's the tab you're on): most of
// the time nothing is, and an always-empty tab is just noise.
export function UnitStatusTabs({ value, onChange, counts }: Props) {
  return (
    <CountTabs<StatusFilter>
      value={value}
      onChange={onChange}
      tabs={ORDER
        .filter(status => status !== 'not_for_sale' || counts.not_for_sale > 0 || value === 'not_for_sale')
        .map(status => ({
          value: status,
          label: status === 'all' ? 'All' : UNIT_AVAILABILITY_BADGES[status].label,
          count: counts[status],
          tone: toneOf(status),
        }))}
    />
  )
}
