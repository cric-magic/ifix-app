export type ProductCategory = 'smartphone' | 'tablet' | 'accessory' | 'laptop' | 'other'
// A SKU's condition. Opened is first-hand stock whose box has been opened
// or that a customer returned — never used, so it's not second-hand and
// carries no grade or battery reading. New, Opened and Used of the same
// device are separate SKUs, each with its own price.
export type ProductType = 'new' | 'opened' | 'used'
export type ProductStatus = 'available' | 'unavailable'

export interface Product {
  id: string
  name: string
  brand: string
  category: ProductCategory
  model: string
  modelNumber: string
  // Storage/RAM/Connection are spec fields, but they're category-dependent
  // in practice — an Accessory SKU (AirPods) has none of the three, and a
  // Laptop has RAM but no Connection. Optional rather than required so those
  // SKUs don't have to carry placeholder values. Storage/Color come from the
  // SuperAdmin-managed option lists; RAM/Connection from fixed lists that
  // merchants can't extend (see constants/products.ts).
  storage?: string
  ram?: string
  color: string
  connection?: string
  sku: string
  costPrice: number
  salesPrice: number
  type: ProductType
  status: ProductStatus
  photos?: string[]
  merchantId: string
  // Set when this SKU was adopted from the global catalog. Provenance only:
  // the record is a copy the merchant fully owns, so catalog edits never
  // reach it and the merchant can rename or change anything afterward.
  sourceCatalogId?: string
  createdBy: string
  createdAt: string
  deletedAt: string | null
}

export type UnitGrade = 'A' | 'B' | 'C' | 'D'
export type UnitTax = 'vat' | 'non_vat'
export type UnitAvailability = 'available' | 'reserved' | 'sold'

export interface ProductUnit {
  id: string
  // The Internal Unit ID a sticker's codes can carry instead of the Serial
  // Number (see BarcodeSettings): eight digits, unique across units. Digits
  // because Code 128 packs two into each symbol, so the barcode is a
  // third the width of a serial's and its bars can print two or three
  // printer dots thick — far easier to scan.
  unitNumber: string
  productId: string
  // Serial Number is the unit's primary identifier — required and unique
  // across the merchant. The IMEIs are supporting identifiers: optional
  // (a laptop or accessory has none, a single-SIM phone has one), but any
  // value that IS given must also be unique across the merchant.
  serialNumber: string
  imei1?: string
  imei2?: string
  // Optional, for when a unit's own model number is worth recording (a
  // regional variant, say) — the SKU's Model Number is the default.
  modelNumber?: string
  branch: string
  grade?: UnitGrade
  // Required when the SKU's type is Used; 0-100.
  batteryPercentage?: number
  notes?: string
  // One optional set for New and Used alike — replaces the old split of
  // required front/IMEI-label shots plus Used-only defect photos.
  conditionPhotos?: string[]
  tax: UnitTax
  customPrice?: number
  availability: UnitAvailability
  soldAt: string | null
  soldBy: string | null
  createdAt: string
}
