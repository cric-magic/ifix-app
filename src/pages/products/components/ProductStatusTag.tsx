import { theme } from 'antd'
import type { ProductStatus } from '../../../types/product'
import { STATUS_LABELS } from '../../../constants/products'
import { DotTag } from '../../../components/DotTag'

export function ProductStatusTag({ status }: { status: ProductStatus }) {
  const { token } = theme.useToken()
  const dotColor = status === 'available' ? token.colorSuccess : token.colorTextTertiary
  const textColor = status === 'available' ? undefined : token.colorTextTertiary
  return <DotTag dotColor={dotColor} textColor={textColor}>{STATUS_LABELS[status]}</DotTag>
}
