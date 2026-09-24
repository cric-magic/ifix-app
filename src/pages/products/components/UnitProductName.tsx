import { useNavigate } from 'react-router-dom'
import { Tag, theme } from 'antd'
import type { Product } from '../../../types/product'

interface Props {
  product: Product | undefined
  color: string
}

// A unit's product, as shown on the Units list and a unit's detail page: a
// link to the product while it exists; once the SKU has been removed (a soft
// delete — its units stay, see scopedAllUnits) the name stays readable but
// is no longer a link to a page that's gone, and says so with the same
// neutral tag the app uses for "Default".
export function UnitProductName({ product, color }: Props) {
  const navigate = useNavigate()
  const { token } = theme.useToken()

  if (!product) return <span style={{ color: token.colorTextDisabled }}>—</span>

  if (product.deletedAt) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color }}>{product.name}</span>
        <Tag style={{ margin: 0, background: token.colorFillSecondary, color: token.colorTextSecondary, fontSize: token.fontSizeSM, border: 'none' }}>
          Removed
        </Tag>
      </span>
    )
  }

  return (
    <a onClick={() => navigate(`/products/catalog/${product.id}`)} style={{ color }}>
      {product.name}
    </a>
  )
}
