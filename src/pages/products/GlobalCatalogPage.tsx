import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { App, Avatar, Button, ConfigProvider, Dropdown, Table, message, theme } from 'antd'
import { Pencil, Trash2, MoreHorizontal, ImageOff, Package, ChevronLeft, ChevronRight } from 'lucide-react'
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
import { JUMP_PREV_ICON, JUMP_NEXT_ICON, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, PAGE_SIZE_CHANGER, MOBILE_PAGINATION } from '../../constants/paginationIcons'
import { useColumnPicker } from '../../components/useColumnPicker'
import { withColumnMinWidths } from '../../components/tableColumns'
import { ListToolbar } from '../../components/ListToolbar'
import { ListSearch } from '../../components/ListSearch'
import { useIsMobile } from '../../components/useIsMobile'
import { MobileTableRow } from '../../components/MobileTableRow'
import { MOBILE_TABLE_PROPS, mobileColumns, tablePanelPadding } from '../../components/mobileTable'
import { useActionSheet } from '../../components/useActionSheet'
import { rowActionMenu, type RowAction } from '../../components/rowActions'

// The platform's standard SKU definitions — what merchants adopt from rather
// than defining common devices themselves. Super Admin only; merchants see
// their own catalog at this same route (see ProductsCatalogRoute).
export function GlobalCatalogPage() {
  const applyColumnPicker = useColumnPicker('standard-catalog', ['name'])
  const actor = useCurrentUser()
  const navigate = useNavigate()
  const { token } = theme.useToken()
  const actionSheet = useActionSheet()
  const isMobile = useIsMobile()
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
  const searched = MOCK_CATALOG_PRODUCTS
    .filter(c => !c.deletedAt)
    .filter(c =>
      !query
      || c.name.toLowerCase().includes(query)
      || c.brand.toLowerCase().includes(query)
      || c.model.toLowerCase().includes(query)
      || c.modelNumber.toLowerCase().includes(query)
      || c.skuCode.toLowerCase().includes(query),
    )
  // The condition tabs' counts: within the search, so they say how many
  // matches each condition holds.
  const typeCounts: Record<TypeFilter, number> = {
    all: searched.length,
    new: searched.filter(p => p.type === 'new').length,
    opened: searched.filter(p => p.type === 'opened').length,
    used: searched.filter(p => p.type === 'used').length,
  }
  const products = typeFilter === 'all' ? searched : searched.filter(c => c.type === typeFilter)

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

  // A row's actions — the desktop "…" menu and the mobile action sheet
  // (its "…", on every row with actions, at every size).
  function rowActions(c: CatalogProduct): RowAction[] {
    return [
      { key: 'edit', icon: <Pencil size={16} strokeWidth={2.25} />, label: 'Edit', onClick: () => { setEditing(c); setModalOpen(true) } },
      {
        key: 'remove',
        danger: true,
        icon: <Trash2 size={16} strokeWidth={2.25} />,
        label: 'Remove',
        onClick: () => modal.confirm({
          title: 'Remove this catalog product?',
          content: 'Merchants can no longer adopt it. Those who already did keep their own copy.',
          okText: 'Remove',
          okButtonProps: { danger: true },
          onOk: () => handleRemove(c),
        }),
      },
    ]
  }

  function actionsMenu(c: CatalogProduct) {
    const actions = rowActions(c)
    if (actions.length === 0) return null
    return (
      <div onClick={e => e.stopPropagation()}>
        <Dropdown trigger={['click']} placement="bottomRight" menu={rowActionMenu(actions)}>
          <Button type="text" size="small" icon={<MoreHorizontal size={16} strokeWidth={2.25} />} />
        </Dropdown>
      </div>
    )
  }

  const thumbnail = (c: CatalogProduct, size: number) => (
    <Avatar
      shape="square"
      size={size}
      src={c.photos?.[0]}
      icon={<ImageOff size={size === 28 ? 14 : 16} strokeWidth={2.25} />}
      style={{ backgroundColor: token.colorFillSecondary, color: iconColors.secondary, flexShrink: 0 }}
    />
  )

  const columns: ColumnsType<CatalogProduct> = [
    {
      title: <span style={{ color: token.colorText }}>Name</span>,
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      render: (name: string, c) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {thumbnail(c, 28)}
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
    { title: 'Condition', key: 'type', fixed: 'right', render: (_, c) => TYPE_LABELS[c.type] },
    {
      title: '',
      key: 'actions',
      width: 56,
      fixed: 'right',
      align: 'right',
      render: (_, c) => <div onClick={e => e.stopPropagation()}>{actionsMenu(c)}</div>,
    },
  ]

  // Mobile: name on top with its type (New/Used); SKU code and brand below.
  const mobileRows = mobileColumns<CatalogProduct>(c => (
    <MobileTableRow
      leading={thumbnail(c, 44)}
      primary={c.name}
      trailing={<span style={{ fontSize: token.fontSizeSM, color: token.colorTextSecondary }}>{TYPE_LABELS[c.type]}</span>}
      secondary={`${c.skuCode} · ${c.brand}`}
      onMore={rowActions(c).length ? () => actionSheet.open(c.name, rowActions(c)) : undefined}
    />
  ))

  return (
    <div className="ifix-fill-page">
      <ListToolbar
        leading={<ProductTypeTabs activeType={typeFilter} onChange={setTypeFilter} counts={typeCounts} />}
        search={<ListSearch value={search} onChange={setSearch} placeholder="Search by name, brand, or SKU code" mobilePlaceholder="Search catalog" />}
        action={{ label: 'Create Product', onClick: () => { setEditing(null); setModalOpen(true) } }}
      />

      <div className="ifix-table-panel">
        <ConfigProvider theme={{ components: { Table: { colorText: token.colorTextTertiary, headerColor: token.colorTextTertiary } } }}>
          <div style={{ padding: tablePanelPadding(isMobile) }}>
            <div className="ifix-panel-table" style={{ margin: '0 -16px' }}>
              <Table
                rowKey="id"
                columns={isMobile ? mobileRows : applyColumnPicker(withColumnMinWidths(columns))}
                {...(isMobile ? MOBILE_TABLE_PROPS : {})}
                dataSource={products}
                scroll={(isMobile ? { y: '100%' } : { x: 'max-content', y: '100%' })}
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
                  defaultPageSize: DEFAULT_PAGE_SIZE,
                  size: 'small',
                  showSizeChanger: PAGE_SIZE_CHANGER,
                  pageSizeOptions: PAGE_SIZE_OPTIONS,
                  prevIcon: <ChevronLeft size={14} strokeWidth={2.25} />,
                  nextIcon: <ChevronRight size={14} strokeWidth={2.25} />,
                  jumpPrevIcon: JUMP_PREV_ICON,
                  jumpNextIcon: JUMP_NEXT_ICON,
                  showTotal: (total, range) => (
                    <span style={{ color: token.colorTextTertiary }}>
                      {range[0]}–{range[1]} of {total}
                    </span>
                  ),
                  ...(isMobile ? MOBILE_PAGINATION : {}),
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
      {actionSheet.sheet}
    </div>
  )
}
