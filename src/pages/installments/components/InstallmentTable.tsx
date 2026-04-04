import { Table, Button, Space } from 'antd'
import { EyeOutlined, EditOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import type { InstallmentRecord } from '../../../types/installment'
import { StatusBadge } from '../../../components/StatusBadge'
import { CurrencyDisplay } from '../../../components/CurrencyDisplay'

const formatter = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 })

interface Props {
  records: InstallmentRecord[]
  canEdit: (record: InstallmentRecord) => boolean
}

export function InstallmentTable({ records, canEdit }: Props) {
  const navigate = useNavigate()

  const columns: ColumnsType<InstallmentRecord> = [
    {
      title: 'Invoice No.',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      render: (val, record) => (
        <a onClick={() => navigate(`/installments/${record.id}`)}>{val}</a>
      ),
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: 'Branch',
      dataIndex: 'branch',
      key: 'branch',
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Space size={4}>
          <StatusBadge status={record.contractStatus} />
          <StatusBadge status={record.paymentStatus} />
        </Space>
      ),
    },
    {
      title: 'Paid',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      align: 'right',
      render: val => <span style={{ color: '#52c41a' }}>{formatter.format(val)}</span>,
    },
    {
      title: 'Due',
      dataIndex: 'dueAmount',
      key: 'dueAmount',
      align: 'right',
      render: val => val > 0 ? <span style={{ color: '#fa8c16' }}>{formatter.format(val)}</span> : <span style={{ color: '#bfbfbf' }}>—</span>,
    },
    {
      title: 'Overdue',
      dataIndex: 'overdueAmount',
      key: 'overdueAmount',
      align: 'right',
      render: val => val > 0 ? <span style={{ color: '#ff4d4f' }}>{formatter.format(val)}</span> : <span style={{ color: '#bfbfbf' }}>—</span>,
    },
    {
      title: 'Remaining',
      dataIndex: 'remainingBalance',
      key: 'remainingBalance',
      align: 'right',
      render: val => <CurrencyDisplay amount={val} />,
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Space size={4}>
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => navigate(`/installments/${record.id}`)}
          />
          {canEdit(record) && (
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => navigate(`/installments/${record.id}?edit=true`)}
            />
          )}
        </Space>
      ),
    },
  ]

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={records}
      pagination={{ pageSize: 10, showSizeChanger: false }}
      onRow={record => ({
        onClick: () => navigate(`/installments/${record.id}`),
        style: { cursor: 'pointer' },
      })}
      rowClassName={record =>
        record.paymentStatus === 'overdue' ? 'row-overdue' : ''
      }
    />
  )
}
