import { useState } from 'react'
import { Button, Image, Tag, Typography, theme } from 'antd'
import { ImageOff, Pencil } from 'lucide-react'
import type { AuthUser } from '../../../types/installment'
import type { Product } from '../../../types/product'
import { canViewCostPrice } from '../../../constants/roles'
import { CATEGORY_LABELS, TYPE_LABELS } from '../../../constants/products'
import { useIconColors } from '../../../constants/iconColors'
import { IMAGE_PREVIEW_CLOSE_ICON } from '../../../constants/imagePreviewIcons'
import { DetailDescriptions } from '../../../components/DetailDescriptions'
import { ProductStatusTag } from '../components/ProductStatusTag'

const formatter = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 })

interface Props {
  actor: AuthUser
  product: Product
  canEdit: boolean
  onEdit: () => void
}

// Ant Design's own PageHeader was dropped from core in v5+ (it now only
// lives in the separate @ant-design/pro-components package) — this
// reproduces its layout by hand instead of adding that dependency: title
// (+ tags) on the left, actions on the right, no card chrome around it.
// Photos got a full separate panel at one point, then were pulled back to
// a small thumbnail beside the title instead — a whole panel gave a
// handful of reference photos more weight than they need on a page
// that's really about the product's attributes and its units.
export function OverviewTab({ actor, product, canEdit, onEdit }: Props) {
  const showCostPrice = canViewCostPrice(actor)
  const { token } = theme.useToken()
  const iconColors = useIconColors()
  const photoCount = product.photos?.length ?? 0
  const [thumbnailHovered, setThumbnailHovered] = useState(false)

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
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}
            onMouseEnter={() => setThumbnailHovered(true)}
            onMouseLeave={() => setThumbnailHovered(false)}
          >
            {photoCount > 0 ? (
              <Image.PreviewGroup preview={{ countRender: (current, total) => <span>Photo {current} / {total}</span>, closeIcon: IMAGE_PREVIEW_CLOSE_ICON }}>
                <Image
                  src={product.photos![0]}
                  alt={product.name}
                  width={40}
                  height={40}
                  style={{ objectFit: 'cover', borderRadius: token.borderRadiusSM, border: `0.5px solid ${token.colorBorderSecondary}` }}
                />
                {/* Rest of the photos join the same preview group (so the
                    thumbnail's click-to-preview cycles through all of them)
                    without rendering a second visible thumbnail. */}
                {product.photos!.slice(1).map((photo, i) => (
                  <Image key={i} src={photo} alt="" style={{ display: 'none' }} />
                ))}
              </Image.PreviewGroup>
            ) : (
              <div style={{
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: token.borderRadiusSM,
                border: `0.5px solid ${token.colorBorderSecondary}`,
                background: token.colorFillQuaternary,
                color: iconColors.secondary,
              }}>
                <ImageOff size={16} strokeWidth={2.25} />
              </div>
            )}
            {photoCount > 0 && thumbnailHovered && (
              // Same colorBgMask/colorTextLightSolid pairing antd's own
              // Image component uses for its hover-to-preview mask — a
              // fixed dark scrim with always-light text, not themed
              // secondary/tertiary text, since it needs to stay readable
              // sitting directly on top of an arbitrary photo in both
              // light and dark mode.
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: token.borderRadiusSM,
                background: token.colorBgMask,
                color: token.colorTextLightSolid,
                fontSize: 12,
                fontWeight: 600,
                pointerEvents: 'none',
              }}>
                +{photoCount}
              </div>
            )}
          </div>

          <Typography.Title level={4} style={{ margin: 0 }}>{product.name}</Typography.Title>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Tag style={{ margin: 0, background: token.colorFillSecondary, color: token.colorTextSecondary, fontSize: token.fontSizeSM, border: 'none' }}>
              {TYPE_LABELS[product.type]}
            </Tag>
            <ProductStatusTag status={product.status} />
          </div>
        </div>
        {canEdit && (
          <Button icon={<Pencil size={16} strokeWidth={2.25} />} onClick={onEdit}>Edit</Button>
        )}
      </div>

      <DetailDescriptions items={items} />
    </div>
  )
}
