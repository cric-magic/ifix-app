import { GRADE_LABELS } from '../../constants/products'
import type { Product, ProductUnit } from '../../types/product'

// Price Check works a model at a time — the way a customer asks ("an
// iPhone 17 Pro"), before storage, color and condition. A model is every
// SKU sharing a brand and model name: new and used alike.
export interface ModelGroup {
  key: string
  brand: string
  model: string
  products: Product[]
}

export function groupByModel(products: Product[]): ModelGroup[] {
  const groups = new Map<string, ModelGroup>()
  for (const p of products) {
    const key = `${p.brand}|${p.model}`
    const group = groups.get(key) ?? { key, brand: p.brand, model: p.model, products: [] }
    group.products.push(p)
    groups.set(key, group)
  }
  return [...groups.values()]
}

// A unit's condition as a customer hears it: New, or its grade. Used units
// of the same SKU can differ here, so it's read off the unit, not the SKU.
export type Condition = 'new' | 'A' | 'B' | 'C' | 'D'

export function conditionOf(unit: ProductUnit): Condition {
  return unit.grade ?? 'new'
}

export function conditionLabel(condition: Condition): string {
  return condition === 'new' ? 'New' : GRADE_LABELS[condition]
}
