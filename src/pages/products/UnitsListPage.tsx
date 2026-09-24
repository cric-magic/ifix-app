import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Alert, ConfigProvider, Table, Button, Dropdown, Avatar, Input, theme } from 'antd'
import { Pencil, Trash2, Plus, ChevronLeft, ChevronRight, MoreHorizontal, ImageOff, Printer, Search, Smartphone } from 'lucide-react'
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
import { JUMP_PREV_ICON, JUMP_NEXT_ICON } from '../../constants/paginationIcons'
import { UnitPrice } from './components/UnitPrice'

type AvailabilityFilter = 'all' | UnitAvailability

const AVAILABILITY_OPTIONS: { value: AvailabilityFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'available', label: AVAILABILITY_LABELS.available },
  { value: 'reserved', label: AVAILABILITY_LABELS.reserved },
  { value: 'sold', label: AVAILABILITY_LABELS.sold },
]

export function UnitsListPage() {
  const user = useCurrentUser()
  const navigate = useNavigate()
  const { token } = theme.useToken()
  const iconColors = useIconColors()
  const { modal, message } = App.useApp()
  const [version, setVersion] = useState(0)
  const [editingUnit, setEditingUnit] = useState<ProductUnit | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [printingUnit, setPrintingUnit] = useState<ProductUnit | null>(null)
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

  const columns: ColumnsType<ProductUnit> = [
    {
      title: <span style={{ color: token.colorText }}>Serial Number</span>,
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      fixed: 'left',
      render: (serialNumber: string, u) => {
        const product = productById.get(u.productId)
        const photo = u.conditionPhotos?.[0] ?? product?.photos?.[0]
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar
              shape="square"
              size={28}
              src={photo}
              icon={<ImageOff size={14} strokeWidth={2.25} />}
              style={{ backgroundColor: token.colorFillSecondary, color: iconColors.secondary, flexShrink: 0 }}
            />
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
      render: (_, u) => {
        const isSold = u.availability === 'sold'
        const canPrint = canPrintUnitCodes(user)
        return (
          <Dropdown
            trigger={['click']}
            placement="bottomRight"
            menu={{
              items: [
                // A label can be (re)printed at any point in a unit's life —
                // including after it's sold, for a replacement sticker.
                ...(canPrint ? [{ key: 'print', icon: <Printer size={15} strokeWidth={2.25} />, label: 'Print label' }] : []),
                ...(canManage && !isSold ? [{ key: 'edit', icon: <Pencil size={15} strokeWidth={2.25} />, label: 'Edit' }] : []),
                ...(canManage && u.availability === 'available' ? [{ key: 'remove', danger: true, icon: <Trash2 size={15} strokeWidth={2.25} />, label: 'Remove' }] : []),
              ],
              onClick: ({ key }) => {
                if (key === 'print') setPrintingUnit(u)
                if (key === 'edit') setEditingUnit(u)
                if (key === 'remove') {
                  modal.confirm({
                    title: 'Remove this unit?',
                    content: 'It will be removed from branch inventory.',
                    okText: 'Remove',
                    okButtonProps: { danger: true },
                    onOk: () => handleRemove(u),
                  })
                }
              },
            }}
          >
            <Button type="text" size="small" icon={<MoreHorizontal size={15} strokeWidth={2.25} />} />
          </Dropdown>
        )
      },
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 8, overflowX: 'auto', overflowY: 'clip' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Input
            placeholder="Search by serial number or IMEI"
            prefix={<Search size={15} strokeWidth={2.25} color={iconColors.secondary} />}
            allowClear
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 320 }}
          />
          <Select
            value={availability}
            onChange={setAvailability}
            options={AVAILABILITY_OPTIONS}
            style={{ width: 160 }}
          />
        </div>
        {canManage && (
          <Button type="primary" icon={<Plus size={16} strokeWidth={2.25} />} onClick={() => setCreateOpen(true)}>
            Add Unit
          </Button>
        )}
      </div>
      <ConfigProvider theme={{
        components: {
          Table: {
            colorText: token.colorTextTertiary,
            headerColor: token.colorTextTertiary,
          },
        },
      }}>
        <div className="ifix-table-panel">
        <div style={{ padding: 16 }}>
          <div className="ifix-panel-table" style={{ margin: '0 -16px' }}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={units}
            scroll={{ x: 'max-content' }}
            locale={{
              emptyText: hasActiveFilter ? (
                <TableEmptyState icon={<Smartphone size={22} strokeWidth={2.25} />} title="No units found" description="Try a different serial number, IMEI, or status." />
              ) : (
                <TableEmptyState icon={<Smartphone size={22} strokeWidth={2.25} />} title="No units yet" description="Units you add will show up here." />
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
                <span style={{ color: token.colorTextTertiary }}>
                  {range[0]}–{range[1]} of {total}
                </span>
              ),
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

      {printingUnit && (
        <PrintUnitLabelModal
          open
          unit={printingUnit}
          product={productById.get(printingUnit.productId) ?? null}
          merchantId={user.merchantId}
          onClose={() => setPrintingUnit(null)}
        />
      )}
    </div>
  )
}
