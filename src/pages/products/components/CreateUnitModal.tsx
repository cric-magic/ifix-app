import { Drawer, Button, Space, Form, Input, InputNumber } from 'antd'
import { Select } from '../../../components/AppSelect'
import { PhotoUpload } from '../../../components/PhotoUpload'
import { useAppWindowContainer } from '../../../contexts/AppWindowContext'
import type { AuthUser } from '../../../types/installment'
import type { Product, ProductUnit, UnitGrade, UnitTax } from '../../../types/product'
import { GRADE_LABELS, TAX_LABELS } from '../../../constants/products'
import { BRANCHES } from '../../../constants/mockData'
import { MOCK_PRODUCT_UNITS } from '../../../constants/mockProductUnits'
import { MOCK_PRODUCTS } from '../../../constants/mockProducts'
import { isImeiTaken, isSerialNumberTaken } from '../../../utils/product'

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
  serialNumber: string
  imei1?: string
  imei2?: string
  branch: string
  grade?: UnitGrade
  batteryPercentage?: number
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
  const appWindow = useAppWindowContainer()

  function handleSubmit(values: FormValues) {
    if (!activeProduct) return
    const unit: ProductUnit = {
      id: `unit-${Date.now()}`,
      productId: activeProduct.id,
      serialNumber: values.serialNumber,
      imei1: values.imei1 || undefined,
      imei2: values.imei2 || undefined,
      branch: lockedBranch ?? values.branch,
      grade: isUsed ? values.grade : undefined,
      batteryPercentage: isUsed ? values.batteryPercentage : undefined,
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
      getContainer={appWindow ?? undefined}
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
        {/* Serial Number leads: it's the unit's required primary identifier.
            Both IMEIs are optional (a laptop or accessory has none) but must
            be unique across the merchant whenever a value is given. */}
        <Form.Item
          label="Serial Number"
          name="serialNumber"
          rules={[
            { required: true, message: 'Required' },
            {
              validator: (_, value) =>
                value && isSerialNumberTaken(value, MOCK_PRODUCT_UNITS, MOCK_PRODUCTS, actor.merchantId)
                  ? Promise.reject(new Error('Serial Number must be unique across the merchant'))
                  : Promise.resolve(),
            },
          ]}
        >
          <Input placeholder="e.g. SN-IP14P-0001" />
        </Form.Item>
        <Form.Item
          label="IMEI 1"
          name="imei1"
          rules={[{
            validator: (_, value) =>
              value && isImeiTaken(value, MOCK_PRODUCT_UNITS, MOCK_PRODUCTS, actor.merchantId)
                ? Promise.reject(new Error('IMEI must be unique across the merchant'))
                : Promise.resolve(),
          }]}
        >
          <Input placeholder="Optional — e.g. 353241001234561" />
        </Form.Item>
        <Form.Item
          label="IMEI 2"
          name="imei2"
          dependencies={['imei1']}
          rules={[{
            validator: (_, value) => {
              if (!value) return Promise.resolve()
              if (value === form.getFieldValue('imei1')) {
                return Promise.reject(new Error('IMEI 2 must differ from IMEI 1'))
              }
              return isImeiTaken(value, MOCK_PRODUCT_UNITS, MOCK_PRODUCTS, actor.merchantId)
                ? Promise.reject(new Error('IMEI must be unique across the merchant'))
                : Promise.resolve()
            },
          }]}
        >
          <Input placeholder="Optional — dual-SIM devices" />
        </Form.Item>
        <Form.Item label="Branch" name="branch" rules={[{ required: true, message: 'Required' }]}>
          <Select placeholder="Select branch" disabled={!!lockedBranch} options={BRANCHES.map(b => ({ value: b, label: b }))} />
        </Form.Item>
        {/* Grade and Battery Percentage are Used-only and required there. */}
        {isUsed && (
          <>
            <Form.Item label="Grade" name="grade" rules={[{ required: true, message: 'Required for used products' }]}>
              <Select placeholder="Select grade" options={GRADE_OPTIONS} />
            </Form.Item>
            <Form.Item
              label="Battery Percentage"
              name="batteryPercentage"
              rules={[{ required: true, message: 'Required for used products' }]}
            >
              <InputNumber min={0} max={100} style={{ width: '100%' }} addonAfter="%" />
            </Form.Item>
          </>
        )}
        {/* One optional set for New and Used alike. */}
        <Form.Item label="Condition Photos" name="conditionPhotos" help="Optional">
          <PhotoUpload maxCount={10} />
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
