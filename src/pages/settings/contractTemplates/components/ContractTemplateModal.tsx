import { useEffect, useState } from 'react'
import { Drawer, Button, Space, Form, Input, Radio, Divider, Typography, theme } from 'antd'
import { InputNumber } from '../../../../components/AppInputNumber'
import { Plus, Trash2 } from 'lucide-react'
import { useAppWindowContainer } from '../../../../contexts/AppWindowContext'
import { useDevTools } from '../../../../contexts/DevToolsContext'
import { useCurrentUser } from '../../../../contexts/AuthContext'
import type { ContractTemplate, ContractTemplateType, PenaltyType } from '../../../../types/contractTemplate'
import { generateContractTemplateId } from '../../../../constants/mockContractTemplates'
import { ContractTemplatePreview } from './ContractTemplatePreview'

interface Props {
  open: boolean
  template: ContractTemplate | null
  // Whose template this is — the actor's own merchant, or the one a Super
  // Admin selected on the list (they have no merchantId of their own).
  merchantId: string | undefined
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
  penaltyType: PenaltyType
  penaltyRatePercent?: number
  penaltyFlatFeeAmount?: number
  penaltyGraceDays: number
  penaltyMaxCap: number
  penaltyLegalText: string
}

const DEFAULT_VALUES: FormValues = {
  name: '',
  type: 'fixed_rate',
  minDownPaymentPercent: 10,
  maxDownPaymentPercent: 50,
  maxLoanAmount: 100000,
  fixedRateTerms: [{ months: 12, ratePercent: 1.75 }],
  title: 'Hire Purchase Agreement',
  bindingStatement: '',
  legalDeclarations: '',
  penaltyType: 'fixed_rate',
  penaltyRatePercent: 1.5,
  penaltyGraceDays: 3,
  penaltyMaxCap: 3000,
  penaltyLegalText: '',
}

