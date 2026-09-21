import { useEffect } from 'react'
import { Drawer, Button, Space, Form, Input, InputNumber } from 'antd'
import { Select } from '../../../components/AppSelect'
import { PhotoUpload } from '../../../components/PhotoUpload'
import { useAppWindowContainer } from '../../../contexts/AppWindowContext'
import type { Product, ProductCategory, ProductType, ProductStatus } from '../../../types/product'
import {
  CATEGORY_LABELS, TYPE_LABELS, STATUS_LABELS,
  RAM_OPTIONS, CONNECTION_OPTIONS, enabledAttributeValues, optionsWithCurrent,
} from '../../../constants/products'

interface Props {
  open: boolean
  product: Product | null
  onClose: () => void
  onUpdated: () => void
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
  sku: string
  costPrice: number
  salesPrice: number
  type: ProductType
  status: ProductStatus
  photos?: string[]
}

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }))
const TYPE_OPTIONS = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))
const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))

export function EditProductModal({ open, product, onClose, onUpdated }: Props) {
  const [form] = Form.useForm<FormValues>()
  const type = Form.useWatch('type', form)
  const isNew = type !== 'used'
  const appWindow = useAppWindowContainer()

  useEffect(() => {
    if (product) {
      form.setFieldsValue({
        name: product.name,
        brand: product.brand,
        category: product.category,
        model: product.model,
        modelNumber: product.modelNumber,
        storage: product.storage,
        ram: product.ram,
        color: product.color,
        connection: product.connection,
        sku: product.sku,
        costPrice: product.costPrice,
        salesPrice: product.salesPrice,
        type: product.type,
        status: product.status,
        photos: product.photos,
      })
    }
  }, [product, form])

  function handleSubmit(values: FormValues) {
    if (!product) return
    Object.assign(product, values)
    onUpdated()
  }

  return (
    <Drawer
      open={open}
      title="Edit product"
      onClose={onClose}
      destroyOnHidden
      width={420}
      getContainer={appWindow ?? undefined}
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={() => form.submit()}>Save</Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
        <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Required' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Brand" name="brand" rules={[{ required: true, message: 'Required' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Category" name="category" rules={[{ required: true, message: 'Required' }]}>
          <Select options={CATEGORY_OPTIONS} />
        </Form.Item>
        <Form.Item label="Model" name="model" rules={[{ required: true, message: 'Required' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Model Number" name="modelNumber" rules={[{ required: true, message: 'Required' }]}>
          <Input />
        </Form.Item>
        {/* Selects, not free text — Storage/Color come from SuperAdmin master
            data, RAM/Connection from fixed lists. optionsWithCurrent keeps a
            value that has since been disabled upstream from silently blanking. */}
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
        <Form.Item label="SKU Code" name="sku" rules={[{ required: true, message: 'Required' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Cost Price" name="costPrice" rules={[{ required: true, message: 'Required' }]}>
          <InputNumber min={0} style={{ width: '100%' }} addonBefore="฿" />
        </Form.Item>
        <Form.Item label="Sales Price" name="salesPrice" rules={[{ required: true, message: 'Required' }]}>
          <InputNumber min={0} style={{ width: '100%' }} addonBefore="฿" />
        </Form.Item>
        <Form.Item label="Type" name="type" rules={[{ required: true, message: 'Required' }]}>
          <Select options={TYPE_OPTIONS} />
        </Form.Item>
        <Form.Item label="Status" name="status" rules={[{ required: true, message: 'Required' }]}>
          <Select options={STATUS_OPTIONS} />
        </Form.Item>
        {isNew && (
          <Form.Item
            label="Product Photo(s)"
            name="photos"
            rules={[{ required: true, message: 'Required for new products' }]}
            help="Sealed box photo"
          >
            <PhotoUpload maxCount={10} />
          </Form.Item>
        )}
      </Form>
    </Drawer>
  )
}
