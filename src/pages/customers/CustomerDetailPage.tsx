import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, message } from 'antd'
import { useCurrentUser } from '../../contexts/AuthContext'
import { MOCK_CUSTOMERS } from '../../constants/mockCustomers'
import { MOCK_CONTRACTS } from '../../constants/mockContracts'
import { canViewCustomers, canManageCustomers, homePath } from '../../constants/roles'
import { OverviewTab } from './detail/OverviewTab'
import { ContractHistoryTab } from './detail/ContractHistoryTab'
import { CustomerModal } from './components/CustomerModal'
import { Contact, Lock } from 'lucide-react'
import { PageEmptyState } from '../../components/PageEmptyState'

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const actor = useCurrentUser()
  const navigate = useNavigate()
  const [editOpen, setEditOpen] = useState(false)
  const [version, setVersion] = useState(0)
  void version // trigger re-render after mutating the mock record in place

  if (!canViewCustomers(actor)) {
    return (
      <PageEmptyState
        icon={<Lock size={22} strokeWidth={2.25} />}
        title="Not applicable"
        description="Customers are scoped to a merchant workspace. Super Admin operates at the platform level."
        action={<Button onClick={() => navigate(homePath(actor))}>Back home</Button>}
      />
    )
  }

  const customer = MOCK_CUSTOMERS.find(c => c.id === id && c.merchantId === actor.merchantId)

  if (!customer) {
    return (
      <PageEmptyState
        icon={<Contact size={22} strokeWidth={2.25} />}
        title="Customer not found"
        action={<Button onClick={() => navigate('/customers')}>Back to list</Button>}
      />
    )
  }

  const canEdit = canManageCustomers(actor)
  const contracts = MOCK_CONTRACTS.filter(c => c.customerId === customer.id)

  function refresh() {
    setVersion(v => v + 1)
  }

  return (
    <div>
      <OverviewTab
        customer={customer}
        canEdit={canEdit}
        onEdit={() => setEditOpen(true)}
        onChanged={refresh}
      />

      <ContractHistoryTab contracts={contracts} />

      <CustomerModal
        open={editOpen}
        customer={customer}
        onClose={() => setEditOpen(false)}
        onSaved={updated => {
          Object.assign(customer, updated)
          setEditOpen(false)
          refresh()
          message.success('Customer updated')
        }}
      />
    </div>
  )
}
