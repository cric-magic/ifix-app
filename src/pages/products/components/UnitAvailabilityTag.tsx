import type { UnitAvailability } from '../../../types/product'
import { StatusTag } from '../../../components/DotTag'
import { UNIT_AVAILABILITY_BADGES } from '../../../constants/statusBadges'

// A unit's availability as a tinted tag, matching the status tabs' counts
// above the list.
export function UnitAvailabilityTag({ availability }: { availability: UnitAvailability }) {
  return <StatusTag badge={UNIT_AVAILABILITY_BADGES[availability]} />
}
