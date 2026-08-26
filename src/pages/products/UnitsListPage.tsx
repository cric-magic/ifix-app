import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Alert, ConfigProvider, Table, Button, Dropdown, Avatar, Input, theme } from 'antd'
import { Pencil, Trash2, Plus, ChevronLeft, ChevronRight, MoreHorizontal, ImageOff, Search, Smartphone } from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'
import { useCurrentUser } from '../../contexts/AuthContext'
import { MOCK_PRODUCTS } from '../../constants/mockProducts'
import { MOCK_PRODUCT_UNITS } from '../../constants/mockProductUnits'
import { canManageUnits, scopedAllUnits, scopedProductList } from '../../constants/roles'
import { GRADE_LABELS, TAX_LABELS } from '../../constants/products'
import { useIconColors } from '../../constants/iconColors'
import type { ProductUnit } from '../../types/product'
import { UnitAvailabilityTag } from './components/UnitAvailabilityTag'
import { EditUnitModal } from './components/EditUnitModal'
import { CreateUnitModal } from './components/CreateUnitModal'
import { TableEmptyState } from '../../components/TableEmptyState'

const formatter = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 })

export function UnitsListPage() {
  const user = useCurrentUser()
  const navigate = useNavigate()
  const { token } = theme.useToken()
  const iconColors = useIconColors()
  const { modal, message } = App.useApp()
  const [version, setVersion] = useState(0)
  const [editingUnit, setEditingUnit] = useState<ProductUnit | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [search, setSearch] = useState('')

  if (!canManageUnits(user)) {
    return (
      <Alert
        type="error"
        message="Access Denied"
        description="The unit list is only accessible to Branch Manager and above."
        showIcon
      />
    )
  }

  void version
  const allUnits = scopedAllUnits(user, MOCK_PRODUCT_UNITS, MOCK_PRODUCTS)
  const query = search.trim().toLowerCase()
  const units = query
    ? allUnits.filter(u => u.imei.toLowerCase().includes(query) || u.serialNumber.toLowerCase().includes(query))
    : allUnits
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
      title: <span style={{ color: token.colorText }}>IMEI</span>,
      dataIndex: 'imei',
      key: 'imei',
      fixed: 'left',
      render: (imei: string, u) => {
        const product = productById.get(u.productId)
        const photo = u.unitPhotos?.front ?? product?.photos?.[0]
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar
              shape="square"
              size={28}
              src={photo}
              icon={<ImageOff size={14} strokeWidth={2.25} />}
              style={{ backgroundColor: token.colorFillSecondary, color: iconColors.secondary, flexShrink: 0 }}
            />
            <a onClick={() => navigate(`/products/unit/${u.id}`)} style={{ color: token.colorText }}>
              {imei}
            </a>
          </div>
        )
      },
    },
    {
      title: 'Product',
      key: 'product',
      render: (_, u) => {
        const product = productById.get(u.productId)
        return (
          <a onClick={() => navigate(`/products/catalog/${u.productId}`)} style={{ color: token.colorTextTertiary }}>
            {product?.name ?? '—'}
          </a>
        )
      },
    },
    { title: 'Serial Number', dataIndex: 'serialNumber', key: 'serialNumber' },
    { title: 'Branch', dataIndex: 'branch', key: 'branch' },
    { title: 'Grade', key: 'grade', render: (_, u) => u.grade ? GRADE_LABELS[u.grade] : <span style={{ color: token.colorTextDisabled }}>—</span> },
    { title: 'Tax', key: 'tax', render: (_, u) => TAX_LABELS[u.tax] },
    { title: 'Price', key: 'customPrice', align: 'right', render: (_, u) => u.customPrice ? formatter.format(u.customPrice) : <span style={{ color: token.colorTextDisabled }}>—</span> },
    { title: 'Availability', key: 'availability', fixed: 'right', render: (_, u) => <UnitAvailabilityTag availability={u.availability} /> },
    {
      title: '',
      key: 'actions',
      width: 56,
      fixed: 'right',
      align: 'right',
      render: (_, u) => {
        const isSold = u.availability === 'sold'
        return (
          <Dropdown
            trigger={['click']}
            placement="bottomRight"
            menu={{
              items: [
                ...(isSold ? [] : [{ key: 'edit', icon: <Pencil size={15} strokeWidth={2.25} />, label: 'Edit' }]),
                ...(u.availability === 'available' ? [{ key: 'remove', danger: true, icon: <Trash2 size={15} strokeWidth={2.25} />, label: 'Remove' }] : []),
              ],
              onClick: ({ key }) => {
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
        <Input
          placeholder="Search by IMEI or serial number"
          prefix={<Search size={15} strokeWidth={2.25} color={iconColors.secondary} />}
          allowClear
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <Button type="primary" icon={<Plus size={16} strokeWidth={2.25} />} onClick={() => setCreateOpen(true)}>
          Add Unit
        </Button>
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
              emptyText: query ? (
                <TableEmptyState icon={<Smartphone size={22} strokeWidth={2.25} />} title="No units found" description="Try a different IMEI or serial number." />
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
    </div>
  )
}
