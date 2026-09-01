import { theme } from 'antd'
import type { MerchantStatus } from '../../../types/merchant'
import { DotTag } from '../../../components/DotTag'

const LABELS: Record<MerchantStatus, string> = {
  active: 'Active',
  suspended: 'Suspended',
}

export function MerchantStatusTag({ status }: { status: MerchantStatus }) {
  const { token } = theme.useToken()
  const dotColor = {
    active: token.colorSuccess,
    suspended: token.colorError,
  }[status]
  return <DotTag dotColor={dotColor}>{LABELS[status]}</DotTag>
}
