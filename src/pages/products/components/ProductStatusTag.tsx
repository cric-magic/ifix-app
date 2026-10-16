import type { ProductStatus } from '../../../types/product'
import { StatusTag } from '../../../components/DotTag'
import { PRODUCT_STATUS_BADGES } from '../../../constants/statusBadges'

// A SKU's status as a tinted tag, like a unit's availability: Available in
// the success tone; Unavailable neutral with faded text — it's switched off.
export function ProductStatusTag({ status }: { status: ProductStatus }) {
  return <StatusTag badge={PRODUCT_STATUS_BADGES[status]} />
}
