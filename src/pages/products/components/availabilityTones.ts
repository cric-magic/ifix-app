import type { UnitAvailability } from '../../../types/product'
import type { Tone } from '../../../components/tones'

// Each unit status's tone (components/tones.ts), shared by its tag in the
// Units list (UnitAvailabilityTag) and its count on the status tabs
// (UnitStatusTabs): Available green, Reserved amber, Sold purple.
export const AVAILABILITY_TONES: Record<UnitAvailability, Tone> = {
  available: 'success',
  reserved: 'warning',
  sold: 'purple',
}
