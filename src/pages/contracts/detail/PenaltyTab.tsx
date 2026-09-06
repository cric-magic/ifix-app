import { useState } from 'react'
import { App, Button, Drawer, Dropdown, Form, Input, InputNumber, Space, Table, Typography, theme } from 'antd'
import { AlertTriangle, MoreHorizontal, Receipt, ShieldOff } from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'
import type { Contract, CollectionFeeRecord, PenaltyAdjustment } from '../../../types/contract'
import type { AuthUser } from '../../../types/installment'
import { CurrencyDisplay } from '../../../components/CurrencyDisplay'
import { TableEmptyState } from '../../../components/TableEmptyState'
import { useAppWindowContainer } from '../../../contexts/AppWindowContext'
import { canAdjustPenalty, canManageCollectionFee } from '../../../constants/roles'
import { addCollectionFee, addPenaltyDiscount, voidCollectionFee, voidPenaltyDiscount, waiveCollectionFee } from '../../../utils/contract'
import { MOCK_MERCHANTS } from '../../../constants/mockMerchants'

interface Props {
  contract: Contract
  actor: AuthUser
  onChanged: () => void
}

// Penalty (Phase 2, per the Penalty doc rework) — the accrued/owed amounts
// here are pure display of what recalculateSchedule already derived; this
// component only ever adds new records (a discount, a collection fee) or
// marks an existing one voided/waived, same "mutate + recalculate" shape
// as the Payment module's Record/Void.
export function PenaltyTab({ contract, actor, onChanged }: Props) {
  const { token } = theme.useToken()
  const { message } = App.useApp()
  const appWindow = useAppWindowContainer()
  const merchant = MOCK_MERCHANTS.find(m => m.id === contract.merchantId)

  const canAdjust = canAdjustPenalty(actor, contract)
  const canManageFee = canManageCollectionFee(actor, contract)

  const [discountOpen, setDiscountOpen] = useState(false)
  const [discountForm] = Form.useForm<{ amount: number; reason: string }>()
  const [discountVoidTarget, setDiscountVoidTarget] = useState<PenaltyAdjustment | null>(null)
  const [discountVoidForm] = Form.useForm<{ reason: string }>()

  const [feeOpen, setFeeOpen] = useState(false)
  const [feeForm] = Form.useForm<{ amount: number; reason?: string }>()
  const [feeWaiveTarget, setFeeWaiveTarget] = useState<CollectionFeeRecord | null>(null)
  const [feeWaiveForm] = Form.useForm<{ reason: string }>()
  const [feeVoidTarget, setFeeVoidTarget] = useState<CollectionFeeRecord | null>(null)
  const [feeVoidForm] = Form.useForm<{ reason: string }>()

  function openDiscountModal() {
    discountForm.resetFields()
    setDiscountOpen(true)
  }
  function handleAddDiscount(values: { amount: number; reason: string }) {
    addPenaltyDiscount(contract, values.amount, values.reason, actor.id)
    setDiscountOpen(false)
    message.success('Penalty discount applied')
    onChanged()
  }
  function handleVoidDiscount(values: { reason: string }) {
    if (!discountVoidTarget) return
    voidPenaltyDiscount(contract, discountVoidTarget.id, values.reason, actor.id)
    setDiscountVoidTarget(null)
    message.success('Discount voided')
    onChanged()
  }

  function openFeeModal() {
    feeForm.resetFields()
    feeForm.setFieldsValue({ amount: merchant?.collectionFeeAmount })
    setFeeOpen(true)
  }
  function handleAddFee(values: { amount: number; reason?: string }) {
    addCollectionFee(contract, values.amount, values.reason, actor.id)
    setFeeOpen(false)
    message.success('Collection fee added')
    onChanged()
  }
  function handleWaiveFee(values: { reason: string }) {
    if (!feeWaiveTarget) return
    waiveCollectionFee(contract, feeWaiveTarget.id, values.reason, actor.id)
    setFeeWaiveTarget(null)
    message.success('Collection fee waived')
    onChanged()
  }
  function handleVoidFee(values: { reason: string }) {
    if (!feeVoidTarget) return
    voidCollectionFee(contract, feeVoidTarget.id, values.reason, actor.id)
    setFeeVoidTarget(null)
    message.success('Collection fee voided')
    onChanged()
  }

  const discountColumns: ColumnsType<PenaltyAdjustment> = [
    { title: 'Date', dataIndex: 'createdAt', key: 'createdAt', render: (v: string) => v.slice(0, 10) },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'right', render: (v: number, r) => (
      <span style={r.voided ? { textDecoration: 'line-through', color: token.colorTextDisabled } : undefined}>
        <CurrencyDisplay amount={v} />
      </span>
    ) },
    { title: 'Reason', dataIndex: 'reason', key: 'reason', render: (v: string, r) => r.voided ? <span style={{ color: token.colorError }}>Voided — {r.voidReason}</span> : v },
    { title: 'By', dataIndex: 'createdBy', key: 'createdBy' },
    ...(canAdjust ? [{
      title: '', key: 'actions', width: 40,
      render: (_: unknown, r: PenaltyAdjustment) => r.voided ? null : (
        <Button type="text" size="small" danger onClick={() => setDiscountVoidTarget(r)}>Void</Button>
      ),
    }] : []),
  ]

  const feeColumns: ColumnsType<CollectionFeeRecord> = [
    { title: 'Date', dataIndex: 'addedAt', key: 'addedAt', render: (v: string) => v.slice(0, 10) },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'right', render: (v: number, r) => (
      <span style={r.voided || r.waived ? { textDecoration: 'line-through', color: token.colorTextDisabled } : undefined}>
        <CurrencyDisplay amount={v} />
      </span>
    ) },
    { title: 'Reason', dataIndex: 'reason', key: 'reason', render: (v: string | undefined, r) => {
      if (r.voided) return <span style={{ color: token.colorError }}>Voided — {r.voidReason}</span>
      if (r.waived) return <span style={{ color: token.colorTextTertiary }}>Waived — {r.waiveReason}</span>
      return v || <span style={{ color: token.colorTextDisabled }}>—</span>
    } },
    { title: 'By', dataIndex: 'addedBy', key: 'addedBy' },
    ...(canManageFee ? [{
      title: '', key: 'actions', width: 40,
      render: (_: unknown, r: CollectionFeeRecord) => (r.voided || r.waived) ? null : (
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              { key: 'waive', icon: <ShieldOff size={15} strokeWidth={2.25} />, label: 'Waive' },
              { key: 'void', danger: true, icon: <AlertTriangle size={15} strokeWidth={2.25} />, label: 'Void' },
            ],
            onClick: ({ key }) => {
              if (key === 'waive') setFeeWaiveTarget(r)
              if (key === 'void') setFeeVoidTarget(r)
            },
          }}
        >
          <Button type="text" size="small" icon={<MoreHorizontal size={16} strokeWidth={2.25} />} />
        </Dropdown>
      ),
    }] : []),
  ]

  return (
    <div style={{ marginBottom: 16 }}>
      <div className="ifix-table-panel" style={{ marginBottom: 16 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56,
          paddingLeft: 16, paddingRight: canAdjust ? 8 : 16,
          boxShadow: `inset 0 -0.5px 0 0 ${token.colorBorderSecondary}`,
        }}>
          <Typography.Text strong style={{ fontSize: 15 }}>Penalty</Typography.Text>
          {canAdjust && <Button icon={<AlertTriangle size={16} strokeWidth={2.25} />} onClick={openDiscountModal}>Add Discount</Button>}
        </div>
        <div style={{ padding: 16 }}>
          <Space size={32} style={{ marginBottom: 16 }}>
            <div>
              <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Charged to date</Typography.Text>
              <Typography.Text strong style={{ fontSize: 18 }}><CurrencyDisplay amount={contract.penaltyChargedTotal} /></Typography.Text>
            </div>
            <div>
              <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Balance owed</Typography.Text>
              <Typography.Text strong style={{ fontSize: 18, color: contract.penaltyBalance > 0 ? token.colorError : undefined }}>
                <CurrencyDisplay amount={contract.penaltyBalance} />
              </Typography.Text>
            </div>
            <div>
              <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Max cap</Typography.Text>
              <Typography.Text style={{ fontSize: 18 }}><CurrencyDisplay amount={contract.template.penalty.maxCap} /></Typography.Text>
            </div>
          </Space>
          <div className="ifix-panel-table" style={{ margin: '0 -16px' }}>
            <Table
              rowKey="id" columns={discountColumns} dataSource={contract.penaltyAdjustments} size="small" pagination={false}
              locale={{ emptyText: <TableEmptyState icon={<AlertTriangle size={22} strokeWidth={2.25} />} title="No discounts yet" description="Penalty discounts applied to this contract will show up here." /> }}
            />
          </div>
        </div>
      </div>

      <div className="ifix-table-panel">
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56,
          paddingLeft: 16, paddingRight: canManageFee ? 8 : 16,
          boxShadow: `inset 0 -0.5px 0 0 ${token.colorBorderSecondary}`,
        }}>
          <Typography.Text strong style={{ fontSize: 15 }}>Collection Fees</Typography.Text>
          {canManageFee && merchant?.collectionFeeEnabled && <Button icon={<Receipt size={16} strokeWidth={2.25} />} onClick={openFeeModal}>Add Fee</Button>}
        </div>
        <div style={{ padding: 16 }}>
          <Space size={32} style={{ marginBottom: 16 }}>
            <div>
              <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Balance owed</Typography.Text>
              <Typography.Text strong style={{ fontSize: 18, color: contract.collectionFeeBalance > 0 ? token.colorError : undefined }}>
                <CurrencyDisplay amount={contract.collectionFeeBalance} />
              </Typography.Text>
            </div>
          </Space>
          {!merchant?.collectionFeeEnabled && (
            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>
              Collection Fees are disabled for this merchant — see Settings → Account.
            </Typography.Text>
          )}
          <div className="ifix-panel-table" style={{ margin: '0 -16px' }}>
            <Table
              rowKey="id" columns={feeColumns} dataSource={contract.collectionFees} size="small" pagination={false}
              locale={{ emptyText: <TableEmptyState icon={<Receipt size={22} strokeWidth={2.25} />} title="No collection fees yet" description="Collection fees added to this contract will show up here." /> }}
            />
          </div>
        </div>
      </div>

      <Drawer
        title="Add penalty discount" open={discountOpen} onClose={() => setDiscountOpen(false)}
        destroyOnHidden width={420} getContainer={appWindow ?? undefined}
        footer={
          <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => setDiscountOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={() => discountForm.validateFields().then(handleAddDiscount)}>Apply Discount</Button>
          </Space>
        }
      >
        <Form form={discountForm} layout="vertical" requiredMark={false}>
          <Form.Item label="Discount Amount (฿)" name="amount" rules={[{ required: true, message: 'Required' }]}>
            <InputNumber style={{ width: '100%' }} min={1} step={100} addonBefore="฿" />
          </Form.Item>
          <Form.Item label="Reason" name="reason" rules={[{ required: true, message: 'A reason is required' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title="Add collection fee" open={feeOpen} onClose={() => setFeeOpen(false)}
        destroyOnHidden width={420} getContainer={appWindow ?? undefined}
        footer={
          <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => setFeeOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={() => feeForm.validateFields().then(handleAddFee)}>Add Fee</Button>
          </Space>
        }
      >
        <Form form={feeForm} layout="vertical" requiredMark={false}>
          <Form.Item label="Amount (฿)" name="amount" rules={[{ required: true, message: 'Required' }]}>
            <InputNumber style={{ width: '100%' }} min={1} step={50} addonBefore="฿" />
          </Form.Item>
          <Form.Item label="Note" name="reason">
            <Input.TextArea rows={2} placeholder="Optional" />
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title="Void this discount?" open={!!discountVoidTarget} onClose={() => setDiscountVoidTarget(null)}
        destroyOnHidden width={420} getContainer={appWindow ?? undefined}
        footer={
          <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => setDiscountVoidTarget(null)}>Cancel</Button>
            <Button danger type="primary" onClick={() => discountVoidForm.validateFields().then(handleVoidDiscount)}>Void</Button>
          </Space>
        }
      >
        <Form form={discountVoidForm} layout="vertical" requiredMark={false}>
          <Form.Item label="Void reason" name="reason" rules={[{ required: true, message: 'A reason is required to void a discount.' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title="Waive this collection fee?" open={!!feeWaiveTarget} onClose={() => setFeeWaiveTarget(null)}
        destroyOnHidden width={420} getContainer={appWindow ?? undefined}
        footer={
          <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => setFeeWaiveTarget(null)}>Cancel</Button>
            <Button type="primary" onClick={() => feeWaiveForm.validateFields().then(handleWaiveFee)}>Waive</Button>
          </Space>
        }
      >
        <Form form={feeWaiveForm} layout="vertical" requiredMark={false}>
          <Form.Item label="Reason" name="reason" rules={[{ required: true, message: 'A reason is required to waive a fee.' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title="Void this collection fee?" open={!!feeVoidTarget} onClose={() => setFeeVoidTarget(null)}
        destroyOnHidden width={420} getContainer={appWindow ?? undefined}
        footer={
          <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => setFeeVoidTarget(null)}>Cancel</Button>
            <Button danger type="primary" onClick={() => feeVoidForm.validateFields().then(handleVoidFee)}>Void</Button>
          </Space>
        }
      >
        <Form form={feeVoidForm} layout="vertical" requiredMark={false}>
          <Form.Item label="Void reason" name="reason" rules={[{ required: true, message: 'A reason is required to void a fee.' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}
