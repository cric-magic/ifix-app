import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Alert, ConfigProvider, Table, Button, Dropdown, Avatar, theme } from 'antd'
import { Pencil, Trash2, ChevronLeft, ChevronRight, MoreHorizontal, ImageOff, Printer, Smartphone, PackageOpen } from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'
import { useCurrentUser } from '../../contexts/AuthContext'
import { MOCK_PRODUCTS } from '../../constants/mockProducts'
import { MOCK_PRODUCT_UNITS } from '../../constants/mockProductUnits'
import { canManageUnits, canPrintUnitCodes, canViewUnits, scopedAllUnits, scopedProductList } from '../../constants/roles'
import { AVAILABILITY_LABELS, GRADE_LABELS, TAX_LABELS } from '../../constants/products'
import { useIconColors } from '../../constants/iconColors'
import { Select } from '../../components/AppSelect'
import type { ProductUnit, UnitAvailability } from '../../types/product'
import { UnitAvailabilityTag } from './components/UnitAvailabilityTag'
import { EditUnitModal } from './components/EditUnitModal'
import { CreateUnitModal } from './components/CreateUnitModal'
import { PrintUnitLabelModal } from './components/PrintUnitLabelModal'
import { TableEmptyState } from '../../components/TableEmptyState'
import { UnitProductName } from './components/UnitProductName'
import { MarkOpenedModal } from './components/MarkOpenedModal'
import { canMarkOpened, fullSkuName } from '../../utils/product'
import { JUMP_PREV_ICON, JUMP_NEXT_ICON, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, PAGE_SIZE_CHANGER, MOBILE_PAGINATION } from '../../constants/paginationIcons'
import { useIsMobile } from '../../components/useIsMobile'
import { MobileTableRow } from '../../components/MobileTableRow'
import { MOBILE_TABLE_PROPS, mobileColumns, tablePanelPadding } from '../../components/mobileTable'
import { ListToolbar } from '../../components/ListToolbar'
import { ListSearch } from '../../components/ListSearch'
import { UnitPrice } from './components/UnitPrice'
import { useColumnPicker } from '../../components/useColumnPicker'
import { withColumnMinWidths } from '../../components/tableColumns'
import { useActionSheet } from '../../components/useActionSheet'
import { rowActionMenu, type RowAction } from '../../components/rowActions'

const priceFormatter = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 })

type AvailabilityFilter = 'all' | UnitAvailability

const AVAILABILITY_OPTIONS: { value: AvailabilityFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'available', label: AVAILABILITY_LABELS.available },
  { value: 'reserved', label: AVAILABILITY_LABELS.reserved },
  { value: 'sold', label: AVAILABILITY_LABELS.sold },
]

