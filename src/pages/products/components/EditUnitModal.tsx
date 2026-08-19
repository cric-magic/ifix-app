import { useEffect } from 'react'
import { Drawer, Button, Space, Form, Input, InputNumber } from 'antd'
import { Select } from '../../../components/AppSelect'
import { PhotoUpload } from '../../../components/PhotoUpload'
import type { AuthUser } from '../../../types/installment'
import type { Product, ProductUnit, UnitGrade, UnitTax } from '../../../types/product'
import { GRADE_LABELS, TAX_LABELS } from '../../../constants/products'
import { BRANCHES } from '../../../constants/mockData'

interface Props {
  open: boolean
  actor: AuthUser
  product: Product | null
  unit: ProductUnit | null
  onClose: () => void
  onUpdated: () => void
}

interface FormValues {
  branch: string
  grade?: UnitGrade
  notes?: string
  conditionPhotos?: string[]
  tax: UnitTax
  customPrice?: number
}

const GRADE_OPTIONS = Object.entries(GRADE_LABELS).map(([value, label]) => ({ value, label }))
const TAX_OPTIONS = Object.entries(TAX_LABELS).map(([value, label]) => ({ value, label }))

export function EditUnitModal({ open, actor, product, unit, onClose, onUpdated }: Props) {
  const [form] = Form.useForm<FormValues>()
  const isUsed = product?.type === 'used'
  const lockedBranch = actor.role === 'branch_manager' ? actor.branch : undefined

  useEffect(() => {
    if (unit) {
      form.setFieldsValue({
        branch: unit.branch,
        grade: unit.grade,
        notes: unit.notes,
        conditionPhotos: unit.conditionPhotos,
        tax: unit.tax,
        customPrice: unit.customPrice,
      })
    }
  }, [unit, form])

  function handleSubmit(values: FormValues) {
    if (!unit) return
    unit.branch = lockedBranch ?? values.branch
    unit.grade = isUsed ? values.grade : undefined
    unit.notes = values.notes
    unit.conditionPhotos = values.conditionPhotos
    unit.tax = values.tax
    unit.customPrice = values.customPrice
    onUpdated()
  }

  return (
    <Drawer
      open={open}
      title="Edit unit"
      onClose={onClose}
      destroyOnHidden
      width={420}
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={() => form.submit()}>Save</Button>
        </Space>
      }
    >
      {unit && (
        <>
          <Form.Item label="IMEI">
            <Input value={unit.imei} disabled />
          </Form.Item>
          <Form.Item label="Serial Number">
            <Input value={unit.serialNumber} disabled />
          </Form.Item>
        </>
      )}
      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
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
