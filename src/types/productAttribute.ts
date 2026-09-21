export type ProductAttributeType = 'color' | 'storage'

// Global master data owned by Super Admin: the Color and Storage values every
// merchant picks from when creating a SKU. Merchants select from these but
// can't add their own.
//
// Options are never deleted, only disabled — per the doc, "Disabling an option
// must not remove or alter its value on existing SKUs". A disabled option
// drops out of the picker for new selections while any SKU already carrying
// that value keeps rendering it unchanged.
export interface ProductAttribute {
  id: string
  type: ProductAttributeType
  value: string
  enabled: boolean
  createdAt: string
}
