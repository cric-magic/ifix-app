import { App, ConfigProvider, Table, Button, Dropdown, Avatar, theme } from 'antd'
import { useNavigate } from 'react-router-dom'
import { Pencil, Trash2, Boxes, ChevronLeft, ChevronRight, ChevronDown, MoreHorizontal, ImageOff, Package } from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'
import type { AuthUser } from '../../../types/installment'
import type { Product } from '../../../types/product'
import { canManageProducts, canManageUnits, canViewCostPrice, scopedUnitList } from '../../../constants/roles'
import { CATEGORY_LABELS, TYPE_LABELS } from '../../../constants/products'
import { MOCK_PRODUCT_UNITS } from '../../../constants/mockProductUnits'
import { MOCK_CONTRACTS } from '../../../constants/mockContracts'
import { useIconColors } from '../../../constants/iconColors'
import { TableEmptyState } from '../../../components/TableEmptyState'
import { countAvailableUnits } from '../../../utils/product'
import { ProductStatusTag } from './ProductStatusTag'
import { JUMP_PREV_ICON, JUMP_NEXT_ICON } from '../../../constants/paginationIcons'

const formatter = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 })

interface Props {
  actor: AuthUser
  products: Product[]
  isSearching: boolean
  onEdit: (product: Product) => void
  onRemove: (product: Product) => void
  onAddUnit: (product: Product) => void
}

export function ProductTable({ actor, products, isSearching, onEdit, onRemove, onAddUnit }: Props) {
  const { token } = theme.useToken()
  const dash = <span style={{ color: token.colorTextDisabled }}>—</span>
  const iconColors = useIconColors()
  const { modal } = App.useApp()
  const navigate = useNavigate()
  const showCostPrice = canViewCostPrice(actor)
  const canManage = canManageProducts(actor)
  const canAddUnit = canManageUnits(actor)

  // Removing a SKU is a soft delete: its units stay in the Units list,
  // marked Removed. But a Reserved unit is committed to a live contract, so
  // the SKU can't be removed until that contract is done with it — the
  // warning names the contract(s) so it's clear what's in the way.
  function confirmRemove(p: Product) {
    const units = MOCK_PRODUCT_UNITS.filter(u => u.productId === p.id)
    const reservedIds = new Set(units.filter(u => u.availability === 'reserved').map(u => u.id))
    if (reservedIds.size > 0) {
      const holding = MOCK_CONTRACTS
        .filter(c => reservedIds.has(c.device.unitId))
        .map(c => c.contractNumber)
      modal.warning({
        title: "Can't remove this product",
        content: `${reservedIds.size === 1 ? 'A unit is' : `${reservedIds.size} units are`} reserved for ${holding.length === 1 ? 'contract' : 'contracts'} ${holding.join(', ')}. Remove it once ${holding.length === 1 ? 'that contract' : 'those contracts'} no longer ${holding.length === 1 ? 'holds' : 'hold'} the unit.`,
        okText: 'OK',
      })
      return
    }
    modal.confirm({
      title: 'Remove this product?',
      content: units.length > 0
        ? `It will no longer appear in the catalog. Its ${units.length} ${units.length === 1 ? 'unit stays' : 'units stay'} in the Units list, marked Removed.`
        : 'It will no longer appear in the catalog.',
      okText: 'Remove',
      okButtonProps: { danger: true },
      onOk: () => onRemove(p),
    })
  }

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar
            shape="square"
            size={28}
            src={p.photos?.[0]}
            icon={<ImageOff size={14} strokeWidth={2.25} />}
            style={{ backgroundColor: token.colorFillSecondary, color: iconColors.secondary, flexShrink: 0 }}
          />
          <span style={{ color: token.colorText }}>{name}</span>
        </div>
      ),
    },
    { title: 'SKU Code', dataIndex: 'sku', key: 'sku' },
    { title: 'Brand', dataIndex: 'brand', key: 'brand' },
    { title: 'Category', key: 'category', render: (_, p) => CATEGORY_LABELS[p.category] },
    { title: 'Model', dataIndex: 'model', key: 'model' },
    { title: 'Model Number', dataIndex: 'modelNumber', key: 'modelNumber' },
    { title: 'Storage', key: 'storage', render: (_, p) => p.storage ?? dash },
    { title: 'RAM', key: 'ram', render: (_, p) => p.ram ?? dash },
    { title: 'Color', dataIndex: 'color', key: 'color' },
    { title: 'Connection', key: 'connection', render: (_, p) => p.connection ?? dash },
    {
      // Available Units, not total — counted from the caller's already
      // branch-scoped unit list, so a Branch Manager sees their own branch's
      // sellable stock rather than the merchant-wide figure.
      title: 'Available Units',
      key: 'availableUnits',
      align: 'right',
      render: (_, p) => countAvailableUnits(scopedUnitList(actor, p.id, MOCK_PRODUCT_UNITS)),
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
                if (key === 'remove') confirmRemove(p)
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
              locale={{
                emptyText: isSearching ? (
                  <TableEmptyState icon={<Package size={22} strokeWidth={2.25} />} title="No products found" description="Try a different name, brand, or SKU." />
                ) : (
                  <TableEmptyState icon={<Package size={22} strokeWidth={2.25} />} title="No products yet" description="Products you add will show up here." />
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
      </ConfigProvider>
    </div>
  )
}
