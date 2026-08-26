import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, ConfigProvider, Dropdown, Table, Typography, theme } from 'antd'
import { Plus, Pencil, Trash2, MoreHorizontal, Smartphone } from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'
import type { AuthUser } from '../../../types/installment'
import type { Product, ProductUnit } from '../../../types/product'
import { GRADE_LABELS, TAX_LABELS } from '../../../constants/products'
import { scopedUnitList } from '../../../constants/roles'
import { MOCK_PRODUCT_UNITS } from '../../../constants/mockProductUnits'
import { UnitAvailabilityTag } from '../components/UnitAvailabilityTag'
import { CreateUnitModal } from '../components/CreateUnitModal'
import { EditUnitModal } from '../components/EditUnitModal'
import { TableEmptyState } from '../../../components/TableEmptyState'

const formatter = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 })

interface Props {
  actor: AuthUser
  product: Product
}

export function UnitsTab({ actor, product }: Props) {
  const { token } = theme.useToken()
  const navigate = useNavigate()
  const { modal, message } = App.useApp()
  const [version, setVersion] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<ProductUnit | null>(null)

  void version
  const units = scopedUnitList(actor, product.id, MOCK_PRODUCT_UNITS)

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
    {
      title: <span style={{ color: token.colorText }}>IMEI</span>,
      dataIndex: 'imei',
      key: 'imei',
      fixed: 'left',
      render: (v: string, u) => (
        <a onClick={() => navigate(`/products/unit/${u.id}`)} style={{ color: token.colorText }}>
          {v}
        </a>
      ),
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
          paddingLeft: 16,
          paddingRight: 8,
          boxShadow: `inset 0 -0.5px 0 0 ${token.colorBorderSecondary}`,
        }}>
          <Typography.Text strong style={{ fontSize: 15 }}>
            {units.length} Unit{units.length === 1 ? '' : 's'}
          </Typography.Text>
          <Button icon={<Plus size={16} strokeWidth={2.25} />} onClick={() => setCreateOpen(true)}>
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
            locale={{
              emptyText: <TableEmptyState icon={<Smartphone size={22} strokeWidth={2.25} />} title="No units yet" description="Units added to this product will show up here." />,
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
