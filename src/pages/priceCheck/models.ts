import { GRADE_LABELS, TYPE_LABELS } from '../../constants/products'
import type { Product, ProductType, ProductUnit } from '../../types/product'

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

// A unit's condition as a customer hears it: New or Opened (its SKU's), or
// a Used unit's grade. Used units of the same SKU can differ here, so a
// grade is read off the unit, not the SKU.
export type Condition = 'new' | 'opened' | 'A' | 'B' | 'C' | 'D'

export const CONDITION_ORDER: Condition[] = ['new', 'opened', 'A', 'B', 'C', 'D']

export function conditionOf(unit: ProductUnit, product: Product): Condition {
  return product.type === 'used' ? unit.grade ?? 'A' : product.type
}

// The SKU condition a quoted condition belongs to.
export function typeOfCondition(condition: Condition): ProductType {
  return condition === 'new' || condition === 'opened' ? condition : 'used'
}

export function conditionLabel(condition: Condition): string {
  return condition === 'new' || condition === 'opened'
    ? TYPE_LABELS[condition]
    : `${TYPE_LABELS.used} · ${GRADE_LABELS[condition]}`
}
