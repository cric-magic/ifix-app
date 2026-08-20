import { App, ConfigProvider, Table, Button, Dropdown, Avatar, theme } from 'antd'
import { useNavigate } from 'react-router-dom'
import { Pencil, Trash2, Boxes, ChevronLeft, ChevronRight, ChevronDown, MoreHorizontal, ImageOff } from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'
import type { AuthUser } from '../../../types/installment'
import type { Product } from '../../../types/product'
import { canManageProducts, canManageUnits, canViewCostPrice, scopedUnitList } from '../../../constants/roles'
import { CATEGORY_LABELS, TYPE_LABELS } from '../../../constants/products'
import { MOCK_PRODUCT_UNITS } from '../../../constants/mockProductUnits'
import { useIconColors } from '../../../constants/iconColors'
import { ProductStatusTag } from './ProductStatusTag'

const formatter = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 })

interface Props {
  actor: AuthUser
  products: Product[]
  onEdit: (product: Product) => void
  onRemove: (product: Product) => void
  onAddUnit: (product: Product) => void
}

export function ProductTable({ actor, products, onEdit, onRemove, onAddUnit }: Props) {
  const { token } = theme.useToken()
  const iconColors = useIconColors()
  const { modal } = App.useApp()
  const navigate = useNavigate()
  const showCostPrice = canViewCostPrice(actor)
  const canManage = canManageProducts(actor)
  const canAddUnit = canManageUnits(actor)

  const columns: ColumnsType<Product> = [
    {
      title: <span style={{ color: token.colorText }}>Name</span>,
      dataIndex: 'name',
      fixed: 'left',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      showSorterTooltip: false,
      sortIcon: ({ sortOrder }) => (
        <ChevronDown
          size={13}
          strokeWidth={2.25}
          style={{
            transform: sortOrder === 'ascend' ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            color: sortOrder ? token.colorText : token.colorTextQuaternary,
          }}
        />
      ),
      render: (name: string, p: Product) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar
            shape="square"
            size={32}
            src={p.photos?.[0]}
            icon={<ImageOff size={14} strokeWidth={2.25} />}
            style={{ backgroundColor: token.colorFillSecondary, color: iconColors.secondary, flexShrink: 0 }}
          />
          <span style={{ color: token.colorText }}>{name}</span>
        </div>
      ),
    },
    { title: 'Brand', dataIndex: 'brand', key: 'brand' },
    { title: 'Category', key: 'category', render: (_, p) => CATEGORY_LABELS[p.category] },
    { title: 'Model', dataIndex: 'model', key: 'model' },
    { title: 'SKU', dataIndex: 'sku', key: 'sku' },
    {
      title: 'Units',
      key: 'units',
      align: 'right',
      render: (_, p) => scopedUnitList(actor, p.id, MOCK_PRODUCT_UNITS).length,
    },
    ...(showCostPrice ? [{
      title: 'Cost Price',
      key: 'costPrice',
      align: 'right' as const,
      render: (_: unknown, p: Product) => formatter.format(p.costPrice),
    }] : []),
    {
      title: 'Sales Price',
      key: 'salesPrice',
      align: 'right',
      render: (_, p) => formatter.format(p.salesPrice),
    },
    { title: 'Type', key: 'type', render: (_, p) => TYPE_LABELS[p.type] },
    { title: 'Status', key: 'status', fixed: 'right', render: (_, p) => <ProductStatusTag status={p.status} /> },
    ...(canManage ? [{
      title: '',
      key: 'actions',
      width: 56,
      fixed: 'right' as const,
      align: 'right' as const,
      render: (_: unknown, p: Product) => (
        <div onClick={e => e.stopPropagation()}>
          <Dropdown
            trigger={['click']}
            placement="bottomRight"
            menu={{
              items: [
                { key: 'edit', icon: <Pencil size={15} strokeWidth={2.25} />, label: 'Edit' },
                ...(canAddUnit ? [{ key: 'add-unit', icon: <Boxes size={15} strokeWidth={2.25} />, label: 'Add Unit' }] : []),
                { type: 'divider' as const },
                { key: 'remove', danger: true, icon: <Trash2 size={15} strokeWidth={2.25} />, label: 'Remove' },
              ],
              onClick: ({ key }) => {
                if (key === 'edit') onEdit(p)
                if (key === 'add-unit') onAddUnit(p)
                if (key === 'remove') {
                  modal.confirm({
                    title: 'Remove this product?',
                    content: 'It will no longer appear in the catalog.',
                    okText: 'Remove',
                    okButtonProps: { danger: true },
                    onOk: () => onRemove(p),
                  })
                }
              },
            }}
          >
            <Button type="text" size="small" icon={<MoreHorizontal size={15} strokeWidth={2.25} />} />
          </Dropdown>
        </div>
      ),
    }] : []),
  ]

  return (
    <div className="ifix-table-panel">
      <ConfigProvider theme={{
        components: {
          Table: {
            colorText: token.colorTextTertiary,
            headerColor: token.colorTextTertiary,
          },
        },
      }}>
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
      </ConfigProvider>
    </div>
  )
}
