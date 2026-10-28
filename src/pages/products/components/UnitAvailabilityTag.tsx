import { Tooltip } from 'antd'
import type { Product, ProductUnit } from '../../../types/product'
import { StatusTag } from '../../../components/DotTag'
import { UNIT_AVAILABILITY_BADGES } from '../../../constants/statusBadges'
import { notForSaleReason, unitDisplayStatus } from '../../../utils/product'

// A unit's availability as a tinted tag, matching the status tabs' counts
// above the list. An Available unit whose product is removed or Unavailable
// shows as Not for sale — it's still in stock, it just can't be sold — with
// the reason on hover.
export function UnitAvailabilityTag({ unit, product }: { unit: ProductUnit; product: Product | undefined }) {
  const status = unitDisplayStatus(unit, product)
  const tag = <StatusTag badge={UNIT_AVAILABILITY_BADGES[status]} />
  if (status !== 'not_for_sale') return tag
  return <Tooltip title={`${notForSaleReason(product)}, so this unit can't go on a new contract.`}><span>{tag}</span></Tooltip>
}
