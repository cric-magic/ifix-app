import { useState } from 'react'
import { App, Button, ConfigProvider, Dropdown, Form, Input, Modal, Table, Typography, theme } from 'antd'
import { Image as ImageIcon, MoreHorizontal, Receipt, Ban } from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'
import type { Contract, ContractPaymentRecord } from '../../../types/contract'
import type { AuthUser } from '../../../types/installment'
import { CurrencyDisplay } from '../../../components/CurrencyDisplay'
import { TableEmptyState } from '../../../components/TableEmptyState'
import { DotTag } from '../../../components/DotTag'
import { useIconColors } from '../../../constants/iconColors'
import { canVoidPaymentRecord } from '../../../constants/roles'
import { voidPaymentRecord } from '../../../utils/contract'

const METHOD_LABELS: Record<ContractPaymentRecord['method'], string> = {
  cash: 'Cash',
  transfer: 'Transfer',
  card: 'Card',
}

interface Props {
  contract: Contract
  actor: AuthUser
  onChanged: () => void
}

// Void Payment Record — per the doc's Permission Matrix (BM/Admin/Owner
// only, not Staff; locked once Settled — see canVoidPaymentRecord). Kept
// in the list rather than removed (the doc's own audit requirement: "all
// edits and deletions must be auditable"), struck through with its reason
// shown instead. The down payment (period 0) isn't voidable here — it's
// what activates the contract in the first place, undoing it is a
// bigger operation than this action is meant for.
export function PaymentHistoryTab({ contract, actor, onChanged }: Props) {
  const { token } = theme.useToken()
  const { message } = App.useApp()
  const iconColors = useIconColors()
  const [voidTarget, setVoidTarget] = useState<ContractPaymentRecord | null>(null)
  const [voidForm] = Form.useForm<{ reason: string }>()

  const canVoid = canVoidPaymentRecord(actor, contract)

  function handleVoid(values: { reason: string }) {
    if (!voidTarget) return
    voidPaymentRecord(contract, voidTarget.id, values.reason, actor.id)
    setVoidTarget(null)
    voidForm.resetFields()
    message.success('Payment record voided')
    onChanged()
  }

  const columns: ColumnsType<ContractPaymentRecord> = [
    { title: <span style={{ color: token.colorText }}>#</span>, dataIndex: 'period', key: 'period', width: 50 },
    { title: 'Payment Date', dataIndex: 'paymentDate', key: 'paymentDate' },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (val: number, record) => (
        <span style={record.voided ? { textDecoration: 'line-through', color: token.colorTextDisabled } : undefined}>
          <CurrencyDisplay amount={val} />
        </span>
      ),
    },
    { title: 'Method', dataIndex: 'method', key: 'method', render: (val: ContractPaymentRecord['method']) => <DotTag dotColor={token.colorTextTertiary}>{METHOD_LABELS[val]}</DotTag> },
    {
      title: 'Slip',
      dataIndex: 'slipPhotos',
      key: 'slipPhotos',
      render: (val?: string[]) => val?.length
        ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: token.colorTextSecondary }}><ImageIcon size={14} strokeWidth={2.25} color={iconColors.secondary} /> {val.length}</span>
        : <span style={{ color: token.colorTextDisabled }}>—</span>,
    },
    { title: 'Received By', dataIndex: 'receivedBy', key: 'receivedBy' },
    {
      title: 'Note',
      dataIndex: 'note',
      key: 'note',
      render: (val: string | undefined, record) => record.voided
        ? <span style={{ color: token.colorError }}>Voided — {record.voidReason}</span>
        : (val || <span style={{ color: token.colorTextDisabled }}>—</span>),
    },
    ...(canVoid ? [{
      title: '',
      key: 'actions',
      width: 40,
      render: (_: unknown, record: ContractPaymentRecord) => (
        record.voided || record.period === 0 ? null : (
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                { key: 'void', danger: true, icon: <Ban size={15} strokeWidth={2.25} />, label: 'Void' },
              ],
              onClick: ({ key }) => {
                if (key === 'void') {
                  setVoidTarget(record)
                }
              },
            }}
          >
            <Button type="text" size="small" icon={<MoreHorizontal size={16} strokeWidth={2.25} />} />
          </Dropdown>
        )
      ),
    }] : []),
  ]

  return (
    <div className="ifix-table-panel" style={{ marginBottom: 16 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        height: 56,
        padding: '0 16px',
        boxShadow: `inset 0 -0.5px 0 0 ${token.colorBorderSecondary}`,
      }}>
        <Typography.Text strong style={{ fontSize: 15 }}>Payment History</Typography.Text>
      </div>

      <div style={{ padding: 16 }}>
        <ConfigProvider theme={{ components: { Table: { colorText: token.colorTextTertiary, headerColor: token.colorTextTertiary } } }}>
          <div className="ifix-panel-table" style={{ margin: '0 -16px' }}>
            <Table
              rowKey="id"
              columns={columns}
              dataSource={contract.payments}
              size="small"
              pagination={false}
              locale={{
                emptyText: (
                  <TableEmptyState
                    icon={<Receipt size={22} strokeWidth={2.25} />}
                    title="No payments yet"
                    description="Payments recorded against this contract will show up here."
                  />
                ),
              }}
            />
          </div>
        </ConfigProvider>
      </div>

      <Modal
        title="Void this payment record?"
        open={!!voidTarget}
        onCancel={() => setVoidTarget(null)}
        okText="Void"
        okButtonProps={{ danger: true }}
        onOk={() => voidForm.validateFields().then(handleVoid)}
        destroyOnHidden
      >
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          The schedule item this payment covered will return to Due/Overdue. This can't be undone.
        </Typography.Text>
        <Form form={voidForm} layout="vertical">
          <Form.Item label="Void reason" name="reason" rules={[{ required: true, message: 'A reason is required to void a payment record.' }]}>
            <Input.TextArea rows={3} placeholder="e.g. Duplicate entry — customer paid via a different record." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
