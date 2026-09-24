import { useState } from 'react'
import { App, Button, ConfigProvider, Drawer, Dropdown, Form, Input, Space, Table, theme } from 'antd'
import { Plus, MoreHorizontal, Ban, RotateCcw, Shapes, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'
import { attributeValues, type AttributeTypeMeta, type AttributeValueRow } from '../../../constants/products'
import { MOCK_PRODUCT_ATTRIBUTES } from '../../../constants/mockProductAttributes'
import { MOCK_PRODUCTS } from '../../../constants/mockProducts'
import { countProductsUsingAttribute } from '../../../utils/product'
import { useIconColors } from '../../../constants/iconColors'
import { DotTag } from '../../../components/DotTag'
import { TableEmptyState } from '../../../components/TableEmptyState'
import { useAppWindowContainer } from '../../../contexts/AppWindowContext'
import { JUMP_PREV_ICON, JUMP_NEXT_ICON, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, PAGE_SIZE_CHANGER } from '../../../constants/paginationIcons'

interface Props {
  meta: AttributeTypeMeta
}

// One attribute type's values, rendered inside its tab. Searchable and
// paginated, which is what lets the tabs above stay simple: however long a
// single list grows, it's this table's problem rather than the navigation's.
export function AttributeValuesTab({ meta }: Props) {
  const { token } = theme.useToken()
  const iconColors = useIconColors()
  const { modal, message } = App.useApp()
  const [version, setVersion] = useState(0)
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [form] = Form.useForm<{ value: string }>()
  const appWindow = useAppWindowContainer()
  void version // re-render after mutating the mock records in place

  function refresh() {
    setVersion(v => v + 1)
  }

  function handleAdd(values: { value: string }) {
    MOCK_PRODUCT_ATTRIBUTES.push({
      id: `attr-${meta.key}-${Date.now()}`,
      type: meta.key as 'color' | 'storage',
      value: values.value.trim(),
      enabled: true,
      createdAt: new Date().toISOString(),
    })
    form.resetFields()
    setAddOpen(false)
    refresh()
    message.success(`${values.value.trim()} added`)
  }

  function handleToggle(row: AttributeValueRow) {
    const record = MOCK_PRODUCT_ATTRIBUTES.find(a => a.id === row.id)
    if (!record) return
    const inUse = countProductsUsingAttribute(meta.field, row.value, MOCK_PRODUCTS)
    if (record.enabled) {
      modal.confirm({
        title: `Disable ${row.value}?`,
        content: inUse > 0
          ? `It won't be offered for new products. The ${inUse} product${inUse === 1 ? '' : 's'} already using it keep${inUse === 1 ? 's' : ''} the value unchanged.`
          : "It won't be offered when creating or editing a product.",
        okText: 'Disable',
        okButtonProps: { danger: true },
        onOk: () => {
          record.enabled = false
          refresh()
          message.success(`${row.value} disabled`)
        },
      })
      return
    }
    record.enabled = true
    refresh()
    message.success(`${row.value} enabled`)
  }

  const query = search.trim().toLowerCase()
  const rows = attributeValues(meta).filter(r => !query || r.value.toLowerCase().includes(query))

  const columns: ColumnsType<AttributeValueRow> = [
    {
      title: <span style={{ color: token.colorText }}>Value</span>,
      dataIndex: 'value',
      key: 'value',
      render: (value: string) => <span style={{ color: token.colorText }}>{value}</span>,
    },
    {
      title: 'In use',
      key: 'inUse',
      align: 'right',
      render: (_, r) => {
        const count = countProductsUsingAttribute(meta.field, r.value, MOCK_PRODUCTS)
        return count > 0 ? count : <span style={{ color: token.colorTextDisabled }}>—</span>
      },
    },
    // Status and row actions only mean something for a managed type — a
    // fixed list has nothing to enable, disable or add to.
    ...(meta.managed ? [
      {
        title: 'Status',
        key: 'status',
        render: (_: unknown, r: AttributeValueRow) => (
          <DotTag dotColor={r.enabled ? token.colorSuccess : token.colorTextTertiary}>
            {r.enabled ? 'Enabled' : 'Disabled'}
          </DotTag>
        ),
      },
      {
        title: '',
        key: 'actions',
        width: 56,
        align: 'right' as const,
        render: (_: unknown, r: AttributeValueRow) => (
          <Dropdown
            trigger={['click']}
            placement="bottomRight"
            menu={{
              items: [{
                key: 'toggle',
                danger: r.enabled,
                icon: r.enabled
                  ? <Ban size={16} strokeWidth={2.25} />
                  : <RotateCcw size={16} strokeWidth={2.25} />,
                label: r.enabled ? 'Disable' : 'Enable',
              }],
              onClick: () => handleToggle(r),
            }}
          >
            <Button type="text" size="small" icon={<MoreHorizontal size={16} strokeWidth={2.25} />} />
          </Dropdown>
        ),
      },
    ] : []),
  ]

  return (
    <div className="ifix-fill-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 8 }}>
        <Input
          placeholder={`Search ${meta.noun} values`}
          prefix={<Search size={16} strokeWidth={2.25} color={iconColors.secondary} />}
          allowClear
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        {meta.managed && (
          <Button type="primary" icon={<Plus size={16} strokeWidth={2.25} />} onClick={() => setAddOpen(true)}>
            Add {meta.noun}
          </Button>
        )}
      </div>

      <div className="ifix-table-panel">
        <ConfigProvider theme={{ components: { Table: { colorText: token.colorTextTertiary, headerColor: token.colorTextTertiary } } }}>
          <div style={{ padding: 16 }}>
            <div className="ifix-panel-table" style={{ margin: '0 -16px' }}>
              <Table
                rowKey={r => r.id ?? r.value}
                columns={columns}
                dataSource={rows}
                scroll={rows.length > 0 ? { y: '100%' } : undefined}
                locale={{
                  emptyText: query ? (
                    <TableEmptyState icon={<Shapes size={22} strokeWidth={2.25} />} title="No values found" description={`Try a different ${meta.noun} value.`} />
                  ) : (
                    <TableEmptyState icon={<Shapes size={22} strokeWidth={2.25} />} title={`No ${meta.noun} values yet`} description="Values you add will show up here." />
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
                    <span style={{ color: token.colorTextTertiary }}>{range[0]}–{range[1]} of {total}</span>
                  ),
                }}
              />
            </div>
          </div>
        </ConfigProvider>
      </div>

      <Drawer
        title={`Add ${meta.noun}`}
        open={addOpen}
        onClose={() => { setAddOpen(false); form.resetFields() }}
        destroyOnHidden
        width={420}
        getContainer={appWindow ?? undefined}
        footer={
          <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => { setAddOpen(false); form.resetFields() }}>Cancel</Button>
            <Button type="primary" onClick={() => form.submit()}>Add</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleAdd} requiredMark={false}>
          <Form.Item
            label="Value"
            name="value"
            rules={[
              { required: true, message: 'Required' },
              {
                validator: (_, value) => {
                  const exists = value && MOCK_PRODUCT_ATTRIBUTES.some(a =>
                    a.type === meta.key && a.value.trim().toLowerCase() === value.trim().toLowerCase())
                  return exists
                    ? Promise.reject(new Error(`That ${meta.noun} already exists`))
                    : Promise.resolve()
                },
              },
            ]}
          >
            <Input placeholder={meta.key === 'color' ? 'e.g. Desert Titanium' : 'e.g. 1TB'} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}
