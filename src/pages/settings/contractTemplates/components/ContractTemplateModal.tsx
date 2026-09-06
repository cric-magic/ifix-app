import { useEffect, useState } from 'react'
import { Drawer, Button, Space, Form, Input, InputNumber, Radio } from 'antd'
import { Plus, Trash2, Eye } from 'lucide-react'
import { useAppWindowContainer } from '../../../../contexts/AppWindowContext'
import { useCurrentUser } from '../../../../contexts/AuthContext'
import type { ContractTemplate, ContractTemplateType } from '../../../../types/contractTemplate'
import { generateContractTemplateId } from '../../../../constants/mockContractTemplates'
import { ContractTemplatePreviewDrawer } from './ContractTemplatePreviewDrawer'

interface Props {
  open: boolean
  template: ContractTemplate | null
  onClose: () => void
  onSaved: (template: ContractTemplate) => void
}

interface FormValues {
  name: string
  description?: string
  type: ContractTemplateType
  minDownPaymentPercent: number
  maxDownPaymentPercent: number
  maxLoanAmount: number
  maxPaymentAmount?: number
  fixedRateTerms?: { months: number; ratePercent: number }[]
  title: string
  bindingStatement: string
  legalDeclarations: string
}

const DEFAULT_VALUES: FormValues = {
  name: '',
  type: 'fixed_rate',
  minDownPaymentPercent: 10,
  maxDownPaymentPercent: 50,
  maxLoanAmount: 100000,
  fixedRateTerms: [{ months: 12, ratePercent: 1.75 }],
  title: 'สัญญาเช่าซื้อสินค้า (Hire Purchase Agreement)',
  bindingStatement: '',
  legalDeclarations: '',
}

