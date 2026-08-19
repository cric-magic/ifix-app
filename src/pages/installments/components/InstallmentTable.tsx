import { ConfigProvider, Table, Button, Space, theme } from 'antd'
import { Eye, Pencil, ChevronLeft, ChevronRight } from 'lucide-react'
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
  const { token } = theme.useToken()

  const columns: ColumnsType<InstallmentRecord> = [
    {
      title: <span style={{ color: token.colorText }}>Invoice No.</span>,
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      fixed: 'left',
      render: (val, record) => (
        <a onClick={() => navigate(`/installments/${record.id}`)} style={{ color: token.colorText }}>{val}</a>
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
      fixed: 'right',
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
      render: val => <span>{formatter.format(val)}</span>,
    },
    {
      title: 'Due',
      dataIndex: 'dueAmount',
      key: 'dueAmount',
      align: 'right',
      render: val => val > 0 ? formatter.format(val) : <span style={{ color: token.colorTextDisabled }}>—</span>,
    },
    {
      title: 'Overdue',
      dataIndex: 'overdueAmount',
      key: 'overdueAmount',
      align: 'right',
      render: val => val > 0 ? formatter.format(val) : <span style={{ color: token.colorTextDisabled }}>—</span>,
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
      fixed: 'right',
      align: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button
            type="text"
            icon={<Eye size={16} strokeWidth={2.25} />}
            size="small"
            onClick={() => navigate(`/installments/${record.id}`)}
          />
          {canEdit(record) && (
            <Button
              type="text"
              icon={<Pencil size={16} strokeWidth={2.25} />}
              size="small"
              onClick={() => navigate(`/installments/${record.id}?edit=true`)}
            />
          )}
        </Space>
      ),
    },
  ]

  return (
    <ConfigProvider theme={{
      components: {
        Table: {
          colorText: token.colorTextTertiary,
          headerColor: token.colorTextTertiary,
        },
      },
    }}>
      <div className="ifix-table-panel">
        <div style={{ padding: 16 }}>
          <div className="ifix-panel-table" style={{ margin: '0 -16px' }}>
            <Table
              rowKey="id"
              columns={columns}
              dataSource={records}
              scroll={{ x: 'max-content' }}
              pagination={{
                pageSize: 10,
                size: 'small',
                showSizeChanger: false,
                prevIcon: <ChevronLeft size={14} strokeWidth={2.25} />,
                nextIcon: <ChevronRight size={14} strokeWidth={2.25} />,
                showTotal: (total, range) => (
                  <span style={{ color: token.colorTextTertiary }}>
                    {range[0]}–{range[1]} of {total}
                  </span>
                ),
              }}
              onRow={record => ({
                onClick: () => navigate(`/installments/${record.id}`),
                style: { cursor: 'pointer' },
              })}
            />
          </div>
        </div>
      </div>
    </ConfigProvider>
  )
}
