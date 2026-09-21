import { useState } from 'react'
import { App, Button, ConfigProvider, Dropdown, Form, Input, Modal, Table, Typography, theme } from 'antd'
import { Plus, MoreHorizontal, Ban, RotateCcw, Palette } from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'
import type { ProductAttribute, ProductAttributeType } from '../../../types/productAttribute'
import { MOCK_PRODUCT_ATTRIBUTES } from '../../../constants/mockProductAttributes'
import { MOCK_PRODUCTS } from '../../../constants/mockProducts'
import { DotTag } from '../../../components/DotTag'
import { TableEmptyState } from '../../../components/TableEmptyState'

interface Props {
  type: ProductAttributeType
  title: string
  // Singular noun for the copy in buttons/dialogs ("Add color").
  noun: string
  onChanged: () => void
}

// How many live SKUs currently carry this value. Drives the "In use" column
// and the disable confirmation: an option that's in use can still be
// disabled, it just stops being offered for new SKUs — the doc is explicit
// that disabling "must not remove or alter its value on existing SKUs".
function usageCount(type: ProductAttributeType, value: string): number {
  return MOCK_PRODUCTS.filter(p => !p.deletedAt && (type === 'color' ? p.color : p.storage) === value).length
}

export function AttributePanel({ type, title, noun, onChanged }: Props) {
  const { token } = theme.useToken()
  const { modal, message } = App.useApp()
  const [addOpen, setAddOpen] = useState(false)
  const [form] = Form.useForm<{ value: string }>()

  const options = MOCK_PRODUCT_ATTRIBUTES.filter(o => o.type === type)

  function handleAdd(values: { value: string }) {
    MOCK_PRODUCT_ATTRIBUTES.push({
      id: `opt-${type}-${Date.now()}`,
      type,
      value: values.value.trim(),
      enabled: true,
      createdAt: new Date().toISOString(),
    })
    form.resetFields()
    setAddOpen(false)
    onChanged()
    message.success(`${values.value.trim()} added`)
  }

  function handleToggle(option: ProductAttribute) {
    const inUse = usageCount(type, option.value)
    if (option.enabled) {
      modal.confirm({
        title: `Disable ${option.value}?`,
        content: inUse > 0
          ? `It won't be offered for new products. The ${inUse} product${inUse === 1 ? '' : 's'} already using it keep${inUse === 1 ? 's' : ''} the value unchanged.`
          : "It won't be offered when creating or editing a product.",
        okText: 'Disable',
        okButtonProps: { danger: true },
        onOk: () => {
          option.enabled = false
          onChanged()
          message.success(`${option.value} disabled`)
        },
      })
      return
    }
    option.enabled = true
    onChanged()
    message.success(`${option.value} enabled`)
  }

  const columns: ColumnsType<ProductAttribute> = [
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
      render: (_, o) => {
        const count = usageCount(type, o.value)
        return count > 0 ? count : <span style={{ color: token.colorTextDisabled }}>—</span>
      },
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, o) => (
        <DotTag dotColor={o.enabled ? token.colorSuccess : token.colorTextTertiary}>
          {o.enabled ? 'Enabled' : 'Disabled'}
        </DotTag>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 56,
      align: 'right',
      render: (_, o) => (
        <Dropdown
          trigger={['click']}
          placement="bottomRight"
          menu={{
            items: [{
              key: 'toggle',
              danger: o.enabled,
              icon: o.enabled
                ? <Ban size={15} strokeWidth={2.25} />
                : <RotateCcw size={15} strokeWidth={2.25} />,
              label: o.enabled ? 'Disable' : 'Enable',
            }],
            onClick: () => handleToggle(o),
          }}
        >
          <Button type="text" size="small" icon={<MoreHorizontal size={15} strokeWidth={2.25} />} />
        </Dropdown>
      ),
    },
  ]

  return (
    <div className="ifix-table-panel" style={{ marginBottom: 16 }}>
      {/* Stacked-panel page, so the title and action live inside the panel's
          own header row — same convention as Merchant Detail's Bank Accounts
          and Branches panels. */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        paddingLeft: 16,
        paddingRight: 8,
        boxShadow: `inset 0 -0.5px 0 0 ${token.colorBorderSecondary}`,
      }}>
        <Typography.Text strong style={{ fontSize: 15 }}>{title}</Typography.Text>
        <Button icon={<Plus size={16} strokeWidth={2.25} />} onClick={() => setAddOpen(true)}>
          Add {noun}
        </Button>
      </div>

      <ConfigProvider theme={{ components: { Table: { colorText: token.colorTextTertiary, headerColor: token.colorTextTertiary } } }}>
        <div style={{ padding: 16 }}>
          <div className="ifix-panel-table" style={{ margin: '0 -16px' }}>
            <Table
              rowKey="id"
              columns={columns}
              dataSource={options}
              size="small"
              pagination={false}
              locale={{
                emptyText: (
                  <TableEmptyState
                    icon={<Palette size={22} strokeWidth={2.25} />}
                    title={`No ${noun} options yet`}
                    description={`${noun[0].toUpperCase()}${noun.slice(1)} options you add will show up here.`}
                  />
                ),
              }}
            />
          </div>
        </div>
      </ConfigProvider>

      <Modal
        title={`Add ${noun}`}
        open={addOpen}
        onCancel={() => { setAddOpen(false); form.resetFields() }}
        okText="Add"
        onOk={() => form.validateFields().then(handleAdd)}
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            label="Value"
            name="value"
            rules={[
              { required: true, message: 'Required' },
              {
                validator: (_, value) => {
                  const exists = value && MOCK_PRODUCT_ATTRIBUTES.some(o =>
                    o.type === type && o.value.trim().toLowerCase() === value.trim().toLowerCase())
                  return exists
                    ? Promise.reject(new Error(`That ${noun} already exists`))
                    : Promise.resolve()
                },
              },
            ]}
          >
            <Input placeholder={type === 'color' ? 'e.g. Desert Titanium' : 'e.g. 1TB'} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
