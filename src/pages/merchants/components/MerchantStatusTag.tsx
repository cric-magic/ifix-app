import type { MerchantStatus } from '../../../types/merchant'
import { StatusTag } from '../../../components/DotTag'
import { MERCHANT_STATUS_BADGES } from '../../../constants/statusBadges'

export function MerchantStatusTag({ status }: { status: MerchantStatus }) {
  return <StatusTag badge={MERCHANT_STATUS_BADGES[status]} />
}
