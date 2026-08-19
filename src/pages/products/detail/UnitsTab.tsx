import { useState } from 'react'
import { App, Avatar, Button, ConfigProvider, Dropdown, Table, Typography, theme } from 'antd'
import { Plus, Minus, Pencil, Trash2, MoreHorizontal, ImageOff } from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'
import type { AuthUser } from '../../../types/installment'
import type { Product, ProductUnit } from '../../../types/product'
import { GRADE_LABELS, TAX_LABELS } from '../../../constants/products'
import { scopedUnitList } from '../../../constants/roles'
import { MOCK_PRODUCT_UNITS } from '../../../constants/mockProductUnits'
import { MOCK_USER_ACCOUNTS } from '../../../constants/mockUsers'
import { ICON_COLOR_SECONDARY } from '../../../constants/iconColors'
import { UnitAvailabilityTag } from '../components/UnitAvailabilityTag'
import { CreateUnitModal } from '../components/CreateUnitModal'
import { EditUnitModal } from '../components/EditUnitModal'

const formatter = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 })
const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' })

interface Props {
  actor: AuthUser
  product: Product
}

export function UnitsTab({ actor, product }: Props) {
  const { token } = theme.useToken()
  const { modal, message } = App.useApp()
  const [version, setVersion] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<ProductUnit | null>(null)

  void version
  const units = scopedUnitList(actor, product.id, MOCK_PRODUCT_UNITS)
  const userById = new Map(MOCK_USER_ACCOUNTS.map(a => [a.id, a]))

  function refresh() {
    setVersion(v => v + 1)
  }

  function handleRemove(unit: ProductUnit) {
    const index = MOCK_PRODUCT_UNITS.findIndex(u => u.id === unit.id)
    if (index !== -1) MOCK_PRODUCT_UNITS.splice(index, 1)
    message.success('Unit removed')
    refresh()
  }

  const columns: ColumnsType<ProductUnit> = [
    { title: <span style={{ color: token.colorText }}>IMEI</span>, dataIndex: 'imei', key: 'imei', fixed: 'left', render: (v: string) => <span style={{ color: token.colorText }}>{v}</span> },
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
      <ConfigProvider theme={{
        components: {
          Table: {
            colorText: token.colorTextTertiary,
            headerColor: token.colorTextTertiary,
          },
        },
      }}>
      <div className="ifix-table-panel">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 56,
          padding: '0 16px',
          borderBottom: `0.5px solid ${token.colorBorderSecondary}`,
        }}>
          <Typography.Text strong style={{ fontSize: 15 }}>
            {units.length} Unit{units.length === 1 ? '' : 's'}
          </Typography.Text>
          <Button type="primary" icon={<Plus size={16} strokeWidth={2.25} />} onClick={() => setCreateOpen(true)}>
            Add Unit
          </Button>
        </div>

        <div style={{ padding: 16 }}>
          <div className="ifix-panel-table" style={{ margin: '0 -16px' }}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={units}
            size="small"
            pagination={false}
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
                  <div className="ifix-table-panel" style={{ padding: '16px 0' }}>
                    <Table rowKey="id" columns={detailColumns} dataSource={[u]} pagination={false} size="small" />
                  </div>
                )
              },
            }}
          />
          </div>
        </div>
      </div>
      </ConfigProvider>

      <CreateUnitModal
        open={createOpen}
        actor={actor}
        product={product}
        onClose={() => setCreateOpen(false)}
        onCreated={unit => {
          setCreateOpen(false)
          MOCK_PRODUCT_UNITS.push(unit)
          refresh()
          message.success('Unit added')
        }}
      />

      <EditUnitModal
        open={!!editingUnit}
        actor={actor}
        product={product}
        unit={editingUnit}
        onClose={() => setEditingUnit(null)}
        onUpdated={() => {
          setEditingUnit(null)
          refresh()
          message.success('Unit updated')
        }}
      />
    </div>
  )
}
