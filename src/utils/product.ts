import type { Product, ProductUnit } from '../types/product'
import { GRADE_LABELS, TYPE_LABELS } from '../constants/products'

// A SKU's full name, the way staff and customers say it: product name,
// color, storage, then condition — "iPhone 17 Black 256GB New". The bare
// name alone can't tell a unit's SKU apart from its siblings.
export function fullSkuName(product: Pick<Product, 'name' | 'color' | 'storage' | 'type'>): string {
  return [product.name, product.color, product.storage, TYPE_LABELS[product.type]].filter(Boolean).join(' ')
}

// A unit's condition in words: its SKU's condition, plus the grade that
// tells one Used unit from another — "Used · Grade A".
export function unitConditionLabel(unit: ProductUnit, product: Product | undefined): string {
  if (!product) return unit.grade ? GRADE_LABELS[unit.grade] : '—'
  return product.type === 'used' && unit.grade
    ? `${TYPE_LABELS.used} · ${GRADE_LABELS[unit.grade]}`
    : TYPE_LABELS[product.type]
}

// The condition a contract records for its device: a Used unit's grade
// letter, as contracts always have, otherwise its SKU's condition.
export function contractConditionOf(unit: ProductUnit, product: Product): string {
  return product.type === 'used' && unit.grade ? unit.grade : TYPE_LABELS[product.type]
}

// Only an Available unit of a live New SKU can be marked Opened: a Reserved
// one is committed to a contract at its New price, and a Sold one is gone.
export function canMarkOpened(unit: ProductUnit, product: Product | undefined): boolean {
  return unit.availability === 'available' && !!product && !product.deletedAt && product.type === 'new'
}

// The Opened SKU for the same device as a New one — same merchant and the
// same spec, differing only in condition. Where a New unit goes once its
// box has been opened.
export function openedSiblingOf(product: Product, products: Product[]): Product | undefined {
  return products.find(p =>
    !p.deletedAt
    && p.type === 'opened'
    && p.merchantId === product.merchantId
    && p.brand === product.brand
    && p.model === product.model
    && p.storage === product.storage
    && p.ram === product.ram
    && p.color === product.color
    && p.connection === product.connection)
}

// Serial Number and both IMEIs must be unique across the merchant — not just
// within one SKU — so these check every unit belonging to the merchant's own
// products. `exceptUnitId` lets an edit form ignore the unit being edited,
// which would otherwise always collide with itself.
function merchantUnits(
  units: ProductUnit[],
  products: Product[],
  merchantId: string | undefined,
  exceptUnitId?: string,
): ProductUnit[] {
  const productIds = new Set(products.filter(p => p.merchantId === merchantId).map(p => p.id))
  return units.filter(u => productIds.has(u.productId) && u.id !== exceptUnitId)
}

export function isSerialNumberTaken(
  serialNumber: string,
  units: ProductUnit[],
  products: Product[],
  merchantId: string | undefined,
  exceptUnitId?: string,
): boolean {
  const value = serialNumber.trim().toLowerCase()
  if (!value) return false
  return merchantUnits(units, products, merchantId, exceptUnitId)
    .some(u => u.serialNumber.trim().toLowerCase() === value)
}

// Checks against BOTH IMEI slots on every other unit — an IMEI registered as
// unit A's second IMEI can't be reused as unit B's first.
export function isImeiTaken(
  imei: string,
  units: ProductUnit[],
  products: Product[],
  merchantId: string | undefined,
  exceptUnitId?: string,
): boolean {
  const value = imei.trim().toLowerCase()
  if (!value) return false
  return merchantUnits(units, products, merchantId, exceptUnitId)
    .some(u => [u.imei1, u.imei2].some(v => v?.trim().toLowerCase() === value))
}

// Internal Unit IDs are eight digits (see ProductUnit.unitNumber).
export const UNIT_NUMBER_LENGTH = 8

// The next free Internal Unit ID: one past the highest in use.
export function nextUnitNumber(units: ProductUnit[]): string {
  const highest = units.reduce((max, u) => Math.max(max, Number(u.unitNumber) || 0), 0)
  return String(highest + 1).padStart(UNIT_NUMBER_LENGTH, '0')
}

// The unit a scanned or typed code names, matched exactly: an Internal
// Unit ID, an IMEI or a Serial Number — whichever a sticker or a box carries.
export function findUnitByCode(code: string, units: ProductUnit[]): ProductUnit | undefined {
  const value = code.trim().toLowerCase()
  if (!value) return undefined
  return units.find(u =>
    u.unitNumber === value
    || u.imei1 === value
    || u.imei2 === value
    || u.serialNumber.toLowerCase() === value)
}

// The code on a unit that starts with typed digits — its Internal Unit ID
// (a sticker's barcode) or either IMEI (the box) — for suggestions while a
// code is still being typed.
export function codeMatching(unit: ProductUnit, digits: string): string | undefined {
  return [unit.unitNumber, unit.imei1, unit.imei2].find(code => code?.startsWith(digits))
}

// The doc's "Available Units" column: units with Availability Status =
// Available, counted within the caller's already branch-scoped list.
export function countAvailableUnits(units: ProductUnit[]): number {
  return units.filter(u => u.availability === 'available').length
}

// How many live SKUs carry a given attribute value, across every merchant —
// this is platform-level master data, so the count that matters is global.
// Drives the "In use" column and the disable confirmation, which promises
// those SKUs keep the value.
export function countProductsUsingAttribute(
  field: 'color' | 'storage' | 'ram' | 'connection',
  value: string,
  products: Product[],
): number {
  return products.filter(p => !p.deletedAt && p[field] === value).length
}

// A unit's selling price: its own custom price, or its SKU's.
export function unitPrice(unit: ProductUnit, product: Product): number {
  return unit.customPrice ?? product.salesPrice
}

// A SKU's variant in words — "256GB · Cosmic Orange".
export function variantOf(product: Product): string {
  return [product.storage, product.color].filter(Boolean).join(' · ')
}
