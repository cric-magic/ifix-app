import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { ScheduleItem } from '../../../types/installment'
import { StatusBadge } from '../../../components/StatusBadge'

const formatter = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 })

const columns: ColumnsType<ScheduleItem> = [
  { title: '#', dataIndex: 'period', key: 'period', width: 50 },
  { title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate' },
  {
    title: 'Principal',
    dataIndex: 'principal',
    key: 'principal',
    align: 'right',
    render: val => formatter.format(val),
  },
  {
    title: 'Interest',
    dataIndex: 'interest',
    key: 'interest',
    align: 'right',
    render: val => formatter.format(val),
  },
  {
    title: 'Total',
    dataIndex: 'totalInstallment',
    key: 'totalInstallment',
    align: 'right',
    render: val => <strong>{formatter.format(val)}</strong>,
  },
  {
    title: 'Paid Date',
    dataIndex: 'paidDate',
    key: 'paidDate',
    render: val => val ?? '—',
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: val => <StatusBadge status={val} />,
  },
]

interface Props {
  schedule: ScheduleItem[]
}

export function InstallmentScheduleTab({ schedule }: Props) {
  return (
    <Table
      rowKey="period"
      columns={columns}
      dataSource={schedule}
      pagination={false}
      bordered
      rowClassName={record =>
        record.status === 'overdue'
          ? 'row-overdue'
          : record.status === 'paid'
          ? 'row-paid'
          : ''
      }
    />
  )
}
