import type { Product } from '../types/product'
import { MERCHANT_ID } from './mockUsers'
import { LINEUP_VARIANTS, catalogIdFor, photoFor } from './mockCatalogProducts'

// Sales prices in THB, by model and storage — colour doesn't change the
// price. Roughly Thai retail at launch; cost is derived below.
const PRICES: Record<string, Record<string, number>> = {
  'iPhone 17': { '256GB': 29900, '512GB': 37900 },
  'iPhone 17 Pro': { '256GB': 41900, '512GB': 49900, '1TB': 57900 },
  'iPhone 17 Pro Max': { '256GB': 48900, '512GB': 56900, '1TB': 64900 },
  'Galaxy S25': { '128GB': 28900, '256GB': 31900, '512GB': 35900 },
  'Galaxy S25+': { '256GB': 36900, '512GB': 40900 },
  'Galaxy S25 Ultra': { '256GB': 46900, '512GB': 50900, '1TB': 58900 },
  'AirPods Pro 3': { '': 8990 },
}

// Used stock sells well under the new price — its own figure rather than a
// flat discount, the way a merchant would actually set it.
const USED_PRICES: Record<string, number> = {
  'iPhone 17 Pro': 34900,
  'Galaxy S25': 23900,
}

// Roughly a 14% margin, rounded to the nearest hundred.
function costFor(salesPrice: number): number {
  return Math.round(salesPrice * 0.86 / 100) * 100
}

export function productIdFor(sku: string): string {
  return `prod-${sku.toLowerCase()}`
}

// The demo merchant's catalog: every lineup variant, adopted from the
// platform catalog. Each is a copy the merchant owns (sourceCatalogId is
// provenance only — see types/product.ts), carrying the catalog's spec and
// SKU code plus the merchant's own pricing.
export const MOCK_PRODUCTS: Product[] = LINEUP_VARIANTS.map(v => {
  const salesPrice = v.type === 'used'
    ? USED_PRICES[v.line.model]
    : PRICES[v.line.model][v.storage ?? '']
  return {
    id: productIdFor(v.skuCode),
    name: v.line.model,
    brand: v.line.brand,
    category: v.line.category,
    model: v.line.model,
    modelNumber: v.line.modelNumber,
    storage: v.storage,
    ram: v.line.ram,
    color: v.color,
    connection: v.line.connection,
    sku: v.skuCode,
    costPrice: costFor(salesPrice),
    salesPrice,
    type: v.type,
    status: 'available',
    photos: [photoFor(v.line.model)],
    merchantId: MERCHANT_ID,
    sourceCatalogId: catalogIdFor(v.skuCode),
    createdBy: 'admin-1',
    createdAt: v.line.brand === 'Apple' ? '2025-09-22T09:00:00.000Z' : '2025-02-10T09:00:00.000Z',
    deletedAt: null,
  }
})
