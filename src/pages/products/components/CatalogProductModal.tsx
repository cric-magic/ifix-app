import { useEffect } from 'react'
import { Drawer, Button, Space, Form, Input, Typography, theme } from 'antd'
import { Select } from '../../../components/AppSelect'
import { PhotoUpload } from '../../../components/PhotoUpload'
import { useAppWindowContainer } from '../../../contexts/AppWindowContext'
import type { CatalogProduct } from '../../../types/catalogProduct'
import type { ProductCategory, ProductType } from '../../../types/product'
import {
  CATEGORY_LABELS, TYPE_LABELS,
  RAM_OPTIONS, CONNECTION_OPTIONS, enabledAttributeValues, optionsWithCurrent,
} from '../../../constants/products'
import { MOCK_CATALOG_PRODUCTS } from '../../../constants/mockCatalogProducts'
import { generateCatalogSkuCode } from '../../../utils/catalogSku'

interface Props {
  open: boolean
  // null when creating.
  product: CatalogProduct | null
  onClose: () => void
  onSaved: (product: CatalogProduct) => void
}

interface FormValues {
  name: string
  brand: string
  category: ProductCategory
  model: string
  modelNumber: string
  storage?: string
  ram?: string
  color: string
  connection?: string
  type: ProductType
  skuCode: string
  photos?: string[]
}

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }))
const TYPE_OPTIONS = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))

export function CatalogProductModal({ open, product, onClose, onSaved }: Props) {
  const [form] = Form.useForm<FormValues>()
  const { token } = theme.useToken()
  const appWindow = useAppWindowContainer()

  // The three fields the standard code is built from. Watched so the
  // preview updates as they're filled.
  const model = Form.useWatch('model', form)
  const storage = Form.useWatch('storage', form)
  const color = Form.useWatch('color', form)
  const type = Form.useWatch('type', form)

  const suggestedCode = model && color
    ? generateCatalogSkuCode({ model, storage, color, type: type ?? 'new' })
    : ''

  useEffect(() => {
    if (!open) return
    if (product) {
      form.setFieldsValue({ ...product })
    } else {
      form.resetFields()
      form.setFieldsValue({ type: 'new' })
    }
  }, [open, product, form])

  // Creating: keep the code field in step with the generated standard until
  // the user types their own. Editing leaves an existing code alone — it may
  // already be in use by merchants who adopted this entry.
  useEffect(() => {
    if (!open || product) return
    form.setFieldsValue({ skuCode: suggestedCode })
  }, [open, product, suggestedCode, form])

  function handleSubmit(values: FormValues) {
    onSaved({
      id: product?.id ?? `cat-${Date.now()}`,
      ...values,
      createdAt: product?.createdAt ?? new Date().toISOString(),
      deletedAt: null,
    })
    form.resetFields()
  }

  return (
    <Drawer
      open={open}
      title={product ? 'Edit product' : 'Create product'}
      onClose={onClose}
      destroyOnHidden
      width={420}
      getContainer={appWindow ?? undefined}
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={() => form.submit()}>{product ? 'Save' : 'Create'}</Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
        <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Required' }]}>
          <Input placeholder="e.g. iPhone 15 Pro" />
        </Form.Item>
        <Form.Item label="Brand" name="brand" rules={[{ required: true, message: 'Required' }]}>
          <Input placeholder="e.g. Apple" />
        </Form.Item>
        <Form.Item label="Category" name="category" rules={[{ required: true, message: 'Required' }]}>
          <Select placeholder="Select category" options={CATEGORY_OPTIONS} />
        </Form.Item>
        <Form.Item label="Model" name="model" rules={[{ required: true, message: 'Required' }]}>
          <Input placeholder="e.g. iPhone 15 Pro" />
        </Form.Item>
        <Form.Item label="Model Number" name="modelNumber" rules={[{ required: true, message: 'Required' }]}>
          <Input placeholder="e.g. A2848" />
        </Form.Item>
        <Form.Item label="Storage" name="storage">
          <Select placeholder="Select storage" allowClear options={optionsWithCurrent(enabledAttributeValues('storage'), product?.storage)} />
        </Form.Item>
        <Form.Item label="RAM" name="ram">
          <Select placeholder="Select RAM" allowClear options={optionsWithCurrent(RAM_OPTIONS, product?.ram)} />
        </Form.Item>
        <Form.Item label="Color" name="color" rules={[{ required: true, message: 'Required' }]}>
          <Select placeholder="Select color" options={optionsWithCurrent(enabledAttributeValues('color'), product?.color)} />
        </Form.Item>
        <Form.Item label="Connection" name="connection">
          <Select placeholder="Select connection" allowClear options={optionsWithCurrent(CONNECTION_OPTIONS, product?.connection)} />
        </Form.Item>
        <Form.Item label="Type" name="type" rules={[{ required: true, message: 'Required' }]}>
          <Select options={TYPE_OPTIONS} />
        </Form.Item>
        {/* Generated to the standard format from Model/Storage/Color/Type,
            but editable — the abbreviation rules can't produce a sensible
            token for every product name. */}
        <Form.Item
          label="SKU Code"
          name="skuCode"
          extra={suggestedCode ? `Standard format: ${suggestedCode}` : 'Fill in Model and Color to generate'}
          rules={[
            { required: true, message: 'Required' },
            {
              validator: (_, value) => {
                const clash = value && MOCK_CATALOG_PRODUCTS.some(c =>
                  c.id !== product?.id && !c.deletedAt
                  && c.skuCode.trim().toLowerCase() === value.trim().toLowerCase())
                return clash
                  ? Promise.reject(new Error('Another catalog product already uses this code'))
                  : Promise.resolve()
              },
            },
          ]}
        >
          <Input />
        </Form.Item>
        {product && (
          <Typography.Text style={{ display: 'block', marginBottom: 16, color: token.colorTextTertiary, fontSize: 12 }}>
            Merchants who already adopted this product keep their own copy — these edits won't reach them.
          </Typography.Text>
        )}
        <Form.Item label="Photos" name="photos" help="Optional — up to 10">
          <PhotoUpload maxCount={10} />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
