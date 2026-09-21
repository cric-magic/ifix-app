import type { Product, ProductUnit } from '../types/product'

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
