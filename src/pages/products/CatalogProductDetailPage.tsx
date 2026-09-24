import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Tag, Typography, message, theme } from 'antd'
import { Pencil, Lock, Package } from 'lucide-react'
import { useCurrentUser } from '../../contexts/AuthContext'
import { canManageCatalogProducts, homePath } from '../../constants/roles'
import { MOCK_CATALOG_PRODUCTS } from '../../constants/mockCatalogProducts'
import { CATEGORY_LABELS, TYPE_LABELS } from '../../constants/products'
import { DetailDescriptions } from '../../components/DetailDescriptions'
import type { CatalogProduct } from '../../types/catalogProduct'
import { CatalogProductModal } from './components/CatalogProductModal'
import { ProductPhotoThumbnail } from './components/ProductPhotoThumbnail'
import { PageEmptyState } from '../../components/PageEmptyState'

// Super Admin's view of one standard catalog entry. Mirrors the header of a
// merchant's product detail (detail/OverviewTab) — photo, name and Type tag
// on the left, Edit on the right, attributes below — minus everything a
// catalog entry doesn't carry: no prices, status or units, since those are
// set by each merchant on their own copy.
export function CatalogProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const actor = useCurrentUser()
  const navigate = useNavigate()
  const { token } = theme.useToken()
  const [editOpen, setEditOpen] = useState(false)
  const [version, setVersion] = useState(0)
  void version // re-render after the mock record is replaced in place

  if (!canManageCatalogProducts(actor)) {
    return (
      <PageEmptyState
        icon={<Lock size={22} strokeWidth={2.25} />}
        title="Not applicable"
        description="The standard catalog is managed at the platform level by Super Admin."
        action={<Button onClick={() => navigate(homePath(actor))}>Back home</Button>}
      />
    )
  }

  const product = MOCK_CATALOG_PRODUCTS.find(c => c.id === id && !c.deletedAt)
  if (!product) {
    return (
      <PageEmptyState
        icon={<Package size={22} strokeWidth={2.25} />}
        title="Catalog product not found"
        action={<Button onClick={() => navigate('/products/catalog')}>Back to list</Button>}
      />
    )
  }

  function handleSaved(updated: CatalogProduct) {
    const idx = MOCK_CATALOG_PRODUCTS.findIndex(c => c.id === updated.id)
    if (idx !== -1) MOCK_CATALOG_PRODUCTS[idx] = updated
    setEditOpen(false)
    setVersion(v => v + 1)
    message.success(`${updated.name} updated`)
  }

  // Storage/RAM/Connection only apply to some categories, so each is dropped
  // rather than shown as an empty row — same as the merchant detail.
  const items = [
    { key: 'brand', label: 'Brand', children: product.brand },
    { key: 'category', label: 'Category', children: CATEGORY_LABELS[product.category] },
    { key: 'model', label: 'Model', children: product.model },
    { key: 'modelNumber', label: 'Model Number', children: product.modelNumber },
    ...(product.storage ? [{ key: 'storage', label: 'Storage', children: product.storage }] : []),
    ...(product.ram ? [{ key: 'ram', label: 'RAM', children: product.ram }] : []),
    { key: 'color', label: 'Color', children: product.color },
    ...(product.connection ? [{ key: 'connection', label: 'Connection', children: product.connection }] : []),
    { key: 'sku', label: 'SKU Code', children: product.skuCode },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ProductPhotoThumbnail photos={product.photos} alt={product.name} />
          <Typography.Title level={4} style={{ margin: 0 }}>{product.name}</Typography.Title>
          <Tag style={{ margin: 0, background: token.colorFillSecondary, color: token.colorTextSecondary, fontSize: token.fontSizeSM, border: 'none' }}>
            {TYPE_LABELS[product.type]}
          </Tag>
        </div>
        <Button icon={<Pencil size={16} strokeWidth={2.25} />} onClick={() => setEditOpen(true)}>Edit</Button>
      </div>

      <DetailDescriptions items={items} />

      <CatalogProductModal
        open={editOpen}
        product={product}
        onClose={() => setEditOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  )
}
