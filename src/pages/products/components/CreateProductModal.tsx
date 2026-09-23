import { useEffect, useState } from 'react'
import { Drawer, Button, Space, Form, Input, InputNumber, Typography, theme } from 'antd'
import { Search, ArrowLeft, Package } from 'lucide-react'
import { Select } from '../../../components/AppSelect'
import { useAppWindowContainer } from '../../../contexts/AppWindowContext'
import { PhotoUpload } from '../../../components/PhotoUpload'
import { useIconColors } from '../../../constants/iconColors'
import type { AuthUser } from '../../../types/installment'
import type { Product, ProductCategory, ProductType, ProductStatus } from '../../../types/product'
import type { CatalogProduct } from '../../../types/catalogProduct'
import {
  CATEGORY_LABELS, TYPE_LABELS, STATUS_LABELS,
  RAM_OPTIONS, CONNECTION_OPTIONS, enabledAttributeValues, optionsWithCurrent,
} from '../../../constants/products'
import { MOCK_CATALOG_PRODUCTS } from '../../../constants/mockCatalogProducts'
import { MOCK_PRODUCTS } from '../../../constants/mockProducts'

interface Props {
  open: boolean
  actor: AuthUser
  onClose: () => void
  onCreated: (product: Product) => void
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

// Two stages behind one entry point. A merchant with no SKUs of their own
// starts from the platform's standard catalog; one who already has their own
// skips straight to the blank form. Adopting copies the catalog entry rather
// than linking to it, so everything stays editable afterward — including the
// name, which is the point for merchants who name SKUs their own way.
export function CreateProductModal({ open, actor, onClose, onCreated }: Props) {
  const [form] = Form.useForm<FormValues>()
  const { token } = theme.useToken()
  const iconColors = useIconColors()
  const type = Form.useWatch('type', form)
  const isNew = type !== 'used'
  const appWindow = useAppWindowContainer()

  const [stage, setStage] = useState<'pick' | 'form'>('pick')
  const [source, setSource] = useState<CatalogProduct | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!open) return
    setStage('pick')
    setSource(null)
    setSearch('')
    form.resetFields()
  }, [open, form])

  // Catalog entries this merchant already adopted — offering them again
  // would just create a second SKU for the same device.
  const adoptedIds = new Set(
    MOCK_PRODUCTS
      .filter(p => p.merchantId === actor.merchantId && !p.deletedAt && p.sourceCatalogId)
      .map(p => p.sourceCatalogId),
  )

  const query = search.trim().toLowerCase()
  const catalog = MOCK_CATALOG_PRODUCTS.filter(c => !c.deletedAt).filter(c =>
    !query
    || c.name.toLowerCase().includes(query)
    || c.brand.toLowerCase().includes(query)
    || c.model.toLowerCase().includes(query)
    || c.skuCode.toLowerCase().includes(query),
  )

  function startFromCatalog(entry: CatalogProduct) {
    setSource(entry)
    form.setFieldsValue({
      name: entry.name,
      brand: entry.brand,
      category: entry.category,
      model: entry.model,
      modelNumber: entry.modelNumber,
      storage: entry.storage,
      ram: entry.ram,
      color: entry.color,
      connection: entry.connection,
      sku: entry.skuCode,
      type: entry.type,
      status: 'available',
      photos: entry.photos,
    })
    setStage('form')
  }

  function startFromScratch() {
    setSource(null)
    form.resetFields()
    form.setFieldsValue({ type: 'new', status: 'available' })
    setStage('form')
  }

  function handleSubmit(values: FormValues) {
    const product: Product = {
      id: `prod-${Date.now()}`,
      ...values,
      merchantId: actor.merchantId!,
      // Provenance only — this record is the merchant's own copy from here on.
      sourceCatalogId: source?.id,
      createdBy: actor.id,
      createdAt: new Date().toISOString(),
      deletedAt: null,
    }
    form.resetFields()
    onCreated(product)
  }

  return (
    <Drawer
      open={open}
      title={stage === 'pick' ? 'Add product' : source ? 'Add from catalog' : 'Create product'}
      onClose={onClose}
      destroyOnHidden
      width={420}
      getContainer={appWindow ?? undefined}
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancel</Button>
          {stage === 'pick'
            ? <Button type="primary" onClick={startFromScratch}>Create from scratch</Button>
            : <Button type="primary" onClick={() => form.submit()}>Create</Button>}
        </Space>
      }
    >
      {stage === 'pick' ? (
        <div>
          <Typography.Text style={{ display: 'block', marginBottom: 12, color: token.colorTextSecondary }}>
            Pick a standard product to start from, or create your own.
          </Typography.Text>
          <Input
            placeholder="Search the standard catalog"
            prefix={<Search size={15} strokeWidth={2.25} color={iconColors.secondary} />}
            allowClear
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ marginBottom: 12 }}
          />
          {catalog.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: token.colorTextTertiary }}>
              <Package size={22} strokeWidth={2.25} />
              <div style={{ marginTop: 8 }}>
                {query ? 'No standard products match that search.' : 'No standard products available yet.'}
              </div>
            </div>
          ) : (
            // A plain stacked list rather than separate cards: no box, no
            // divider, no side padding — rows are separated by their own
            // vertical padding alone.
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {catalog.map(entry => {
                const alreadyAdded = adoptedIds.has(entry.id)
                const spec = [entry.storage, entry.ram, entry.color].filter(Boolean).join(' · ')
                return (
                  <div
                    key={entry.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      padding: '8px 0',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: token.colorText }}>{entry.name}</div>
                      <div style={{ fontSize: 12, color: token.colorTextTertiary }}>
                        {entry.skuCode}{spec ? ` · ${spec}` : ''}
                      </div>
                    </div>
                    <Button
                      size="small"
                      disabled={alreadyAdded}
                      onClick={() => startFromCatalog(entry)}
                      style={{ flexShrink: 0 }}
                    >
                      {alreadyAdded ? 'Added' : 'Use'}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
          {source && (
            <div style={{ marginBottom: 16 }}>
              <Button
                type="text"
                size="small"
                icon={<ArrowLeft size={15} strokeWidth={2.25} />}
                onClick={() => setStage('pick')}
                style={{ paddingLeft: 4, marginBottom: 4 }}
              >
                Back to catalog
              </Button>
              <Typography.Text style={{ display: 'block', fontSize: 12, color: token.colorTextTertiary }}>
                Started from {source.name} in the standard catalog. Everything below is yours to change.
              </Typography.Text>
            </div>
          )}
          <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Required' }]}>
            <Input placeholder="e.g. iPhone 17 Pro" />
          </Form.Item>
          <Form.Item label="Brand" name="brand" rules={[{ required: true, message: 'Required' }]}>
            <Input placeholder="e.g. Apple" />
          </Form.Item>
          <Form.Item label="Category" name="category" rules={[{ required: true, message: 'Required' }]}>
            <Select placeholder="Select category" options={CATEGORY_OPTIONS} />
          </Form.Item>
          <Form.Item label="Model" name="model" rules={[{ required: true, message: 'Required' }]}>
            <Input placeholder="e.g. iPhone 17 Pro" />
          </Form.Item>
          <Form.Item label="Model Number" name="modelNumber" rules={[{ required: true, message: 'Required' }]}>
            <Input placeholder="e.g. A2890" />
          </Form.Item>
          {/* Storage/Color are SuperAdmin master data and RAM/Connection are
              fixed lists — all four are selects, never free text. */}
          <Form.Item label="Storage" name="storage">
            <Select placeholder="Select storage" allowClear options={optionsWithCurrent(enabledAttributeValues('storage'), source?.storage)} />
          </Form.Item>
          <Form.Item label="RAM" name="ram">
            <Select placeholder="Select RAM" allowClear options={optionsWithCurrent(RAM_OPTIONS, source?.ram)} />
          </Form.Item>
          <Form.Item label="Color" name="color" rules={[{ required: true, message: 'Required' }]}>
            <Select placeholder="Select color" options={optionsWithCurrent(enabledAttributeValues('color'), source?.color)} />
          </Form.Item>
          <Form.Item label="Connection" name="connection">
            <Select placeholder="Select connection" allowClear options={optionsWithCurrent(CONNECTION_OPTIONS, source?.connection)} />
          </Form.Item>
          <Form.Item label="SKU Code" name="sku" rules={[{ required: true, message: 'Required' }]}>
            <Input placeholder="e.g. IP17P-256-COR" />
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
              // `extra`, not `help` — antd's help slot replaces the
              // validation message, so the hint was showing in red in place
              // of the actual error when this failed.
              extra="Sealed box photo — up to 10"
            >
              <PhotoUpload maxCount={10} />
            </Form.Item>
          )}
        </Form>
      )}
    </Drawer>
  )
}
