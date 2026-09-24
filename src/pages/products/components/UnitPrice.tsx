import { theme } from 'antd'
import type { Product, ProductUnit } from '../../../types/product'

const formatter = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 })

// What a unit actually sells for. Per the doc, Custom Price "defaults to the
// SKU Sales Price when not set" — so an unset custom price shows the SKU's
// price rather than a blank, with a muted note saying where it came from,
// which also keeps a real custom price the one that stands out.
export function UnitPrice({ unit, product }: { unit: ProductUnit; product: Product | undefined }) {
  const { token } = theme.useToken()

  if (unit.customPrice) return <>{formatter.format(unit.customPrice)}</>
  if (!product) return <span style={{ color: token.colorTextDisabled }}>—</span>

  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
      {formatter.format(product.salesPrice)}
      <span style={{ fontSize: token.fontSizeSM, color: token.colorTextTertiary }}>Sales price</span>
    </span>
  )
}
