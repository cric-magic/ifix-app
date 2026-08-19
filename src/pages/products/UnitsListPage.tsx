import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Alert, ConfigProvider, Table, Button, Dropdown, Avatar, theme } from 'antd'
import { Pencil, Trash2, Plus, Minus, ChevronLeft, ChevronRight, MoreHorizontal, ImageOff } from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'
import { useCurrentUser } from '../../contexts/AuthContext'
import { MOCK_PRODUCTS } from '../../constants/mockProducts'
import { MOCK_PRODUCT_UNITS } from '../../constants/mockProductUnits'
import { MOCK_USER_ACCOUNTS } from '../../constants/mockUsers'
import { canManageUnits, scopedAllUnits, scopedProductList } from '../../constants/roles'
import { GRADE_LABELS, TAX_LABELS } from '../../constants/products'
import { ICON_COLOR_SECONDARY } from '../../constants/iconColors'
import type { ProductUnit } from '../../types/product'
import { UnitAvailabilityTag } from './components/UnitAvailabilityTag'
import { EditUnitModal } from './components/EditUnitModal'
import { CreateUnitModal } from './components/CreateUnitModal'

const formatter = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 })
const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' })

export function UnitsListPage() {
  const user = useCurrentUser()
  const navigate = useNavigate()
  const { token } = theme.useToken()
  const { modal, message } = App.useApp()
  const [version, setVersion] = useState(0)
  const [editingUnit, setEditingUnit] = useState<ProductUnit | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

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
  const units = scopedAllUnits(user, MOCK_PRODUCT_UNITS, MOCK_PRODUCTS)
  const productById = new Map(MOCK_PRODUCTS.map(p => [p.id, p]))
  const products = scopedProductList(user, MOCK_PRODUCTS)
  const userById = new Map(MOCK_USER_ACCOUNTS.map(a => [a.id, a]))

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
      title: <span style={{ color: token.colorText }}>Product</span>,
      key: 'product',
      fixed: 'left',
      render: (_, u) => {
        const product = productById.get(u.productId)
        const photo = u.conditionPhotos?.[0] ?? product?.photos?.[0]
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar
              shape="square"
              size={32}
              src={photo}
              icon={<ImageOff size={14} strokeWidth={2.25} />}
              style={{ backgroundColor: token.colorFillSecondary, color: ICON_COLOR_SECONDARY, flexShrink: 0 }}
            />
            <a onClick={() => navigate(`/products/catalog/${u.productId}`)} style={{ color: token.colorText }}>
              {product?.name ?? '—'}
            </a>
          </div>
        )
      },
    },
    { title: 'IMEI', dataIndex: 'imei', key: 'imei' },
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
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
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
            expandable={{
              columnWidth: 36,
              expandIcon: ({ expanded, onExpand, record }) => (
                <Button
                  type="text"
                  size="small"
                  onClick={e => onExpand(record, e)}
                  icon={expanded ? <Minus size={15} strokeWidth={2.25} /> : <Plus size={15} strokeWidth={2.25} />}
                />
              ),
              expandedRowRender: u => {
                const soldByUser = u.soldAt ? userById.get(u.soldBy ?? '') : undefined
                const detailColumns: ColumnsType<ProductUnit> = [
                  {
                    title: <span style={{ color: token.colorText }}>Sold by</span>,
                    key: 'soldBy',
                    render: () => u.soldAt ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar
                          shape="square"
                          size={32}
                          icon={<ImageOff size={14} strokeWidth={2.25} />}
                          style={{ backgroundColor: token.colorFillSecondary, color: ICON_COLOR_SECONDARY, flexShrink: 0 }}
                        />
                        <span style={{ color: token.colorText }}>{soldByUser?.name ?? 'Unknown'}</span>
                      </div>
                    ) : <span style={{ color: token.colorTextDisabled }}>—</span>,
                  },
                  {
                    title: 'Sold',
                    key: 'sold',
                    render: () => u.soldAt ? dateFormatter.format(new Date(u.soldAt)) : <span style={{ color: token.colorTextDisabled }}>—</span>,
                  },
                  {
                    title: 'Added',
                    key: 'added',
                    render: () => dateFormatter.format(new Date(u.createdAt)),
                  },
                  ...(u.notes ? [{ title: 'Notes', key: 'notes', render: () => u.notes }] : []),
                ]
                return (
                  <div className="ifix-table-panel ifix-nested-table-indent" style={{ padding: '16px 0' }}>
                    <Table rowKey="id" columns={detailColumns} dataSource={[u]} pagination={false} size="small" />
                  </div>
                )
              },
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
