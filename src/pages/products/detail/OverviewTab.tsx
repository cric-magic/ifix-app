import { Button, Descriptions, Image, Tag, Typography, theme } from 'antd'
import { ImageOff, Pencil } from 'lucide-react'
import type { AuthUser } from '../../../types/installment'
import type { Product } from '../../../types/product'
import { canViewCostPrice } from '../../../constants/roles'
import { CATEGORY_LABELS, TYPE_LABELS } from '../../../constants/products'
import { ICON_COLOR_SECONDARY } from '../../../constants/iconColors'
import { ProductStatusTag } from '../components/ProductStatusTag'

const formatter = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 })

interface Props {
  actor: AuthUser
  product: Product
  canEdit: boolean
  onEdit: () => void
}

export function OverviewTab({ actor, product, canEdit, onEdit }: Props) {
  const showCostPrice = canViewCostPrice(actor)
  const { token } = theme.useToken()

  const items = [
    { key: 'brand', label: 'Brand', children: product.brand },
    { key: 'category', label: 'Category', children: CATEGORY_LABELS[product.category] },
    { key: 'model', label: 'Model', children: product.model, span: product.storage ? 1 : 2 },
    ...(product.storage ? [{ key: 'storage', label: 'Storage', children: product.storage }] : []),
    { key: 'color', label: 'Color', children: product.color },
    { key: 'sku', label: 'SKU', children: product.sku },
    ...(showCostPrice
      ? [
        { key: 'costPrice', label: 'Cost Price', children: formatter.format(product.costPrice) },
        { key: 'salesPrice', label: 'Sales Price', children: formatter.format(product.salesPrice) },
      ]
      : [{ key: 'salesPrice', label: 'Sales Price', children: formatter.format(product.salesPrice), span: 2 }]),
  ]

  return (
    <div className="ifix-table-panel" style={{ marginBottom: 20 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        padding: '0 16px',
        borderBottom: `0.5px solid ${token.colorBorderSecondary}`,
      }}>
        <Typography.Text strong style={{ fontSize: 15 }}>Product Details</Typography.Text>
        {canEdit && (
          <Button icon={<Pencil size={16} strokeWidth={2.25} />} onClick={onEdit}>Edit</Button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 24, padding: 16 }}>
        <div style={{ width: 220, flexShrink: 0 }}>
          {product.photos && product.photos.length > 0 ? (
            <Image.PreviewGroup>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {product.photos.map((photo, i) => (
                  <Image
                    key={i}
                    src={photo}
                    width={100}
                    height={100}
                    style={{ objectFit: 'cover', borderRadius: 6 }}
                  />
                ))}
              </div>
            </Image.PreviewGroup>
          ) : (
            <div style={{
              width: 220,
              height: 220,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              borderRadius: 6,
              background: token.colorFillQuaternary,
              color: ICON_COLOR_SECONDARY,
            }}>
              <ImageOff size={20} strokeWidth={2.25} />
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>No photos</Typography.Text>
            </div>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Typography.Text strong style={{ fontSize: 20 }}>{product.name}</Typography.Text>
            <Tag style={{ margin: 0, background: token.colorFillTertiary, color: token.colorTextSecondary, fontSize: token.fontSize, border: 'none' }}>
              {TYPE_LABELS[product.type]}
            </Tag>
            <ProductStatusTag status={product.status} />
          </div>
          <Descriptions
            column={2}
            bordered={false}
            layout="horizontal"
            items={items}
            labelStyle={{ fontSize: 14 }}
            contentStyle={{ fontSize: 15 }}
          />
        </div>
      </div>
    </div>
  )
}
