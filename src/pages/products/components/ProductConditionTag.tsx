import type { ProductType } from '../../../types/product'
import { StatusTag } from '../../../components/DotTag'
import { PRODUCT_CONDITION_BADGES } from '../../../constants/statusBadges'

// A SKU's condition — New, Opened or Used — as a tinted tag in its
// condition's tone, matching the Catalog's condition tabs.
export function ProductConditionTag({ type }: { type: ProductType }) {
  return <StatusTag badge={PRODUCT_CONDITION_BADGES[type]} />
}
