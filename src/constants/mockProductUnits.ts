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
const USED_STOCK: Record<string, { branch: string; grade: 'A' | 'B'; battery: number; notes: string }[]> = {
  'iPhone 17 Pro': [
    { branch: 'Bangkok HQ', grade: 'A', battery: 96, notes: 'Like new, original box' },
    { branch: 'Chiang Mai', grade: 'B', battery: 89, notes: 'Light scratches on frame' },
  ],
  'Galaxy S25': [
    { branch: 'Bangkok HQ', grade: 'B', battery: 91, notes: 'Small scuff on back panel' },
    { branch: 'Chiang Mai', grade: 'A', battery: 95, notes: 'Screen protector fitted' },
  ],
}

function codeFor(branch: string): string {
  return BRANCHES.find(([name]) => name === branch)![1]
}

// A readable serial: SKU plus branch, e.g. SN-IP17P-256-COR-BKK. With one
// unit of each SKU per branch that's already unique, and it says what and
// where a unit is without opening it.
export function serialFor(sku: string, branch: string): string {
  return `SN-${sku}-${codeFor(branch)}`
}

export function unitIdFor(sku: string, branch: string): string {
  return `unit-${sku.toLowerCase()}-${codeFor(branch).toLowerCase()}`
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
      conditionPhotos: [`https://placehold.co/400x400/1a1a1a/999999?text=${encodeURIComponent(v.skuCode)}`],
    }))
  }
  return BRANCHES.map(([branch]) => base(branch))
})
