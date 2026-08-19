import { useState } from 'react'
import { Alert, Button, message } from 'antd'
import { Plus } from 'lucide-react'
import { useCurrentUser } from '../../contexts/AuthContext'
import { MOCK_PRODUCTS } from '../../constants/mockProducts'
import { MOCK_PRODUCT_UNITS } from '../../constants/mockProductUnits'
import { canManageProducts, canViewProducts, scopedProductList } from '../../constants/roles'
import type { Product } from '../../types/product'
import { ProductTable } from './components/ProductTable'
import { ProductTypeTabs, type TypeFilter } from './components/ProductTypeTabs'
import { CreateProductModal } from './components/CreateProductModal'
import { EditProductModal } from './components/EditProductModal'
import { CreateUnitModal } from './components/CreateUnitModal'

export function ProductsPage() {
  const user = useCurrentUser()
  const [version, setVersion] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [addUnitProduct, setAddUnitProduct] = useState<Product | null>(null)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

  if (!canViewProducts(user)) {
    return (
      <Alert
        type="info"
        message="Not applicable"
        description="Products are scoped to a merchant workspace. Super Admin operates at the platform level."
        showIcon
      />
    )
  }

  const products = scopedProductList(user, MOCK_PRODUCTS)
  const filteredProducts = typeFilter === 'all' ? products : products.filter(p => p.type === typeFilter)
  void version // trigger re-render on mutation

  function refresh() {
    setVersion(v => v + 1)
  }

  function handleRemove(product: Product) {
    product.deletedAt = new Date().toISOString()
    message.success(`${product.name} removed`)
    refresh()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <ProductTypeTabs activeType={typeFilter} allProducts={products} onChange={setTypeFilter} />
        {canManageProducts(user) && (
          <Button type="primary" icon={<Plus size={15} strokeWidth={2.25} />} onClick={() => setCreateOpen(true)}>
            Create Product
          </Button>
        )}
      </div>

      <ProductTable
        actor={user}
        products={filteredProducts}
        onEdit={setEditingProduct}
        onRemove={handleRemove}
        onAddUnit={setAddUnitProduct}
      />

      <CreateProductModal
        open={createOpen}
        actor={user}
        onClose={() => setCreateOpen(false)}
        onCreated={product => {
          setCreateOpen(false)
          MOCK_PRODUCTS.push(product)
          refresh()
          message.success(`${product.name} created`)
        }}
      />

      <EditProductModal
        open={!!editingProduct}
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        onUpdated={() => {
          setEditingProduct(null)
          refresh()
          message.success('Product updated')
        }}
      />

      <CreateUnitModal
        open={!!addUnitProduct}
        actor={user}
        product={addUnitProduct}
        onClose={() => setAddUnitProduct(null)}
        onCreated={unit => {
          setAddUnitProduct(null)
          MOCK_PRODUCT_UNITS.push(unit)
          message.success('Unit added')
        }}
      />
    </div>
  )
}
