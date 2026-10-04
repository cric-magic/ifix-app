import { useEffect, type ReactNode } from 'react'
import { Form, Modal, Typography, theme } from 'antd'
import { InputNumber } from '../../../components/AppInputNumber'
import { MOCK_PRODUCTS } from '../../../constants/mockProducts'
import { MOCK_PRODUCT_UNITS } from '../../../constants/mockProductUnits'
import { TYPE_DESCRIPTIONS } from '../../../constants/products'
import type { AuthUser } from '../../../types/installment'
import type { Product, ProductUnit } from '../../../types/product'
import { fullSkuName, openedSiblingOf } from '../../../utils/product'

const formatter = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 })

interface Props {
  actor: AuthUser
  // The unit to move, with its New SKU — null while closed.
  unit: ProductUnit | null
  product: Product | null
  onClose: () => void
  onMoved: (opened: Product) => void
}

// New → Opened, once a unit's box has been opened or a customer has returned
// it unused. Condition lives on the SKU, so the unit moves to the Opened SKU
// of the same device and sells at that SKU's price. When the store has no
// Opened SKU for it yet, this creates one — a copy of the New SKU — and
// asks for its price here, so the move never dead-ends.
export function MarkOpenedModal({ actor, unit, product, onClose, onMoved }: Props) {
  const { token } = theme.useToken()
  const [form] = Form.useForm<{ salesPrice: number }>()
  const open = !!unit && !!product
  const target = product ? openedSiblingOf(product, MOCK_PRODUCTS) : undefined

  useEffect(() => {
    if (open) form.resetFields()
  }, [open, form])

  if (!unit || !product) return null

  function move(salesPrice?: number) {
    const opened = target ?? createOpenedSku(product!, salesPrice!, actor)
    const record = MOCK_PRODUCT_UNITS.find(u => u.id === unit!.id)
    if (record) {
      record.productId = opened.id
      // A custom price was set against the New condition — the unit now
      // sells at the Opened price instead.
      record.customPrice = undefined
    }
    onMoved(opened)
  }

  const row = (label: string, value: ReactNode) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ color: token.colorTextTertiary }}>{label}</span>
      <span style={{ color: token.colorText, textAlign: 'right' }}>{value}</span>
    </div>
  )

  return (
    <Modal
      title="Mark this unit as Opened?"
      open={open}
      onCancel={onClose}
      okText="Mark as Opened"
      onOk={() => {
        if (target) move()
        // A missing price shows on the field; nothing else to do.
        else form.validateFields().then(v => move(v.salesPrice)).catch(() => {})
      }}
      destroyOnHidden
    >
      <Typography.Paragraph type="secondary">
        Opened: {TYPE_DESCRIPTIONS.opened}. The unit moves to the Opened SKU and sells at its price.
      </Typography.Paragraph>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 12,
        marginBottom: 16,
        borderRadius: 8,
        background: token.colorFillQuaternary,
      }}>
        {row('Unit', unit.serialNumber)}
        {row('From', `${fullSkuName(product)} · ${formatter.format(unit.customPrice ?? product.salesPrice)}`)}
        {row('To', target
          ? `${fullSkuName(target)} · ${formatter.format(target.salesPrice)}`
          : `${fullSkuName({ ...product, type: 'opened' })} · new SKU`)}
      </div>
      {!target && (
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            label="Opened sales price"
            name="salesPrice"
            rules={[{ required: true, message: 'Set a price for the new Opened SKU' }]}
            extra="There's no Opened SKU for this device yet — one is created from the New SKU with this price."
          >
            <InputNumber min={0} style={{ width: '100%' }} addonBefore="฿" placeholder={String(product.salesPrice)} />
          </Form.Item>
        </Form>
      )}
      <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
        {unit.customPrice ? `Its custom price of ${formatter.format(unit.customPrice)} is cleared. ` : ''}
        This can't be switched back to New.
      </Typography.Paragraph>
    </Modal>
  )
}

function createOpenedSku(product: Product, salesPrice: number, actor: AuthUser): Product {
  const opened: Product = {
    ...product,
    id: `prod-${Date.now()}`,
    sku: `${product.sku}-O`,
    type: 'opened',
    salesPrice,
    // The merchant's own SKU, not adopted from the catalog.
    sourceCatalogId: undefined,
    createdBy: actor.id,
    createdAt: new Date().toISOString(),
    deletedAt: null,
  }
  MOCK_PRODUCTS.push(opened)
  return opened
}
