import { useState } from 'react'
import { fullSkuName } from '../../utils/product'
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

  const canManage = canManageProducts(user)
  const products = scopedProductList(user, MOCK_PRODUCTS)
  // Removed (soft-deleted) products, for the Removed tab to restore from —
  // only for roles that can remove and restore them.
  const removedProducts = canManage
    ? scopedProductList(user, MOCK_PRODUCTS, undefined, { includeRemoved: true }).filter(p => p.deletedAt)
    : []
  const query = search.trim().toLowerCase()
  const matchesSearch = (list: Product[]) => query
    ? list.filter(p =>
        fullSkuName(p).toLowerCase().includes(query) ||
        p.name.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.model.toLowerCase().includes(query) ||
        p.modelNumber.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query),
      )
    : list
  const searched = matchesSearch(products)
  const searchedRemoved = matchesSearch(removedProducts)
  // The condition tabs' counts: within the search, so they say how many
  // matches each condition holds.
  const typeCounts: Record<TypeFilter, number> = {
    all: searched.length,
    new: searched.filter(p => p.type === 'new').length,
    opened: searched.filter(p => p.type === 'opened').length,
    used: searched.filter(p => p.type === 'used').length,
    removed: searchedRemoved.length,
  }
  const filteredProducts = typeFilter === 'removed'
    ? searchedRemoved
    : typeFilter === 'all' ? searched : searched.filter(p => p.type === typeFilter)
  void version // trigger re-render on mutation

  function refresh() {
    setVersion(v => v + 1)
  }

  function handleRemove(product: Product) {
    product.deletedAt = new Date().toISOString()
    message.success(`${product.name} removed`)
    refresh()
  }

  // Undoing a removal: the product comes back to the catalog, and since its
  // units' stored availability never changed, they come back exactly as
  // they were — Available ones sellable again, Sold ones still Sold.
  function handleRestore(product: Product) {
    product.deletedAt = null
    message.success(`${fullSkuName(product)} restored`)
    if (typeFilter === 'removed' && removedProducts.length === 1) setTypeFilter('all')
    refresh()
  }

  return (
    <div className="ifix-fill-page">
      <ListToolbar
        leading={<ProductTypeTabs activeType={typeFilter} onChange={setTypeFilter} counts={typeCounts} showRemoved={canManage} />}
        search={<ListSearch value={search} onChange={setSearch} placeholder="Search by name, brand, or SKU" mobilePlaceholder="Search products" />}
        action={canManage ? { label: 'Create Product', onClick: () => setCreateOpen(true) } : undefined}
      />

      <ProductTable
        actor={user}
        products={filteredProducts}
        isSearching={!!query}
        onEdit={setEditingProduct}
        onRemove={handleRemove}
        onRestore={handleRestore}
        onAddUnit={setAddUnitProduct}
      />

      <CreateProductModal
        open={createOpen}
        actor={user}
        onClose={() => setCreateOpen(false)}
        onRestore={product => {
          setCreateOpen(false)
          handleRestore(product)
        }}
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
