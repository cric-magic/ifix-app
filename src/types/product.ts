export type ProductCategory = 'smartphone' | 'tablet' | 'accessory' | 'laptop' | 'other'
export type ProductType = 'new' | 'used'
export type ProductStatus = 'available' | 'unavailable'

export interface Product {
  id: string
  name: string
  brand: string
  category: ProductCategory
  model: string
  storage?: string
  color: string
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
  imei: string
  serialNumber: string
  branch: string
  grade?: UnitGrade
  notes?: string
  conditionPhotos?: string[]
  tax: UnitTax
  customPrice?: number
  availability: UnitAvailability
  soldAt: string | null
  soldBy: string | null
  createdAt: string
}
