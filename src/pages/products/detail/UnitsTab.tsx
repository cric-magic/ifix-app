import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, ConfigProvider, Dropdown, Table, Typography, theme } from 'antd'
import { Plus, Pencil, Printer, Trash2, MoreHorizontal, Smartphone } from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'
import type { AuthUser } from '../../../types/installment'
import type { Product, ProductUnit } from '../../../types/product'
import { GRADE_LABELS, TAX_LABELS } from '../../../constants/products'
import { canManageUnits, canPrintUnitCodes, scopedUnitList } from '../../../constants/roles'
import { MOCK_PRODUCT_UNITS } from '../../../constants/mockProductUnits'
import { UnitAvailabilityTag } from '../components/UnitAvailabilityTag'
import { CreateUnitModal } from '../components/CreateUnitModal'
import { EditUnitModal } from '../components/EditUnitModal'
import { PrintUnitLabelModal } from '../components/PrintUnitLabelModal'
import { TableEmptyState } from '../../../components/TableEmptyState'
import { UnitPrice } from '../components/UnitPrice'

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
  const [printingUnit, setPrintingUnit] = useState<ProductUnit | null>(null)

  void version
  const units = scopedUnitList(actor, product.id, MOCK_PRODUCT_UNITS)
  // Staff read this tab to find a unit and print its label; the write
  // actions below are theirs to see only if canManageUnits says so.
  const canManage = canManageUnits(actor)
  const canPrint = canPrintUnitCodes(actor)

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
      title: <span style={{ color: token.colorText }}>Serial Number</span>,
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      fixed: 'left',
      render: (v: string, u) => (
        <a onClick={() => navigate(`/products/unit/${u.id}`)} style={{ color: token.colorText }}>
          {v}
        </a>
      ),
    },
    { title: 'IMEI 1', key: 'imei1', render: (_, u) => u.imei1 ?? <span style={{ color: token.colorTextDisabled }}>—</span> },
    { title: 'IMEI 2', key: 'imei2', render: (_, u) => u.imei2 ?? <span style={{ color: token.colorTextDisabled }}>—</span> },
    { title: 'Branch', dataIndex: 'branch', key: 'branch' },
    { title: 'Grade', key: 'grade', render: (_, u) => u.grade ? GRADE_LABELS[u.grade] : <span style={{ color: token.colorTextDisabled }}>—</span> },
    { title: 'Battery', key: 'battery', align: 'right', render: (_, u) => u.batteryPercentage != null ? `${u.batteryPercentage}%` : <span style={{ color: token.colorTextDisabled }}>—</span> },
    { title: 'Tax', key: 'tax', render: (_, u) => TAX_LABELS[u.tax] },
    { title: 'Price', key: 'price', align: 'right', render: (_, u) => <UnitPrice unit={u} product={product} /> },
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
          {/* paddingRight: 2 on top of the header row's own 8px — matches
              the button's own top/bottom centering gap (10px, the derived
              (56 - 36) / 2 remainder from centering a 36px-tall button in
              this 56px-tall row), so the button sits equidistant from all
              three edges instead of closer to the right one. */}
          {canManage && (
            <div style={{ paddingRight: 2 }}>
              <Button icon={<Plus size={16} strokeWidth={2.25} />} onClick={() => setCreateOpen(true)}>
                Add Unit
              </Button>
            </div>
          )}
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

      {printingUnit && (
        <PrintUnitLabelModal
          open
          unit={printingUnit}
          product={product}
          merchantId={actor.merchantId}
          onClose={() => setPrintingUnit(null)}
        />
      )}
    </div>
  )
}
