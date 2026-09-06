import { useState } from 'react'
import { App, Button, ConfigProvider, DatePicker, Drawer, Form, Input, InputNumber, Space, Table, Typography, theme } from 'antd'
import dayjs from 'dayjs'
import { CalendarClock, Wallet } from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'
import type { Contract, ScheduleItem } from '../../../types/contract'
import type { AuthUser } from '../../../types/installment'
import { CurrencyDisplay } from '../../../components/CurrencyDisplay'
import { TableEmptyState } from '../../../components/TableEmptyState'
import { PhotoUpload } from '../../../components/PhotoUpload'
import { Select } from '../../../components/AppSelect'
import { useAppWindowContainer } from '../../../contexts/AppWindowContext'
import { ScheduleStatusTag } from '../components/ScheduleStatusTag'
import { canRecordPayment } from '../../../constants/roles'
import { getNextDue, recordPayment } from '../../../utils/contract'

interface Props {
  contract: Contract
  actor: AuthUser
  onChanged: () => void
}

interface PaymentFormValues {
  amount: number
  method: 'cash' | 'transfer'
  paymentDate: dayjs.Dayjs
  note?: string
  slipPhotos: string[]
}

// Record Payment — per the doc, logs a payment against the contract's
// current Due/Overdue item (there's only ever one at a time; see
// getNextDue). Full (or more) marks it Paid/Paid (Late) with any excess
// carrying over to the next item(s); a partial amount is just logged,
// leaving the item's own status alone — recalculateSchedule (called by
// recordPayment) is what actually works out which of those happened, not
// this component.
export function ScheduleTab({ contract, actor, onChanged }: Props) {
  const { token } = theme.useToken()
  const { message } = App.useApp()
  const appWindow = useAppWindowContainer()
  const [form] = Form.useForm<PaymentFormValues>()
  const [open, setOpen] = useState(false)

  const dueItem = getNextDue(contract)
  const canRecord = canRecordPayment(actor, contract) && !!dueItem

  function openModal() {
    form.resetFields()
    form.setFieldsValue({
      amount: dueItem?.amount,
      method: 'transfer',
      paymentDate: dayjs(),
    })
    setOpen(true)
  }

  function handleSubmit(values: PaymentFormValues) {
    recordPayment(contract, {
      amount: values.amount,
      method: values.method,
      paymentDate: values.paymentDate.format('YYYY-MM-DD'),
      note: values.note,
      slipPhotos: values.slipPhotos,
    }, actor.id)
    setOpen(false)
    message.success('Payment recorded')
    onChanged()
  }

  const columns: ColumnsType<ScheduleItem> = [
    { title: <span style={{ color: token.colorText }}>#</span>, dataIndex: 'period', key: 'period', width: 50 },
    { title: 'Item', dataIndex: 'label', key: 'label' },
    { title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'right', render: (val: number) => <CurrencyDisplay amount={val} /> },
    { title: 'Paid Date', dataIndex: 'paidDate', key: 'paidDate', render: (val: string | null) => val ?? <span style={{ color: token.colorTextDisabled }}>—</span> },
    { title: 'Status', key: 'status', render: (_, s) => <ScheduleStatusTag status={s.status} /> },
  ]

  return (
    <div className="ifix-table-panel" style={{ marginBottom: 16 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        paddingLeft: 16,
        paddingRight: canRecord ? 8 : 16,
        boxShadow: `inset 0 -0.5px 0 0 ${token.colorBorderSecondary}`,
      }}>
        <Typography.Text strong style={{ fontSize: 15 }}>Payment Schedule</Typography.Text>
        {canRecord && (
          <Button icon={<Wallet size={16} strokeWidth={2.25} />} onClick={openModal}>Record Payment</Button>
        )}
      </div>

      <div style={{ padding: 16 }}>
        <ConfigProvider theme={{ components: { Table: { colorText: token.colorTextTertiary, headerColor: token.colorTextTertiary } } }}>
          <div className="ifix-panel-table" style={{ margin: '0 -16px' }}>
            <Table
              rowKey="period"
              columns={columns}
              dataSource={contract.schedule}
              size="small"
              pagination={false}
              // Per the doc: "Overdue (highlighted)" — the item past its
              // due date without full payment gets a tinted row, same
              // functional-error background used elsewhere for this kind
              // of "needs attention" state.
              rowClassName={s => (s.status === 'overdue' ? 'ifix-row-overdue' : '')}
              locale={{
                emptyText: (
                  <TableEmptyState
                    icon={<CalendarClock size={22} strokeWidth={2.25} />}
                    title="No schedule yet"
                    description="The payment schedule is generated once the contract is activated."
                  />
                ),
              }}
            />
          </div>
        </ConfigProvider>
      </div>

      <Drawer
        title="Record payment"
        open={open}
        onClose={() => setOpen(false)}
        destroyOnHidden
        width={420}
        getContainer={appWindow ?? undefined}
        footer={
          <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={() => form.validateFields().then(handleSubmit)}>Record Payment</Button>
          </Space>
        }
      >
        {dueItem && (
          <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            Recording against <strong>{dueItem.label}</strong>, due {dueItem.dueDate} (<CurrencyDisplay amount={dueItem.amount} />).
          </Typography.Text>
        )}
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item label="Amount (฿)" name="amount" rules={[{ required: true, message: 'Required' }]}>
            <InputNumber style={{ width: '100%' }} min={1} step={100} addonBefore="฿" />
          </Form.Item>
          <Form.Item label="Payment Method" name="method" rules={[{ required: true, message: 'Required' }]}>
            <Select options={[{ value: 'cash', label: 'Cash' }, { value: 'transfer', label: 'Bank Transfer' }]} />
          </Form.Item>
          <Form.Item label="Date Paid" name="paymentDate" rules={[{ required: true, message: 'Required' }]}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item label="Payment Slip Photo" name="slipPhotos" rules={[{ required: true, message: 'Required' }]}>
            <PhotoUpload />
          </Form.Item>
          <Form.Item label="Note" name="note">
            <Input.TextArea rows={2} placeholder="Optional" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}
