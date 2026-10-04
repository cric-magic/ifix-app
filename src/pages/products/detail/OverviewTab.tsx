import { Button } from 'antd'
import { Pencil } from 'lucide-react'
import type { AuthUser } from '../../../types/installment'
import type { Product } from '../../../types/product'
import { canViewCostPrice } from '../../../constants/roles'
import { CATEGORY_LABELS } from '../../../constants/products'
import { DetailDescriptions } from '../../../components/DetailDescriptions'
import { DetailHeader } from '../../../components/DetailHeader'
import { fullSkuName } from '../../../utils/product'
import { ProductStatusTag } from '../components/ProductStatusTag'
import { ProductPhotoThumbnail } from '../components/ProductPhotoThumbnail'

const formatter = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 })

interface Props {
  actor: AuthUser
  product: Product
  canEdit: boolean
  onEdit: () => void
}

// The header is DetailHeader (on mobile, Edit moves to the page's bottom
// bar — see ProductDetailPage). Photos got a full separate panel at one point, then were pulled back to
// a small thumbnail beside the title instead — a whole panel gave a
// handful of reference photos more weight than they need on a page
// that's really about the product's attributes and its units.
export function OverviewTab({ actor, product, canEdit, onEdit }: Props) {
  const showCostPrice = canViewCostPrice(actor)

  // Storage/RAM/Connection only apply to some categories (an Accessory has
  // none of the three), so each is dropped entirely rather than shown as an
  // empty row.
  const items = [
    { key: 'brand', label: 'Brand', children: product.brand },
    { key: 'category', label: 'Category', children: CATEGORY_LABELS[product.category] },
    { key: 'model', label: 'Model', children: product.model },
    { key: 'modelNumber', label: 'Model Number', children: product.modelNumber },
    ...(product.storage ? [{ key: 'storage', label: 'Storage', children: product.storage }] : []),
    ...(product.ram ? [{ key: 'ram', label: 'RAM', children: product.ram }] : []),
    { key: 'color', label: 'Color', children: product.color },
    ...(product.connection ? [{ key: 'connection', label: 'Connection', children: product.connection }] : []),
    { key: 'sku', label: 'SKU Code', children: product.sku },
    // Where this SKU came from. Adopted entries are copies, so this is
    // history rather than a live link — the catalog entry may since have
    // changed or been removed without affecting this record.
    {
      key: 'source',
      label: 'Source',
      children: product.sourceCatalogId ? 'Standard catalog' : 'Created by you',
    },
    ...(showCostPrice
      ? [
        { key: 'costPrice', label: 'Cost Price', children: formatter.format(product.costPrice) },
        { key: 'salesPrice', label: 'Sales Price', children: formatter.format(product.salesPrice) },
      ]
      : [{ key: 'salesPrice', label: 'Sales Price', children: formatter.format(product.salesPrice), span: 2 }]),
  ]

  return (
    <div style={{ marginBottom: 24 }}>
      <DetailHeader
        leading={<ProductPhotoThumbnail photos={product.photos} alt={product.name} />}
        // The full SKU name, which already carries the condition.
        title={fullSkuName(product)}
        tags={<ProductStatusTag status={product.status} />}
        actions={canEdit && (
          <Button icon={<Pencil size={16} strokeWidth={2.25} />} onClick={onEdit}>Edit</Button>
        )}
      />

      <DetailDescriptions items={items} />
    </div>
  )
}
