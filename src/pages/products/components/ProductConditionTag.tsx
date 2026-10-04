import { Tag, theme } from 'antd'
import type { ProductType } from '../../../types/product'
import { TYPE_LABELS } from '../../../constants/products'

// A SKU's condition — New, Opened or Used — as a small neutral tag beside a
// name or price. Neutral on purpose: none of the three is good or bad, so
// none gets a status colour. Same treatment as UnitProductName's "Removed".
export function ProductConditionTag({ type }: { type: ProductType }) {
  const { token } = theme.useToken()
  return (
    <Tag style={{ margin: 0, background: token.colorFillSecondary, color: token.colorTextSecondary, fontSize: token.fontSizeSM, border: 'none' }}>
      {TYPE_LABELS[type]}
    </Tag>
  )
}
