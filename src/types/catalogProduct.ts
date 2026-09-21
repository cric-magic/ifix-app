import type { ProductCategory, ProductType } from './product'

// A standard SKU definition owned by the platform, not by any merchant.
// Merchants adopt these into their own catalog to avoid defining common
// devices from scratch; a merchant who already has their own SKUs can ignore
// the catalog entirely and create their own.
//
// Deliberately carries only the device's specification. Cost/sales price,
// availability status and units are all merchant-specific and live on the
// merchant's own Product — two merchants adopting the same catalog entry
// price it independently.
//
// Adoption copies these fields; it does not link. The merchant's Product
// records where it came from via sourceCatalogId, but later edits here never
// propagate to merchants who already adopted, which is the trade that lets
// them rename freely afterward.
export interface CatalogProduct {
  id: string
  name: string
  brand: string
  category: ProductCategory
  model: string
  modelNumber: string
  storage?: string
  ram?: string
  color: string
  connection?: string
  type: ProductType
  // Generated to the standard format (see utils/catalogSku.ts), previewed
  // while the form is filled, and overridable before saving.
  skuCode: string
  photos?: string[]
  createdAt: string
  deletedAt: string | null
}
