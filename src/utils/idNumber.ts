// A customer's ID number — Thai National ID or passport — read from one
// field. The type isn't picked by staff; it's worked out from what's typed:
//   13 digits with a valid check digit → Thai National ID, stored formatted
//                                        X-XXXX-XXXXX-XX-X
//   6–9 letters/digits                 → Passport, stored uppercase
// and anything else is a validation error. Lookup and uniqueness compare
// the normalised value (no dashes or spaces, uppercase), so the same ID
// typed with or without dashes is the same customer.
export type IdType = 'national_id' | 'passport'

export const ID_TYPE_LABELS: Record<IdType, string> = {
  national_id: 'Thai National ID',
  passport: 'Passport',
}

export function normalizeIdNumber(raw: string): string {
  return raw.replace(/[\s-]/g, '').toUpperCase()
}

// The Thai ID check digit: the first 12 digits weighted 13 down to 2,
// summed; the 13th digit must equal (11 − sum mod 11) mod 10.
export function isValidThaiId(digits: string): boolean {
  if (!/^\d{13}$/.test(digits)) return false
  const sum = [...digits.slice(0, 12)].reduce((total, d, i) => total + Number(d) * (13 - i), 0)
  return (11 - (sum % 11)) % 10 === Number(digits[12])
}

export function formatThaiId(digits: string): string {
  return `${digits[0]}-${digits.slice(1, 5)}-${digits.slice(5, 10)}-${digits.slice(10, 12)}-${digits[12]}`
}

export interface IdReading {
  // null while it isn't (yet) a valid ID of either kind.
  type: IdType | null
  // The form it's stored in — formatted Thai ID, or uppercase passport.
  value: string
  // Why it isn't valid, once there's enough to say.
  error?: string
}

export function readIdNumber(raw: string): IdReading {
  const n = normalizeIdNumber(raw)
  if (!n) return { type: null, value: '' }
  if (/^\d+$/.test(n)) {
    if (n.length === 13) {
      return isValidThaiId(n)
        ? { type: 'national_id', value: formatThaiId(n) }
        : { type: null, value: n, error: "This looks like a Thai National ID, but the check digit doesn't match — check the number" }
    }
    if (n.length > 9) return { type: null, value: n, error: 'A Thai National ID has 13 digits' }
    if (n.length >= 6) return { type: 'passport', value: n }
    return { type: null, value: n, error: 'Too short for a National ID or passport number' }
  }
  if (/^[A-Z0-9]{6,9}$/.test(n)) return { type: 'passport', value: n }
  return { type: null, value: n, error: 'A passport number is 6–9 letters and digits' }
}

// What a save stores: the ID in its stored form and its detected type.
// Only called on a value that passed validation, so the type is set.
export function idFields(raw: string): { nationalId: string; idType: IdType } {
  const reading = readIdNumber(raw)
  return { nationalId: reading.value, idType: reading.type ?? 'passport' }
}

export function sameIdNumber(a: string, b: string): boolean {
  return normalizeIdNumber(a) === normalizeIdNumber(b)
}
