import { Table, Tag, Empty } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { PaymentRecord } from '../../../types/installment'

const formatter = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 })

const METHOD_COLOR: Record<string, string> = {
  cash: 'green',
  transfer: 'blue',
  card: 'purple',
}

const columns: ColumnsType<PaymentRecord> = [
  { title: 'Receipt No.', dataIndex: 'receiptNumber', key: 'receiptNumber' },
  { title: 'Payment Date', dataIndex: 'paymentDate', key: 'paymentDate' },
  {
    title: 'Amount',
    dataIndex: 'amount',
    key: 'amount',
    align: 'right',
    render: val => formatter.format(val),
  },
  {
    title: 'Method',
    dataIndex: 'method',
    key: 'method',
    render: val => <Tag color={METHOD_COLOR[val]}>{val.toUpperCase()}</Tag>,
  },
  { title: 'Received By', dataIndex: 'receivedBy', key: 'receivedBy' },
  { title: 'Note', dataIndex: 'note', key: 'note', render: val => val || '—' },
]

interface Props {
  payments: PaymentRecord[]
}

export function PaymentHistoryTab({ payments }: Props) {
  if (payments.length === 0) return <Empty description="No payment records" />
  return <Table rowKey="receiptNumber" columns={columns} dataSource={payments} pagination={false} bordered />
}