// Same modal for create/edit/duplicate — `template` is null for "create",
// populated for "edit" (a duplicate is created by the table action, which
// pushes a new record and never opens this modal at all — see
// ContractTemplateTable's handleDuplicate).
export function ContractTemplateModal({ open, template, merchantId, onClose, onSaved }: Props) {
  const [form] = Form.useForm<FormValues>()
  const { token } = theme.useToken()
  // Below the app's own md breakpoint the two columns stack, and the
  // split-scroll layout would put the preview past the bottom of a
  // non-scrolling body — so narrow windows fall back to one scroller.
  const { windowSize } = useDevTools()
  const sideBySide = windowSize.width > 768
  const appWindow = useAppWindowContainer()
  const actor = useCurrentUser()
  // Bumped on every form change so the preview beside the form redraws —
  // the doc asks for the preview to update as the template is changed.
  const [revision, setRevision] = useState(0)
  const type = Form.useWatch('type', form)
  const penaltyType = Form.useWatch('penaltyType', form)

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
        penaltyType: template.penalty.type,
        penaltyRatePercent: template.penalty.ratePercent,
        penaltyFlatFeeAmount: template.penalty.flatFeeAmount,
        penaltyGraceDays: template.penalty.graceDays,
        penaltyMaxCap: template.penalty.maxCap,
        penaltyLegalText: template.penalty.legalText,
      })
    } else {
      form.resetFields()
      form.setFieldsValue(DEFAULT_VALUES)
    }
  }, [template, open, form])

  function handleSubmit(values: FormValues) {
    if (template?.status === 'archived') return
    const saved: ContractTemplate = {
      id: template?.id ?? generateContractTemplateId(),
      merchantId: template?.merchantId ?? merchantId!,
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
      penalty: {
        type: values.penaltyType,
        ratePercent: values.penaltyType === 'fixed_rate' ? values.penaltyRatePercent : undefined,
        flatFeeAmount: values.penaltyType === 'fixed_fee' ? values.penaltyFlatFeeAmount : undefined,
        graceDays: values.penaltyGraceDays,
        maxCap: values.penaltyMaxCap,
        legalText: values.penaltyLegalText,
      },
      createdBy: template?.createdBy ?? actor.id,
      createdAt: template?.createdAt ?? new Date().toISOString(),
      updatedBy: template ? actor.id : null,
      updatedAt: template ? new Date().toISOString() : null,
    }
    onSaved(saved)
  }

  // Backstop for the archived lock the table already enforces by hiding
  // Edit — no role may edit an Archived template, so a save is refused here
  // too rather than relying on the one entry point staying gated.
  const isArchived = template?.status === 'archived'

  return (
    <Drawer
      open={open}
      title={template ? 'Edit contract template' : 'Create contract template'}
      onClose={onClose}
      destroyOnHidden
      // Full width — the form and a full-page contract side by side need
      // every pixel the app window has. index.css docks a right-placed
      // drawer 8px in from the right, so a flat 100% would overhang the
      // left edge by that much; subtracting both insets leaves the same
      // 8px gap on each side.
      width="calc(100% - 16px)"
      getContainer={appWindow ?? undefined}
      // The body itself doesn't scroll — each column below does, so the
      // form stays put while the contract is scrolled and vice versa.
      styles={{ body: sideBySide ? { padding: 0, overflow: 'hidden' } : undefined }}
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={() => form.submit()} disabled={isArchived}>Save</Button>
        </Space>
      }
    >
      <div style={sideBySide ? { display: 'flex', height: '100%' } : undefined}>
        <div style={sideBySide ? { flex: '1 1 320px', minWidth: 0, maxWidth: 380, overflowY: 'auto', height: '100%', padding: 16 } : undefined}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onValuesChange={() => setRevision(r => r + 1)}
        requiredMark={false}
        initialValues={DEFAULT_VALUES}
      >
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
                  {/* The two inputs share whatever width the column has
                      rather than taking a fixed 140px each — at 140 + 140 +
                      the remove button the row was wider than the form
                      column beside the preview, and scrolled it sideways. */}
                  {fields.map(field => (
                    <div key={field.key} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Form.Item name={[field.name, 'months']} rules={[{ required: true, message: 'Required' }]} noStyle>
                          <InputNumber placeholder="Months" min={1} addonAfter="mo" style={{ width: '100%' }} />
                        </Form.Item>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Form.Item name={[field.name, 'ratePercent']} rules={[{ required: true, message: 'Required' }]} noStyle>
                          <InputNumber placeholder="Rate" min={0} step={0.05} precision={2} addonAfter="%/mo" style={{ width: '100%' }} />
                        </Form.Item>
                      </div>
                      <Button
                        type="text"
                        danger
                        style={{ flexShrink: 0 }}
                        icon={<Trash2 size={15} strokeWidth={2.25} />}
                        onClick={() => remove(field.name)}
                      />
                    </div>
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

        <Divider style={{ margin: '8px 0 16px' }} />
        <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 4 }}>Penalty Settings</Typography.Title>
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>
          Copied onto every new contract created from this template — later edits here never affect existing contracts.
        </Typography.Text>

        <Form.Item label="Penalty Type" name="penaltyType" rules={[{ required: true, message: 'Required' }]}>
          <Radio.Group optionType="button" buttonStyle="solid" options={[
            { label: 'Fixed Rate (%/mo)', value: 'fixed_rate' },
            { label: 'Fixed Fee (THB/mo)', value: 'fixed_fee' },
          ]} />
        </Form.Item>

        {penaltyType === 'fixed_rate' && (
          <Form.Item label="Penalty Rate (%/mo)" name="penaltyRatePercent" rules={[{ required: true, message: 'Required' }]}>
            <InputNumber style={{ width: '100%' }} min={0} step={0.1} precision={2} addonAfter="%/mo" />
          </Form.Item>
        )}
        {penaltyType === 'fixed_fee' && (
          <Form.Item label="Penalty Flat Fee (฿/mo)" name="penaltyFlatFeeAmount" rules={[{ required: true, message: 'Required' }]}>
            <InputNumber style={{ width: '100%' }} min={0} step={50} addonBefore="฿" addonAfter="/mo" />
          </Form.Item>
        )}

        <Space.Compact block>
          <Form.Item label="Grace Period (days)" name="penaltyGraceDays" rules={[{ required: true, message: 'Required' }]} style={{ width: '50%' }}>
            <InputNumber style={{ width: '100%' }} min={0} max={30} addonAfter="days" />
          </Form.Item>
          <Form.Item label="Max Penalty Cap (฿)" name="penaltyMaxCap" rules={[{ required: true, message: 'Required' }]} style={{ width: '50%' }}>
            <InputNumber style={{ width: '100%' }} min={0} step={500} addonBefore="฿" />
          </Form.Item>
        </Space.Compact>

        <Form.Item label="Penalty Legal Text" name="penaltyLegalText" rules={[{ required: true, message: 'Required' }]}>
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
        </div>

        {/* Live preview. `revision` is only here to re-run this render on
            each keystroke; the values themselves come straight from the
            form instance. */}
        <div
          key={revision}
          style={sideBySide
            ? {
              flex: '2 1 520px',
              minWidth: 0,
              overflowY: 'auto',
              height: '100%',
              // No padding here — ContractDocument brings its own canvas.
              borderLeft: `0.5px solid ${token.colorBorderSecondary}`,
            }
            : { marginTop: 24 }}
        >
          <ContractTemplatePreview
            merchantId={template?.merchantId ?? merchantId}
            values={form.getFieldsValue(true)}
          />
        </div>
      </div>
    </Drawer>
  )
}
