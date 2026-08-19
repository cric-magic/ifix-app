import { Drawer, Button, Space, Form, Input, InputNumber } from 'antd'
import { Select } from '../../../components/AppSelect'
import { PhotoUpload } from '../../../components/PhotoUpload'
import type { AuthUser } from '../../../types/installment'
import type { Product, ProductUnit, UnitGrade, UnitTax } from '../../../types/product'
import { GRADE_LABELS, TAX_LABELS } from '../../../constants/products'
import { BRANCHES } from '../../../constants/mockData'
import { MOCK_PRODUCT_UNITS } from '../../../constants/mockProductUnits'

interface Props {
  open: boolean
  actor: AuthUser
  product: Product | null
  products?: Product[]
  onClose: () => void
  onCreated: (unit: ProductUnit) => void
}

interface FormValues {
  productId?: string
  imei: string
  serialNumber: string
  branch: string
  grade?: UnitGrade
  notes?: string
  conditionPhotos?: string[]
  tax: UnitTax
  customPrice?: number
}

const GRADE_OPTIONS = Object.entries(GRADE_LABELS).map(([value, label]) => ({ value, label }))
const TAX_OPTIONS = Object.entries(TAX_LABELS).map(([value, label]) => ({ value, label }))

export function CreateUnitModal({ open, actor, product, products, onClose, onCreated }: Props) {
  const [form] = Form.useForm<FormValues>()
  const selectedProductId = Form.useWatch('productId', form)
  const activeProduct = product ?? products?.find(p => p.id === selectedProductId) ?? null
  const isUsed = activeProduct?.type === 'used'
  const lockedBranch = actor.role === 'branch_manager' ? actor.branch : undefined
  const showProductPicker = !product && !!products

  function handleSubmit(values: FormValues) {
    if (!activeProduct) return
    const unit: ProductUnit = {
      id: `unit-${Date.now()}`,
      productId: activeProduct.id,
      imei: values.imei,
      serialNumber: values.serialNumber,
      branch: lockedBranch ?? values.branch,
      grade: isUsed ? values.grade : undefined,
      notes: values.notes,
      conditionPhotos: values.conditionPhotos,
      tax: values.tax,
      customPrice: values.customPrice,
      availability: 'available',
      soldAt: null,
      soldBy: null,
      createdAt: new Date().toISOString(),
    }
    form.resetFields()
    onCreated(unit)
  }

  return (
    <Drawer
      open={open}
      title="Add unit"
      onClose={onClose}
      destroyOnHidden
      width={420}
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={() => form.submit()}>Add</Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false} initialValues={{ tax: 'vat', branch: lockedBranch }}>
        {showProductPicker && (
          <Form.Item label="Product" name="productId" rules={[{ required: true, message: 'Required' }]}>
            <Select
              placeholder="Select product"
              options={products!.map(p => ({ value: p.id, label: p.name }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
        )}
        <Form.Item
          label="IMEI"
          name="imei"
          rules={[
            { required: true, message: 'Required' },
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve()
                const exists = MOCK_PRODUCT_UNITS.some(u => u.imei === value)
                return exists ? Promise.reject(new Error('IMEI must be unique across the merchant')) : Promise.resolve()
              },
            },
          ]}
        >
          <Input placeholder="e.g. 353241001234561" />
        </Form.Item>
        <Form.Item label="Serial Number" name="serialNumber" rules={[{ required: true, message: 'Required' }]}>
          <Input placeholder="e.g. SN-IP14P-0001" />
        </Form.Item>
        <Form.Item label="Branch" name="branch" rules={[{ required: true, message: 'Required' }]}>
          <Select placeholder="Select branch" disabled={!!lockedBranch} options={BRANCHES.map(b => ({ value: b, label: b }))} />
        </Form.Item>
        {isUsed && (
          <Form.Item label="Grade" name="grade" rules={[{ required: true, message: 'Required for used products' }]}>
            <Select placeholder="Select grade" options={GRADE_OPTIONS} />
          </Form.Item>
        )}
        <Form.Item
          label="Condition Photos"
          name="conditionPhotos"
          rules={isUsed ? [{ required: true, message: 'Required for used products' }] : []}
        >
          <PhotoUpload />
        </Form.Item>
        <Form.Item label="Tax" name="tax" rules={[{ required: true, message: 'Required' }]}>
          <Select options={TAX_OPTIONS} />
        </Form.Item>
        <Form.Item label="Custom Price" name="customPrice" help="Defaults to the product's sales price if not set">
          <InputNumber min={0} style={{ width: '100%' }} addonBefore="฿" />
        </Form.Item>
        <Form.Item label="Notes" name="notes">
          <Input.TextArea rows={3} placeholder="Optional" />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
