import { useEffect } from 'react'
import { Alert, Drawer, Button, Space, Form, Input } from 'antd'
import { InputNumber } from '../../../components/AppInputNumber'
import { Select } from '../../../components/AppSelect'
import { PhotoUpload } from '../../../components/PhotoUpload'
import { useAppWindowContainer } from '../../../contexts/AppWindowContext'
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
  batteryPercentage?: number
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
  const appWindow = useAppWindowContainer()

  // Per the doc, a Reserved unit is already committed to a contract, so the
  // fields that contract depends on — where it physically is, how it's
  // priced and taxed, and the condition grading it was sold against — are
  // frozen. Notes and Condition Photos stay open, since those document the
  // device rather than define the deal. Sold units are fully locked; callers
  // hide the Edit action entirely, and the guard below is the backstop.
  const isReserved = unit?.availability === 'reserved'
  const isSold = unit?.availability === 'sold'
  const lockDealFields = isReserved || isSold

  useEffect(() => {
    if (unit) {
      form.setFieldsValue({
        branch: unit.branch,
        grade: unit.grade,
        batteryPercentage: unit.batteryPercentage,
        notes: unit.notes,
        conditionPhotos: unit.conditionPhotos,
        tax: unit.tax,
        customPrice: unit.customPrice,
      })
    }
  }, [unit, form])

  function handleSubmit(values: FormValues) {
    if (!unit || isSold) return
    if (!lockDealFields) {
      unit.branch = lockedBranch ?? values.branch
      unit.grade = isUsed ? values.grade : undefined
      unit.batteryPercentage = isUsed ? values.batteryPercentage : undefined
      unit.tax = values.tax
      unit.customPrice = values.customPrice
    }
    unit.notes = values.notes
    unit.conditionPhotos = values.conditionPhotos
    onUpdated()
  }

  return (
    <Drawer
      open={open}
      title="Edit unit"
      onClose={onClose}
      destroyOnHidden
      width={420}
      getContainer={appWindow ?? undefined}
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={() => form.submit()} disabled={isSold}>Save</Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
        {isSold && (
          <Alert
            type="info"
            showIcon
            message="This unit is sold"
            description="Sold units are kept as historical records and can no longer be edited."
            style={{ marginBottom: 16 }}
          />
        )}
        {isReserved && (
          <Alert
            type="info"
            showIcon
            message="This unit is reserved"
            description="It's committed to a contract, so branch, condition, tax and price are locked. Notes and condition photos can still be updated."
            style={{ marginBottom: 16 }}
          />
        )}
        {unit && (
          <>
            <Form.Item label="Serial Number">
              <Input value={unit.serialNumber} disabled />
            </Form.Item>
            <Form.Item label="IMEI 1">
              <Input value={unit.imei1 ?? '—'} disabled />
            </Form.Item>
            <Form.Item label="IMEI 2">
              <Input value={unit.imei2 ?? '—'} disabled />
            </Form.Item>
          </>
        )}
        <Form.Item label="Branch" name="branch" rules={[{ required: true, message: 'Required' }]}>
          <Select
            placeholder="Select branch"
            disabled={!!lockedBranch || lockDealFields}
            options={BRANCHES.map(b => ({ value: b, label: b }))}
          />
        </Form.Item>
        {isUsed && (
          <>
            <Form.Item label="Grade" name="grade" rules={[{ required: true, message: 'Required for used products' }]}>
              <Select placeholder="Select grade" options={GRADE_OPTIONS} disabled={lockDealFields} />
            </Form.Item>
            <Form.Item
              label="Battery Percentage"
              name="batteryPercentage"
              rules={[{ required: true, message: 'Required for used products' }]}
            >
              <InputNumber min={0} max={100} style={{ width: '100%' }} addonAfter="%" disabled={lockDealFields} />
            </Form.Item>
          </>
        )}
        <Form.Item label="Condition Photos" name="conditionPhotos" help="Optional">
          <PhotoUpload maxCount={10} disabled={isSold} />
        </Form.Item>
        <Form.Item label="Tax" name="tax" rules={[{ required: true, message: 'Required' }]}>
          <Select options={TAX_OPTIONS} disabled={lockDealFields} />
        </Form.Item>
        <Form.Item label="Custom Price" name="customPrice" help="Defaults to the product's sales price if not set">
          <InputNumber min={0} style={{ width: '100%' }} addonBefore="฿" disabled={lockDealFields} />
        </Form.Item>
        <Form.Item label="Notes" name="notes">
          <Input.TextArea rows={3} placeholder="Optional" disabled={isSold} />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
