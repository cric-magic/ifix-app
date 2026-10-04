import type { UnitAvailability } from '../../../types/product'
import { AVAILABILITY_LABELS } from '../../../constants/products'
import { CountTabs } from '../../../components/CountTabs'
import type { Tone } from '../../../components/tones'
import { AVAILABILITY_TONES } from './availabilityTones'

export type StatusFilter = 'all' | UnitAvailability

const ORDER: StatusFilter[] = ['all', 'available', 'reserved', 'sold']

// Each count's tone matches its status's tag in the list
// (UnitAvailabilityTag); All, the total, takes the brand blue.
const TONES: Record<StatusFilter, Tone> = { all: 'primary', ...AVAILABILITY_TONES }

interface Props {
  value: StatusFilter
  onChange: (status: StatusFilter) => void
  // How many units each status holds, within whatever the search leaves.
  counts: Record<StatusFilter, number>
}

// The Units list's status, as tabs with their counts — the same CountTabs
// the Catalog uses for its conditions (ProductTypeTabs).
export function UnitStatusTabs({ value, onChange, counts }: Props) {
  return (
    <CountTabs<StatusFilter>
      value={value}
      onChange={onChange}
      tabs={ORDER.map(status => ({
        value: status,
        label: status === 'all' ? 'All' : AVAILABILITY_LABELS[status],
        count: counts[status],
        tone: TONES[status],
      }))}
    />
  )
}