// Same modal for create/edit/duplicate — `template` is null for "create",
// populated for "edit" (a duplicate is created by the table action, which
// pushes a new record and never opens this modal at all — see
// ContractTemplateTable's handleDuplicate).
export function ContractTemplateModal({ open, template, onClose, onSaved }: Props) {
  const [form] = Form.useForm<FormValues>()
  const appWindow = useAppWindowContainer()
  const actor = useCurrentUser()
  const [previewOpen, setPreviewOpen] = useState(false)
  const type = Form.useWatch('type', form)

  useEffect(() => {
    if (template) {
      form.setFieldsValue({
        name: template.name,
        description: template.description,
        type: template.type,
        minDownPaymentPercent: template.minDownPaymentPercent,
        maxDownPaymentPercent: template.maxDownPaymentPercent,
        maxLoanAmount: template.maxLoanAmount,
        maxPaymentAmount: template.maxPaymentAmount,
        fixedRateTerms: template.fixedRateTerms ?? [{ months: 12, ratePercent: 1.75 }],
        title: template.title,
        bindingStatement: template.bindingStatement,
        legalDeclarations: template.legalDeclarations,
      })
    } else {
      form.resetFields()
      form.setFieldsValue(DEFAULT_VALUES)
    }
  }, [template, open, form])

  function handleSubmit(values: FormValues) {
    const saved: ContractTemplate = {
      id: template?.id ?? generateContractTemplateId(),
      merchantId: template?.merchantId ?? actor.merchantId!,
      name: values.name,
      description: values.description,
      type: values.type,
      status: template?.status ?? 'draft',
      isDefault: template?.isDefault ?? false,
      minDownPaymentPercent: values.minDownPaymentPercent,
      maxDownPaymentPercent: values.maxDownPaymentPercent,
      maxLoanAmount: values.maxLoanAmount,
      maxPaymentAmount: values.type === 'free_rate' ? values.maxPaymentAmount : undefined,
      fixedRateTerms: values.type === 'fixed_rate' ? values.fixedRateTerms : undefined,
      title: values.title,
      bindingStatement: values.bindingStatement,
      legalDeclarations: values.legalDeclarations,
      createdBy: template?.createdBy ?? actor.id,
      createdAt: template?.createdAt ?? new Date().toISOString(),
      updatedBy: template ? actor.id : null,
      updatedAt: template ? new Date().toISOString() : null,
    }
    onSaved(saved)
  }

  return (
    <Drawer
      open={open}
      title={template ? 'Edit contract template' : 'Create contract template'}
      onClose={onClose}
      destroyOnHidden
      width={480}
      getContainer={appWindow ?? undefined}
      footer={
        <Space style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button icon={<Eye size={16} strokeWidth={2.25} />} onClick={() => setPreviewOpen(true)}>Preview</Button>
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" onClick={() => form.submit()}>Save</Button>
          </Space>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false} initialValues={DEFAULT_VALUES}>
        <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Required' }]}>
          <Input placeholder="e.g. Standard Fixed Rate" />
        </Form.Item>
        <Form.Item label="Description" name="description">
          <Input placeholder="Shown in the template list" />
        </Form.Item>
        <Form.Item label="Type" name="type" rules={[{ required: true, message: 'Required' }]}>
          {/* Editing an existing template's type isn't disabled here for
              simplicity — a real implementation would likely lock it once
              contracts have used the template, matching the doc's rule
              that a template's saved terms never retroactively change. */}
          <Radio.Group optionType="button" buttonStyle="solid" options={[
            { label: 'Fixed Rate', value: 'fixed_rate' },
            { label: 'Free Rate (Easy Mode)', value: 'free_rate' },
          ]} />
        </Form.Item>

        <Space.Compact block>
          <Form.Item label="Min Down Payment (%)" name="minDownPaymentPercent" rules={[{ required: true, message: 'Required' }]} style={{ width: '50%' }}>
            <InputNumber style={{ width: '100%' }} min={0} max={100} addonAfter="%" />
          </Form.Item>
          <Form.Item label="Max Down Payment (%)" name="maxDownPaymentPercent" rules={[{ required: true, message: 'Required' }]} style={{ width: '50%' }}>
            <InputNumber style={{ width: '100%' }} min={0} max={100} addonAfter="%" />
          </Form.Item>
        </Space.Compact>

        <Form.Item label="Max Loan Amount (฿)" name="maxLoanAmount" rules={[{ required: true, message: 'Required' }]}>
          <InputNumber style={{ width: '100%' }} min={0} step={1000} addonBefore="฿" />
        </Form.Item>

        {type === 'free_rate' && (
          <Form.Item label="Max Payment Amount (฿)" name="maxPaymentAmount" rules={[{ required: true, message: 'Required' }]}>
            <InputNumber style={{ width: '100%' }} min={0} step={1000} addonBefore="฿" />
          </Form.Item>
        )}

        {type === 'fixed_rate' && (
          <Form.Item label="Payment Terms & Rates" required>
            <Form.List name="fixedRateTerms" rules={[{ validator: async (_, terms) => {
              if (!terms || terms.length === 0) return Promise.reject(new Error('At least one term is required'))
            } }]}>
              {(fields, { add, remove }, { errors }) => (
                <>
                  {fields.map(field => (
                    <Space key={field.key} align="baseline" style={{ display: 'flex', marginBottom: 8 }}>
                      <Form.Item name={[field.name, 'months']} rules={[{ required: true, message: 'Required' }]} noStyle>
                        <InputNumber placeholder="Months" min={1} addonAfter="mo" style={{ width: 140 }} />
                      </Form.Item>
                      <Form.Item name={[field.name, 'ratePercent']} rules={[{ required: true, message: 'Required' }]} noStyle>
                        <InputNumber placeholder="Rate" min={0} step={0.05} precision={2} addonAfter="%/mo" style={{ width: 140 }} />
                      </Form.Item>
                      <Button type="text" danger icon={<Trash2 size={15} strokeWidth={2.25} />} onClick={() => remove(field.name)} />
                    </Space>
                  ))}
                  <Form.ErrorList errors={errors} />
                  <Button type="dashed" icon={<Plus size={15} strokeWidth={2.25} />} onClick={() => add({ months: 6, ratePercent: 1.5 })} block>
                    Add Term
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>
        )}

        <Form.Item label="Template Title" name="title" rules={[{ required: true, message: 'Required' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Binding Statement" name="bindingStatement" rules={[{ required: true, message: 'Required' }]}>
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item label="Legal Declarations" name="legalDeclarations" rules={[{ required: true, message: 'Required' }]}>
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>

      <ContractTemplatePreviewDrawer
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        values={form.getFieldsValue(true)}
      />
    </Drawer>
  )
}
