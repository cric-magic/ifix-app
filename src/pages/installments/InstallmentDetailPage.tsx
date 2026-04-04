import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Card, Result, Space, Tabs, message } from 'antd'
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons'
import { MOCK_INSTALLMENTS, MOCK_CUSTOMERS, MOCK_SCHEDULES, MOCK_PAYMENTS } from '../../constants/mockData'
import { canEditInstallment } from '../../constants/roles'
import { useAuth } from '../../contexts/AuthContext'
import { PageHeader } from '../../components/PageHeader'
import { StatusBadge } from '../../components/StatusBadge'
import { OverviewTab } from './detail/OverviewTab'
import { CustomerTab } from './detail/CustomerTab'
import { PaymentHistoryTab } from './detail/PaymentHistoryTab'
import { InstallmentScheduleTab } from './detail/InstallmentScheduleTab'
import { ContractPreviewTab } from './detail/ContractPreviewTab'

export function InstallmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)

  const record = MOCK_INSTALLMENTS.find(r => r.id === id)

  if (!record) {
    return (
      <Result
        status="404"
        title="Contract not found"
        extra={<Button onClick={() => navigate('/installments')}>Back to list</Button>}
      />
    )
  }

  const customer = MOCK_CUSTOMERS[record.customerId]
  const schedule = MOCK_SCHEDULES[record.id] ?? []
  const payments = MOCK_PAYMENTS[record.id] ?? []
  const canEdit = canEditInstallment(user, record)

  function handleSave() {
    message.success('Changes saved')
    setIsEditing(false)
  }

  const actions = isEditing ? (
    <Space>
      <Button icon={<CloseOutlined />} onClick={() => setIsEditing(false)}>Cancel</Button>
      <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>Save</Button>
    </Space>
  ) : canEdit ? (
    <Button icon={<EditOutlined />} onClick={() => setIsEditing(true)}>Edit</Button>
  ) : null

  return (
    <div>
      <PageHeader
        showBack
        title={
          <Space size={8}>
            {record.invoiceNumber}
            <StatusBadge status={record.contractStatus} />
            <StatusBadge status={record.paymentStatus} />
          </Space>
        }
        subtitle={`${record.contractNumber} · ${record.branch}`}
        actions={actions}
      />

      <Card>
        <Tabs
          type="card"
          items={[
            {
              key: 'overview',
              label: 'Overview',
              children: <OverviewTab record={record} />,
            },
            {
              key: 'customer',
              label: 'Customer',
              children: <CustomerTab customer={customer} isEditing={isEditing} />,
            },
            {
              key: 'payment-history',
              label: 'Payment & Receipt History',
              children: <PaymentHistoryTab payments={payments} />,
            },
            {
              key: 'schedule',
              label: 'Installment Schedule',
              children: <InstallmentScheduleTab schedule={schedule} />,
            },
            {
              key: 'contract',
              label: 'Contract Preview',
              children: <ContractPreviewTab record={record} customer={customer} />,
            },
          ]}
        />
      </Card>
    </div>
  )
}
