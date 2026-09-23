import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { App, Avatar, Button, ConfigProvider, Dropdown, Input, Table, message, theme } from 'antd'
import { Plus, Pencil, Trash2, MoreHorizontal, ImageOff, Package, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'
import { useCurrentUser } from '../../contexts/AuthContext'
import { canManageCatalogProducts } from '../../constants/roles'
import { MOCK_CATALOG_PRODUCTS } from '../../constants/mockCatalogProducts'
import { CATEGORY_LABELS, TYPE_LABELS } from '../../constants/products'
import { useIconColors } from '../../constants/iconColors'
import { TableEmptyState } from '../../components/TableEmptyState'
import { ProductTypeTabs, type TypeFilter } from './components/ProductTypeTabs'
import type { CatalogProduct } from '../../types/catalogProduct'
import { CatalogProductModal } from './components/CatalogProductModal'
import { JUMP_PREV_ICON, JUMP_NEXT_ICON } from '../../constants/paginationIcons'

// The platform's standard SKU definitions — what merchants adopt from rather
// than defining common devices themselves. Super Admin only; merchants see
// their own catalog at this same route (see ProductsCatalogRoute).
export function GlobalCatalogPage() {
  const actor = useCurrentUser()
  const navigate = useNavigate()
  const { token } = theme.useToken()
  const iconColors = useIconColors()
  const { modal } = App.useApp()
  const [version, setVersion] = useState(0)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [editing, setEditing] = useState<CatalogProduct | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  void version // re-render after mutating the mock records in place

  if (!canManageCatalogProducts(actor)) {
    return <Navigate to="/products/catalog" replace />
  }

  const dash = <span style={{ color: token.colorTextDisabled }}>—</span>
  const query = search.trim().toLowerCase()
  const hasActiveFilter = !!query || typeFilter !== 'all'
  const products = MOCK_CATALOG_PRODUCTS
    .filter(c => !c.deletedAt)
    .filter(c => typeFilter === 'all' || c.type === typeFilter)
    .filter(c =>
      !query
      || c.name.toLowerCase().includes(query)
      || c.brand.toLowerCase().includes(query)
      || c.model.toLowerCase().includes(query)
      || c.modelNumber.toLowerCase().includes(query)
      || c.skuCode.toLowerCase().includes(query),
    )

  function refresh() {
    setVersion(v => v + 1)
  }

  function handleSaved(product: CatalogProduct) {
    const idx = MOCK_CATALOG_PRODUCTS.findIndex(c => c.id === product.id)
    if (idx === -1) {
      MOCK_CATALOG_PRODUCTS.push(product)
      message.success(`${product.name} added to the catalog`)
    } else {
      MOCK_CATALOG_PRODUCTS[idx] = product
      message.success(`${product.name} updated`)
    }
    setModalOpen(false)
    setEditing(null)
    refresh()
  }

  // Soft delete, same as merchant products — a removed entry stops being
  // adoptable but merchants who already copied it are untouched either way.
  function handleRemove(product: CatalogProduct) {
    product.deletedAt = new Date().toISOString()
    message.success(`${product.name} removed from the catalog`)
    refresh()
  }

  const columns: ColumnsType<CatalogProduct> = [
    {
      title: <span style={{ color: token.colorText }}>Name</span>,
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      render: (name: string, c) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar
            shape="square"
            size={28}
            src={c.photos?.[0]}
            icon={<ImageOff size={14} strokeWidth={2.25} />}
            style={{ backgroundColor: token.colorFillSecondary, color: iconColors.secondary, flexShrink: 0 }}
          />
          <span style={{ color: token.colorText }}>{name}</span>
        </div>
      ),
    },
    { title: 'SKU Code', dataIndex: 'skuCode', key: 'skuCode' },
    { title: 'Brand', dataIndex: 'brand', key: 'brand' },
    { title: 'Category', key: 'category', render: (_, c) => CATEGORY_LABELS[c.category] },
    { title: 'Model', dataIndex: 'model', key: 'model' },
    { title: 'Model Number', dataIndex: 'modelNumber', key: 'modelNumber' },
    { title: 'Storage', key: 'storage', render: (_, c) => c.storage ?? dash },
    { title: 'RAM', key: 'ram', render: (_, c) => c.ram ?? dash },
    { title: 'Color', dataIndex: 'color', key: 'color' },
    { title: 'Connection', key: 'connection', render: (_, c) => c.connection ?? dash },
    { title: 'Type', key: 'type', fixed: 'right', render: (_, c) => TYPE_LABELS[c.type] },
    {
      title: '',
      key: 'actions',
      width: 56,
      fixed: 'right',
      align: 'right',
      render: (_, c) => (
        <div onClick={e => e.stopPropagation()}>
          <Dropdown
            trigger={['click']}
            placement="bottomRight"
            menu={{
              items: [
                { key: 'edit', icon: <Pencil size={15} strokeWidth={2.25} />, label: 'Edit' },
                { type: 'divider' as const },
                { key: 'remove', danger: true, icon: <Trash2 size={15} strokeWidth={2.25} />, label: 'Remove' },
              ],
              onClick: ({ key }) => {
                if (key === 'edit') { setEditing(c); setModalOpen(true) }
                if (key === 'remove') {
                  modal.confirm({
                    title: 'Remove this catalog product?',
                    content: 'Merchants can no longer adopt it. Those who already did keep their own copy.',
                    okText: 'Remove',
                    okButtonProps: { danger: true },
                    onOk: () => handleRemove(c),
                  })
                }
              },
            }}
          >
            <Button type="text" size="small" icon={<MoreHorizontal size={15} strokeWidth={2.25} />} />
          </Dropdown>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 8, overflowX: 'auto', overflowY: 'clip' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Input
            placeholder="Search by name, brand, or SKU code"
            prefix={<Search size={15} strokeWidth={2.25} color={iconColors.secondary} />}
            allowClear
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 320 }}
          />
          <ProductTypeTabs activeType={typeFilter} onChange={setTypeFilter} />
        </div>
        <Button type="primary" icon={<Plus size={15} strokeWidth={2.25} />} onClick={() => { setEditing(null); setModalOpen(true) }}>
          Create Product
        </Button>
      </div>

      <div className="ifix-table-panel">
        <ConfigProvider theme={{ components: { Table: { colorText: token.colorTextTertiary, headerColor: token.colorTextTertiary } } }}>
          <div style={{ padding: 16 }}>
            <div className="ifix-panel-table" style={{ margin: '0 -16px' }}>
              <Table
                rowKey="id"
                columns={columns}
                dataSource={products}
                scroll={{ x: 'max-content' }}
                onRow={record => ({
                  onClick: () => navigate(`/products/catalog/${record.id}`),
                  style: { cursor: 'pointer' },
                })}
                locale={{
                  emptyText: hasActiveFilter ? (
                    <TableEmptyState icon={<Package size={22} strokeWidth={2.25} />} title="No catalog products found" description="Try a different name, brand, SKU code, or type." />
                  ) : (
                    <TableEmptyState icon={<Package size={22} strokeWidth={2.25} />} title="No catalog products yet" description="Standard products you add will show up here." />
                  ),
                }}
                pagination={{
                  pageSize: 10,
                  size: 'small',
                  showSizeChanger: false,
                  prevIcon: <ChevronLeft size={14} strokeWidth={2.25} />,
                  nextIcon: <ChevronRight size={14} strokeWidth={2.25} />,
                  jumpPrevIcon: JUMP_PREV_ICON,
                  jumpNextIcon: JUMP_NEXT_ICON,
                  showTotal: (total, range) => (
                    <span style={{ color: token.colorTextTertiary }}>{range[0]}–{range[1]} of {total}</span>
                  ),
                }}
              />
            </div>
          </div>
        </ConfigProvider>
      </div>

      <CatalogProductModal
        open={modalOpen}
        product={editing}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSaved={handleSaved}
      />
    </div>
  )
}
