import { useState } from 'react'
import { Alert, message } from 'antd'
import { useCurrentUser } from '../../contexts/AuthContext'
import { ListToolbar } from '../../components/ListToolbar'
import { ListSearch } from '../../components/ListSearch'
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
  const [search, setSearch] = useState('')

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
  const typeFiltered = typeFilter === 'all' ? products : products.filter(p => p.type === typeFilter)
  const query = search.trim().toLowerCase()
  const filteredProducts = query
    ? typeFiltered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.model.toLowerCase().includes(query) ||
        p.modelNumber.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query),
      )
    : typeFiltered
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
    <div className="ifix-fill-page">
      <ListToolbar
        leading={<ProductTypeTabs activeType={typeFilter} onChange={setTypeFilter} />}
        search={<ListSearch value={search} onChange={setSearch} placeholder="Search by name, brand, or SKU" mobilePlaceholder="Search products" />}
        action={canManageProducts(user) ? { label: 'Create Product', onClick: () => setCreateOpen(true) } : undefined}
      />

      <ProductTable
        actor={user}
        products={filteredProducts}
        isSearching={!!query}
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
