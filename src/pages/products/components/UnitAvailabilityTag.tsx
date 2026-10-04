import type { UnitAvailability } from '../../../types/product'
import { AVAILABILITY_LABELS } from '../../../constants/products'
import { DotTag } from '../../../components/DotTag'
import { useTones } from '../../../components/tones'
import { AVAILABILITY_TONES } from './availabilityTones'

// A unit's availability as a tinted tag: the status tone's faint fill,
// darker text and dot, matching the status tabs' counts above the list.
export function UnitAvailabilityTag({ availability }: { availability: UnitAvailability }) {
  const tone = useTones()[AVAILABILITY_TONES[availability]]
  return (
    <DotTag dotColor={tone.dot} textColor={tone.color}>
      {AVAILABILITY_LABELS[availability]}
    </DotTag>
  )
}
