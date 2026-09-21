export type ProductCategory = 'smartphone' | 'tablet' | 'accessory' | 'laptop' | 'other'
export type ProductType = 'new' | 'used'
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
  createdBy: string
  createdAt: string
  deletedAt: string | null
}

export type UnitGrade = 'A' | 'B' | 'C' | 'D'
export type UnitTax = 'vat' | 'non_vat'
export type UnitAvailability = 'available' | 'reserved' | 'sold'

export interface ProductUnit {
  id: string
  productId: string
  // Serial Number is the unit's primary identifier — required and unique
  // across the merchant. The IMEIs are supporting identifiers: optional
  // (a laptop or accessory has none, a single-SIM phone has one), but any
  // value that IS given must also be unique across the merchant.
  serialNumber: string
  imei1?: string
  imei2?: string
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
