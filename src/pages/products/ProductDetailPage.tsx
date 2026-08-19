import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Result, message } from 'antd'
import { useCurrentUser } from '../../contexts/AuthContext'
import { MOCK_PRODUCTS } from '../../constants/mockProducts'
import { canManageProducts, canViewProducts } from '../../constants/roles'
import { EditProductModal } from './components/EditProductModal'
import { OverviewTab } from './detail/OverviewTab'
import { UnitsTab } from './detail/UnitsTab'

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const user = useCurrentUser()
  const navigate = useNavigate()
  const [editOpen, setEditOpen] = useState(false)
  const [version, setVersion] = useState(0)

  const product = MOCK_PRODUCTS.find(p => p.id === id && !p.deletedAt)
  void version

  if (!canViewProducts(user)) {
    return (
      <Result
        status="403"
        title="Not applicable"
        subTitle="Products are scoped to a merchant workspace. Super Admin operates at the platform level."
        extra={<Button onClick={() => navigate('/contracts')}>Back home</Button>}
      />
    )
  }

  if (!product || product.merchantId !== user.merchantId) {
    return (
      <Result
        status="404"
        title="Product not found"
        extra={<Button onClick={() => navigate('/products/catalog')}>Back to list</Button>}
      />
    )
  }

  const canEdit = canManageProducts(user)

  return (
    <div>
      <OverviewTab actor={user} product={product} canEdit={canEdit} onEdit={() => setEditOpen(true)} />

      <UnitsTab actor={user} product={product} />

      <EditProductModal
        open={editOpen}
        product={product}
        onClose={() => setEditOpen(false)}
        onUpdated={() => {
          setEditOpen(false)
          setVersion(v => v + 1)
          message.success('Product updated')
        }}
      />
    </div>
  )
}
