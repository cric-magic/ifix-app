import type { ProductUnit } from '../types/product'
import { LINEUP_VARIANTS } from './mockCatalogProducts'
import { productIdFor } from './mockProducts'

// Branch name -> the short code used in serial numbers (the first part of
// each branch's own code in mockBranches.ts).
const BRANCHES: [name: string, code: string][] = [
  ['Bangkok HQ', 'BKK'],
  ['Chiang Mai', 'CNX'],
  ['Phuket', 'HKT'],
  ['Khon Kaen', 'KKC'],
]

// Used stock is scarcer than new — two branches rather than all four — and
// each unit carries the grade, battery and notes the Used type requires.
// Bangkok HQ's used units are photographed from every side (`views`), so
// there's always a unit with several condition photos to check the photo
// stack and preview against; the rest have the single placeholder.
const USED_STOCK: Record<string, { branch: string; grade: 'A' | 'B'; battery: number; notes: string; views?: string[] }[]> = {
  'iPhone 17 Pro': [
    { branch: 'Bangkok HQ', grade: 'A', battery: 96, notes: 'Like new, original box', views: ['Front', 'Back', 'Left side', 'Right side'] },
    { branch: 'Chiang Mai', grade: 'B', battery: 89, notes: 'Light scratches on frame' },
  ],
  'Galaxy S25': [
    { branch: 'Bangkok HQ', grade: 'B', battery: 91, notes: 'Small scuff on back panel', views: ['Front', 'Back', 'Scuff close-up'] },
    { branch: 'Chiang Mai', grade: 'A', battery: 95, notes: 'Screen protector fitted' },
  ],
}

// Opened stock: one unit each at two branches, with a note on why it was
// opened — no grade or battery, it's first-hand.
const OPENED_STOCK: Record<string, { branch: string; notes: string }[]> = {
  'iPhone 17': [
    { branch: 'Bangkok HQ', notes: 'Customer return, unused — box opened' },
    { branch: 'Chiang Mai', notes: 'Display unit, opened for demo' },
  ],
  'Galaxy S25': [
    { branch: 'Bangkok HQ', notes: 'Box opened to check color' },
    { branch: 'Phuket', notes: 'Customer return within 7 days, unused' },
  ],
}

function conditionPhoto(sku: string, view?: string): string {
  // placehold.co breaks lines on a literal backslash-n.
  const text = view ? `${sku}\\n${view}` : sku
  return `https://placehold.co/400x400/1a1a1a/999999?text=${encodeURIComponent(text)}`
}

function codeFor(branch: string): string {
  return BRANCHES.find(([name]) => name === branch)![1]
}

// A realistic manufacturer serial: ten characters, the length of a current
// iPhone's, from the alphabet those use (digits and consonants, no vowels
// and none of the letters that read as digits) — e.g. "F4KPX3WRN1". Real
// serials are this short, which is what decides whether one fits a Code 128
// barcode on a small sticker (see UnitLabel): 10 characters prints on a
// 40 × 30 sticker with one-dot bars and on 50 × 30 with two. The old
// SKU-plus-branch samples (SN-IP17P-256-COR-BKK, 22 characters) were too
// long for either.
//
// Deterministic — the same SKU and branch always get the same serial, so
// links and tests stay stable across reloads — and unique: a clash (vanishingly
// unlikely) just draws again.
const SERIAL_ALPHABET = '0123456789CDFGHJKLMNPQRTVWXY'
const SERIAL_LENGTH = 10
const usedSerials = new Set<string>()

function seededRandom(seed: number) {
  // mulberry32: a small, fast, repeatable pseudo-random sequence.
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashOf(text: string): number {
  // FNV-1a, to seed each SKU and branch's own sequence.
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193) >>> 0
  return h
}

export function serialFor(sku: string, branch: string): string {
  const random = seededRandom(hashOf(`${sku}|${codeFor(branch)}`))
  for (;;) {
    let serial = ''
    for (let i = 0; i < SERIAL_LENGTH; i++) serial += SERIAL_ALPHABET[Math.floor(random() * SERIAL_ALPHABET.length)]
    if (!usedSerials.has(serial)) {
      usedSerials.add(serial)
      return serial
    }
  }
}

export function unitIdFor(sku: string, branch: string): string {
  return `unit-${sku.toLowerCase()}-${codeFor(branch).toLowerCase()}`
}

// Internal Unit IDs, numbered from 1 in the order units were stocked.
let unitSeq = 0
function nextUnitNumber(): string {
  unitSeq += 1
  return String(unitSeq).padStart(8, '0')
}

// Deterministic 15-digit IMEIs, unique per unit.
let imeiSeq = 0
function nextImei(): string {
  imeiSeq += 1
  return `35241700${String(imeiSeq).padStart(7, '0')}`
}

// Every unit starts Available. Reserved and Sold aren't seeded here — they
// come from the contracts that hold each unit (mockContracts.ts applies
// them when it builds), which is the only way a unit can reach either state
// in the app itself. Seeding them here as well is how the two drifted apart
// before: units marked sold that no contract had sold.
export const MOCK_PRODUCT_UNITS: ProductUnit[] = LINEUP_VARIANTS.flatMap(v => {
  const productId = productIdFor(v.skuCode)
  const isPhone = v.line.category === 'smartphone'
  // Samsung ships dual physical SIM; the iPhone 17 family is eSIM plus one.
  const dualImei = isPhone && v.line.brand === 'Samsung'
  const createdAt = v.line.brand === 'Apple' ? '2025-09-25T09:00:00.000Z' : '2025-02-12T09:00:00.000Z'

  const base = (branch: string): ProductUnit => ({
    id: unitIdFor(v.skuCode, branch),
    unitNumber: nextUnitNumber(),
    productId,
    serialNumber: serialFor(v.skuCode, branch),
    imei1: isPhone ? nextImei() : undefined,
    imei2: dualImei ? nextImei() : undefined,
    branch,
    tax: v.type === 'used' ? 'non_vat' : 'vat',
    availability: 'available',
    soldAt: null,
    soldBy: null,
    createdAt,
  })

  if (v.type === 'used') {
    return USED_STOCK[v.line.model].map(u => ({
      ...base(u.branch),
      grade: u.grade,
      batteryPercentage: u.battery,
      notes: u.notes,
      conditionPhotos: u.views
        ? u.views.map(view => conditionPhoto(v.skuCode, view))
        : [conditionPhoto(v.skuCode)],
    }))
  }
  if (v.type === 'opened') {
    return OPENED_STOCK[v.line.model].map(u => ({ ...base(u.branch), notes: u.notes }))
  }
  return BRANCHES.map(([branch]) => base(branch))
})
