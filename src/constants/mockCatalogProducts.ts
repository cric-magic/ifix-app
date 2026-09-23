import type { CatalogProduct } from '../types/catalogProduct'
import type { ProductCategory, ProductType } from '../types/product'
import { generateCatalogSkuCode } from '../utils/catalogSku'

// The prototype's device lineup, kept deliberately small and familiar so the
// lists are easy to scan: each current flagship line with its real storage
// options and two colours per model. Every other seed — the global catalog
// below, the demo merchant's own catalog (mockProducts.ts) and its units
// (mockProductUnits.ts) — is expanded from this one table, so adding a model
// or a colour here flows through to all three.
//
// Storage follows what each model actually ships in (the iPhone 17 and
// Galaxy S25+ have no 1TB option), so the matrix isn't perfectly square.
// Samsung model numbers are the real international ones; the iPhone 17
// family's A-numbers are illustrative.
export interface LineupModel {
  brand: string
  model: string
  modelNumber: string
  category: ProductCategory
  ram?: string
  connection?: string
  // undefined for products with no storage (accessories).
  storages: (string | undefined)[]
  colors: string[]
}

export const LINEUP: LineupModel[] = [
  { brand: 'Apple', model: 'iPhone 17', modelNumber: 'A3258', category: 'smartphone', ram: '8GB', connection: '5G', storages: ['256GB', '512GB'], colors: ['Black', 'Lavender'] },
  { brand: 'Apple', model: 'iPhone 17 Pro', modelNumber: 'A3256', category: 'smartphone', ram: '12GB', connection: '5G', storages: ['256GB', '512GB', '1TB'], colors: ['Cosmic Orange', 'Deep Blue'] },
  { brand: 'Apple', model: 'iPhone 17 Pro Max', modelNumber: 'A3257', category: 'smartphone', ram: '12GB', connection: '5G', storages: ['256GB', '512GB', '1TB'], colors: ['Cosmic Orange', 'Silver'] },
  { brand: 'Samsung', model: 'Galaxy S25', modelNumber: 'SM-S931B', category: 'smartphone', ram: '12GB', connection: '5G', storages: ['128GB', '256GB', '512GB'], colors: ['Icyblue', 'Navy'] },
  { brand: 'Samsung', model: 'Galaxy S25+', modelNumber: 'SM-S936B', category: 'smartphone', ram: '12GB', connection: '5G', storages: ['256GB', '512GB'], colors: ['Navy', 'Silver Shadow'] },
  { brand: 'Samsung', model: 'Galaxy S25 Ultra', modelNumber: 'SM-S938B', category: 'smartphone', ram: '12GB', connection: '5G', storages: ['256GB', '512GB', '1TB'], colors: ['Titanium Black', 'Titanium Silverblue'] },
  // The one non-phone: Staff category restriction only visibly does
  // anything when some category falls outside it.
  { brand: 'Apple', model: 'AirPods Pro 3', modelNumber: 'A3063', category: 'accessory', storages: [undefined], colors: ['White'] },
]

// Used stock is a variant the same way a colour is: same model, its own SKU
// (generated with a -U suffix). Kept to one per brand so the Used type, grade
// and battery fields have something to show without doubling the lineup.
export const USED_VARIANTS: { model: string; storage: string; color: string }[] = [
  { model: 'iPhone 17 Pro', storage: '256GB', color: 'Deep Blue' },
  { model: 'Galaxy S25', storage: '256GB', color: 'Navy' },
]

// In the platform catalog but not adopted by the demo merchant, so the
// "Add from catalog" picker has something left to offer.
const CATALOG_ONLY: LineupModel[] = [
  { brand: 'Apple', model: 'iPhone Air', modelNumber: 'A3260', category: 'smartphone', ram: '12GB', connection: '5G', storages: ['256GB', '512GB'], colors: ['Sky Blue', 'Space Black'] },
  { brand: 'Samsung', model: 'Galaxy Z Flip7', modelNumber: 'SM-F766B', category: 'smartphone', ram: '12GB', connection: '5G', storages: ['256GB', '512GB'], colors: ['Jetblack', 'Blue Shadow'] },
]

// Launch dates, so the records carry plausible history rather than all
// appearing on one day.
const RELEASED: Record<string, string> = {
  Apple: '2025-09-19T09:00:00.000Z',
  Samsung: '2025-02-07T09:00:00.000Z',
}

export interface LineupVariant {
  line: LineupModel
  storage?: string
  color: string
  type: ProductType
  skuCode: string
}

function variantsOf(line: LineupModel): LineupVariant[] {
  return line.storages.flatMap(storage => line.colors.map(color => ({
    line,
    storage,
    color,
    type: 'new' as const,
    skuCode: generateCatalogSkuCode({ model: line.model, storage, color, type: 'new' }),
  })))
}

// Every variant the demo merchant carries: the full new lineup plus the
// used ones. mockProducts.ts and mockProductUnits.ts both expand from this.
export const LINEUP_VARIANTS: LineupVariant[] = [
  ...LINEUP.flatMap(variantsOf),
  ...USED_VARIANTS.map(v => {
    const line = LINEUP.find(l => l.model === v.model)!
    return {
      line,
      storage: v.storage,
      color: v.color,
      type: 'used' as const,
      skuCode: generateCatalogSkuCode({ model: line.model, storage: v.storage, color: v.color, type: 'used' }),
    }
  }),
]

export function photoFor(model: string): string {
  return `https://placehold.co/400x400/1a1a1a/999999?text=${encodeURIComponent(model).replace(/%20/g, '+')}`
}

function toCatalogProduct(v: LineupVariant): CatalogProduct {
  return {
    id: `cat-${v.skuCode.toLowerCase()}`,
    name: v.line.model,
    brand: v.line.brand,
    category: v.line.category,
    model: v.line.model,
    modelNumber: v.line.modelNumber,
    storage: v.storage,
    ram: v.line.ram,
    color: v.color,
    connection: v.line.connection,
    type: v.type,
    skuCode: v.skuCode,
    photos: [photoFor(v.line.model)],
    createdAt: RELEASED[v.line.brand],
    deletedAt: null,
  }
}

// The platform's standard SKU definitions — codes follow the generated
// format (utils/catalogSku.ts).
export const MOCK_CATALOG_PRODUCTS: CatalogProduct[] = [
  ...LINEUP_VARIANTS.map(toCatalogProduct),
  ...CATALOG_ONLY.flatMap(variantsOf).map(toCatalogProduct),
]

export function catalogIdFor(skuCode: string): string {
  return `cat-${skuCode.toLowerCase()}`
}