export function UnitsListPage() {
  const applyColumnPicker = useColumnPicker('units', ['serialNumber', 'availability'])
  const user = useCurrentUser()
  const navigate = useNavigate()
  const { token } = theme.useToken()
  const actionSheet = useActionSheet()
  const isMobile = useIsMobile()
  const iconColors = useIconColors()
  const { modal, message } = App.useApp()
  const [version, setVersion] = useState(0)
  const [editingUnit, setEditingUnit] = useState<ProductUnit | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [printingUnit, setPrintingUnit] = useState<ProductUnit | null>(null)
  const [openingUnit, setOpeningUnit] = useState<ProductUnit | null>(null)
  const [search, setSearch] = useState('')
  const [availability, setAvailability] = useState<AvailabilityFilter>('all')

  // Staff reach this list read-only, to find a unit and print its label
  // (the doc's "Generate & Print Barcode — Staff ✅ (Own branch)"); every
  // write action below is gated on canManageUnits separately.
  if (!canViewUnits(user)) {
    return (
      <Alert
        type="error"
        message="Not applicable"
        description="Units are scoped to a merchant workspace. Super Admin operates at the platform level."
        showIcon
      />
    )
  }

  const canManage = canManageUnits(user)

  void version
  const allUnits = scopedAllUnits(user, MOCK_PRODUCT_UNITS, MOCK_PRODUCTS)
  const query = search.trim().toLowerCase()
  const hasActiveFilter = !!query || availability !== 'all'
  const units = allUnits.filter(u => {
    const matchesSearch = !query
      || u.serialNumber.toLowerCase().includes(query)
      || !!u.imei1?.toLowerCase().includes(query)
      || !!u.imei2?.toLowerCase().includes(query)
    const matchesAvailability = availability === 'all' || u.availability === availability
    return matchesSearch && matchesAvailability
  })
  const productById = new Map(MOCK_PRODUCTS.map(p => [p.id, p]))
  const products = scopedProductList(user, MOCK_PRODUCTS)

  function refresh() {
    setVersion(v => v + 1)
  }

  function handleCreate(unit: ProductUnit) {
    MOCK_PRODUCT_UNITS.push(unit)
    setCreateOpen(false)
    refresh()
    message.success('Unit added')
  }

  function handleRemove(unit: ProductUnit) {
    const index = MOCK_PRODUCT_UNITS.findIndex(u => u.id === unit.id)
    if (index !== -1) MOCK_PRODUCT_UNITS.splice(index, 1)
    message.success('Unit removed')
    refresh()
  }

  // A row's actions — the desktop "…" menu and the mobile action sheet
  // (its "…", on every row with actions, at every size).
  function rowActions(u: ProductUnit): RowAction[] {
    const isSold = u.availability === 'sold'
    return [
      // A label can be (re)printed at any point in a unit's life —
      // including after it's sold, for a replacement sticker.
      ...(canPrintUnitCodes(user) ? [{ key: 'print', icon: <Printer size={16} strokeWidth={2.25} />, label: 'Print label', onClick: () => setPrintingUnit(u) }] : []),
      ...(canManage && !isSold ? [{ key: 'edit', icon: <Pencil size={16} strokeWidth={2.25} />, label: 'Edit', onClick: () => setEditingUnit(u) }] : []),
      ...(canManage && canMarkOpened(u, productById.get(u.productId)) ? [{ key: 'mark-opened', icon: <PackageOpen size={16} strokeWidth={2.25} />, label: 'Mark as Opened', onClick: () => setOpeningUnit(u) }] : []),
      ...(canManage && u.availability === 'available' ? [{
        key: 'remove',
        danger: true,
        icon: <Trash2 size={16} strokeWidth={2.25} />,
        label: 'Remove',
        onClick: () => modal.confirm({
          title: 'Remove this unit?',
          content: 'It will be removed from branch inventory.',
          okText: 'Remove',
          okButtonProps: { danger: true },
          onOk: () => handleRemove(u),
        }),
      }] : []),
    ]
  }

  function actionsMenu(u: ProductUnit) {
    const actions = rowActions(u)
    if (actions.length === 0) return null
    return (
      <div onClick={e => e.stopPropagation()}>
        <Dropdown trigger={['click']} placement="bottomRight" menu={rowActionMenu(actions)}>
          <Button type="text" size="small" icon={<MoreHorizontal size={16} strokeWidth={2.25} />} />
        </Dropdown>
      </div>
    )
  }

  function thumbnail(u: ProductUnit, size: number) {
    const photo = u.conditionPhotos?.[0] ?? productById.get(u.productId)?.photos?.[0]
    return (
      <Avatar
        shape="square"
        size={size}
        src={photo}
        icon={<ImageOff size={size === 28 ? 14 : 16} strokeWidth={2.25} />}
        style={{ backgroundColor: token.colorFillSecondary, color: iconColors.secondary, flexShrink: 0 }}
      />
    )
  }

  const columns: ColumnsType<ProductUnit> = [
    {
      title: <span style={{ color: token.colorText }}>Serial Number</span>,
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      fixed: 'left',
      render: (serialNumber: string, u) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {thumbnail(u, 28)}
            <a onClick={() => navigate(`/products/unit/${u.id}`)} style={{ color: token.colorText }}>
              {serialNumber}
            </a>
          </div>
        )
      },
    },
    {
      title: 'Product',
      key: 'product',
      render: (_, u) => {
        return <UnitProductName product={productById.get(u.productId)} color={token.colorTextTertiary} />
      },
    },
    { title: 'IMEI 1', key: 'imei1', render: (_, u) => u.imei1 ?? <span style={{ color: token.colorTextDisabled }}>—</span> },
    { title: 'IMEI 2', key: 'imei2', render: (_, u) => u.imei2 ?? <span style={{ color: token.colorTextDisabled }}>—</span> },
    { title: 'Branch', dataIndex: 'branch', key: 'branch' },
    { title: 'Grade', key: 'grade', render: (_, u) => u.grade ? GRADE_LABELS[u.grade] : <span style={{ color: token.colorTextDisabled }}>—</span> },
    { title: 'Battery', key: 'battery', align: 'right', render: (_, u) => u.batteryPercentage != null ? `${u.batteryPercentage}%` : <span style={{ color: token.colorTextDisabled }}>—</span> },
    { title: 'Tax', key: 'tax', render: (_, u) => TAX_LABELS[u.tax] },
    { title: 'Price', key: 'price', align: 'right', render: (_, u) => <UnitPrice unit={u} product={productById.get(u.productId)} /> },
    { title: 'Availability', key: 'availability', fixed: 'right', render: (_, u) => <UnitAvailabilityTag availability={u.availability} /> },
    {
      title: '',
      key: 'actions',
      width: 56,
      fixed: 'right',
      align: 'right',
      render: (_, u) => actionsMenu(u),
    },
  ]

  // Mobile: serial number and availability on top; the product (marked if
  // its SKU was removed) and price below. The whole row opens the unit —
  // desktop's serial-number link is too small a target on a phone.
  const mobileRows = mobileColumns<ProductUnit>(u => {
    const product = productById.get(u.productId)
    const price = u.customPrice ?? product?.salesPrice
    return (
      <MobileTableRow
        leading={thumbnail(u, 44)}
        primary={u.serialNumber}
        trailing={<UnitAvailabilityTag availability={u.availability} />}
        secondary={product ? `${fullSkuName(product)}${product.deletedAt ? ' · Removed' : ''}` : '—'}
        // Just the amount — desktop's "Sales price" note (the unit has no
        // custom price) doesn't fit beside the product name here.
        trailingSecondary={price != null ? priceFormatter.format(price) : undefined}
        onMore={rowActions(u).length ? () => actionSheet.open(u.serialNumber, rowActions(u)) : undefined}
      />
    )
  })

  return (
    <div className="ifix-fill-page">
      <ListToolbar
        search={<ListSearch value={search} onChange={setSearch} placeholder="Search by serial number or IMEI" mobilePlaceholder="Search units" />}
        filters={[{
          key: 'availability',
          label: 'Availability',
          control: <Select value={availability} onChange={setAvailability} options={AVAILABILITY_OPTIONS} style={{ width: 160 }} />,
        }]}
        activeFilterCount={availability !== 'all' ? 1 : 0}
        onClearFilters={() => setAvailability('all')}
        action={canManage ? { label: 'Add Unit', onClick: () => setCreateOpen(true) } : undefined}
      />
      <ConfigProvider theme={{
        components: {
          Table: {
            colorText: token.colorTextTertiary,
            headerColor: token.colorTextTertiary,
          },
        },
      }}>
        <div className="ifix-table-panel">
        <div style={{ padding: tablePanelPadding(isMobile) }}>
          <div className="ifix-panel-table" style={{ margin: '0 -16px' }}>
          <Table
            rowKey="id"
            columns={isMobile ? mobileRows : applyColumnPicker(withColumnMinWidths(columns, 'serialNumber'))}
            {...(isMobile ? MOBILE_TABLE_PROPS : {})}
            dataSource={units}
            scroll={isMobile ? { y: '100%' } : { x: 'max-content', y: '100%' }}
            onRow={isMobile ? record => ({ onClick: () => navigate(`/products/unit/${record.id}`), style: { cursor: 'pointer' } }) : undefined}
            locale={{
              emptyText: hasActiveFilter ? (
                <TableEmptyState icon={<Smartphone size={22} strokeWidth={2.25} />} title="No units found" description="Try a different serial number, IMEI, or status." />
              ) : (
                <TableEmptyState icon={<Smartphone size={22} strokeWidth={2.25} />} title="No units yet" description="Units you add will show up here." />
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
        </div>
      </ConfigProvider>

      <EditUnitModal
        open={!!editingUnit}
        actor={user}
        product={editingUnit ? productById.get(editingUnit.productId) ?? null : null}
        unit={editingUnit}
        onClose={() => setEditingUnit(null)}
        onUpdated={() => {
          setEditingUnit(null)
          refresh()
          message.success('Unit updated')
        }}
      />

      <CreateUnitModal
        open={createOpen}
        actor={user}
        product={null}
        products={products}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreate}
      />

      <MarkOpenedModal
        actor={user}
        unit={openingUnit}
        product={openingUnit ? productById.get(openingUnit.productId) ?? null : null}
        onClose={() => setOpeningUnit(null)}
        onMoved={opened => {
          setOpeningUnit(null)
          refresh()
          message.success(`Moved to ${fullSkuName(opened)}`)
        }}
      />

      {printingUnit && (
        <PrintUnitLabelModal
          open
          unit={printingUnit}
          product={productById.get(printingUnit.productId) ?? null}
          merchantId={user.merchantId}
          onClose={() => setPrintingUnit(null)}
        />
      )}
      {actionSheet.sheet}
    </div>
  )
}
