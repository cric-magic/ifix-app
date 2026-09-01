import { Button, Descriptions, Image, Tag, Typography, theme } from 'antd'
import { ImageOff, Pencil } from 'lucide-react'
import type { AuthUser } from '../../../types/installment'
import type { Product } from '../../../types/product'
import { canViewCostPrice } from '../../../constants/roles'
import { CATEGORY_LABELS, TYPE_LABELS } from '../../../constants/products'
import { useIconColors } from '../../../constants/iconColors'
import { IMAGE_PREVIEW_CLOSE_ICON } from '../../../constants/imagePreviewIcons'
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
  const iconColors = useIconColors()

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
    <div className="ifix-table-panel" style={{ marginBottom: 16 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        paddingLeft: 16,
        paddingRight: 8,
        boxShadow: `inset 0 -0.5px 0 0 ${token.colorBorderSecondary}`,
      }}>
        <Typography.Text strong style={{ fontSize: 15 }}>Product Details</Typography.Text>
        {canEdit && (
          // paddingRight: 2 on top of the header row's own 8px — matches
          // the button's own top/bottom centering gap (10px, the derived
          // (56 - 36) / 2 remainder from centering a 36px-tall button in
          // this 56px-tall row), so the button sits equidistant from all
          // three edges instead of closer to the right one.
          <div style={{ paddingRight: 2 }}>
            <Button icon={<Pencil size={16} strokeWidth={2.25} />} onClick={onEdit}>Edit</Button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 24, padding: 16 }}>
        <div style={{ width: 220, flexShrink: 0 }}>
          {product.photos && product.photos.length > 0 ? (
            <Image.PreviewGroup
              preview={{
                countRender: (current, total) => <span>Photo {current} / {total}</span>,
                closeIcon: IMAGE_PREVIEW_CLOSE_ICON,
              }}
            >
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 100px)',
                gap: 8,
                maxHeight: 220,
                overflowY: 'auto',
                paddingRight: product.photos.length > 4 ? 10 : 0,
              }}>
                {product.photos.map((photo, i) => (
                  <Image
                    key={i}
                    src={photo}
                    alt={`Photo ${i + 1}`}
                    width={100}
                    height={100}
                    style={{
                      objectFit: 'cover',
                      borderRadius: 8,
                      border: `0.5px solid ${token.colorBorderSecondary}`,
                      boxShadow: 'var(--ant-box-shadow)',
                    }}
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
              borderRadius: 8,
              border: `0.5px solid ${token.colorBorderSecondary}`,
              boxShadow: 'var(--ant-box-shadow)',
              background: token.colorFillQuaternary,
              color: iconColors.secondary,
            }}>
              <ImageOff size={20} strokeWidth={2.25} />
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>No photos</Typography.Text>
            </div>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Typography.Text strong style={{ fontSize: 20 }}>{product.name}</Typography.Text>
            <Tag style={{ margin: 0, background: token.colorFillSecondary, color: token.colorTextSecondary, fontSize: token.fontSize, border: 'none' }}>
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
            contentStyle={{ fontSize: 14 }}
          />
        </div>
      </div>
    </div>
  )
}
