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
import { JUMP_PREV_ICON, JUMP_NEXT_ICON, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, PAGE_SIZE_CHANGER, MOBILE_PAGINATION } from '../../../constants/paginationIcons'
import { useIsMobile } from '../../../components/useIsMobile'
import { MobileTableRow } from '../../../components/MobileTableRow'
import { MOBILE_TABLE_PROPS, mobileColumns, tablePanelPadding } from '../../../components/mobileTable'
import { useColumnPicker } from '../../../components/useColumnPicker'
import { withColumnMinWidths } from '../../../components/tableColumns'
import { useActionSheet } from '../../../components/useActionSheet'
import { rowActionMenu, type RowAction } from '../../../components/rowActions'

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
  const applyColumnPicker = useColumnPicker('products', ['name', 'status'])
  const { token } = theme.useToken()
  const actionSheet = useActionSheet()
  const isMobile = useIsMobile()
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

  // A row's actions — the desktop "…" menu and the mobile action sheet
  // (its "…", on every row with actions, at every size).
  function rowActions(p: Product): RowAction[] {
    if (!canManage) return []
    return [
      { key: 'edit', icon: <Pencil size={16} strokeWidth={2.25} />, label: 'Edit', onClick: () => onEdit(p) },
      ...(canAddUnit ? [{ key: 'add-unit', icon: <Boxes size={16} strokeWidth={2.25} />, label: 'Add Unit', onClick: () => onAddUnit(p) }] : []),
      { key: 'remove', danger: true, icon: <Trash2 size={16} strokeWidth={2.25} />, label: 'Remove', onClick: () => confirmRemove(p) },
    ]
  }

  function actionsMenu(p: Product) {
    const actions = rowActions(p)
    if (actions.length === 0) return null
    return (
      <div onClick={e => e.stopPropagation()}>
        <Dropdown trigger={['click']} placement="bottomRight" menu={rowActionMenu(actions)}>
          <Button type="text" size="small" icon={<MoreHorizontal size={16} strokeWidth={2.25} />} />
        </Dropdown>
      </div>
    )
  }

  const thumbnail = (p: Product, size: number) => (
    <Avatar
      shape="square"
      size={size}
      src={p.photos?.[0]}
      icon={<ImageOff size={size === 28 ? 14 : 16} strokeWidth={2.25} />}
      style={{ backgroundColor: token.colorFillSecondary, color: iconColors.secondary, flexShrink: 0 }}
    />
  )

  const allColumns: ColumnsType<Product> = [
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
          {thumbnail(p, 28)}
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
    {
      // Available Units, not total — counted from the caller's already
      // branch-scoped unit list, so a Branch Manager sees their own branch's
      // sellable stock rather than the merchant-wide figure.
      title: 'Available Units',
      key: 'availableUnits',
      align: 'right',
      render: (_, p) => countAvailableUnits(scopedUnitList(actor, p.id, MOCK_PRODUCT_UNITS)),
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
        <div onClick={e => e.stopPropagation()}>{actionsMenu(p)}</div>
      ),
    }] : []),
  ]
  const columns = isMobile
    // Mobile: name and status on top; type (New/Used — what clients look
    // for first) and SKU below, with the sales price.
    ? mobileColumns<Product>(p => (
        <MobileTableRow
          leading={thumbnail(p, 44)}
          primary={p.name}
          trailing={<ProductStatusTag status={p.status} />}
          secondary={`${TYPE_LABELS[p.type]} · ${p.sku}`}
          trailingSecondary={formatter.format(p.salesPrice)}
          onMore={rowActions(p).length ? () => actionSheet.open(p.name, rowActions(p)) : undefined}
        />
      ))
    : applyColumnPicker(withColumnMinWidths(allColumns))

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
        <div style={{ padding: tablePanelPadding(isMobile) }}>
          <div className="ifix-panel-table" style={{ margin: '0 -16px' }}>
            <Table
              rowKey="id"
              columns={columns}
              {...(isMobile ? MOBILE_TABLE_PROPS : {})}
              dataSource={products}
              scroll={isMobile ? { y: '100%' } : { x: 'max-content', y: '100%' }}
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
        {actionSheet.sheet}
      </ConfigProvider>
    </div>
  )
}
