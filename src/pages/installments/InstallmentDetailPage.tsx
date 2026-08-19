import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Result, Space, Tag, Tabs, message, theme } from 'antd'
import { Pencil, Save, X, ArrowLeft } from 'lucide-react'
import { MOCK_INSTALLMENTS, MOCK_CUSTOMERS, MOCK_SCHEDULES, MOCK_PAYMENTS } from '../../constants/mockData'
import { canEditInstallment } from '../../constants/roles'
import { useCurrentUser } from '../../contexts/AuthContext'
import { StatusBadge } from '../../components/StatusBadge'
import { OverviewTab } from './detail/OverviewTab'
import { CustomerTab } from './detail/CustomerTab'
import { PaymentHistoryTab } from './detail/PaymentHistoryTab'
import { InstallmentScheduleTab } from './detail/InstallmentScheduleTab'
import { ContractPreviewTab } from './detail/ContractPreviewTab'

export function InstallmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const user = useCurrentUser()
  const navigate = useNavigate()
  const { token } = theme.useToken()
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
      <Button icon={<X size={16} strokeWidth={2.25} />} onClick={() => setIsEditing(false)}>Cancel</Button>
      <Button type="primary" icon={<Save size={16} strokeWidth={2.25} />} onClick={handleSave}>Save</Button>
    </Space>
  ) : canEdit ? (
    <Button icon={<Pencil size={16} strokeWidth={2.25} />} onClick={() => setIsEditing(true)}>Edit</Button>
  ) : null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Space size={8}>
          <Button icon={<ArrowLeft size={16} strokeWidth={2.25} />} type="text" onClick={() => navigate(-1)} />
          <StatusBadge status={record.contractStatus} />
          <StatusBadge status={record.paymentStatus} />
          <Tag style={{ margin: 0, color: token.colorTextSecondary }}>{record.contractNumber} · {record.branch}</Tag>
        </Space>
        {actions}
      </div>

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
    </div>
  )
}
