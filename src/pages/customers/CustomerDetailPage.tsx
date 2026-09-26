import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { App, Button } from 'antd'
import { useCurrentUser } from '../../contexts/AuthContext'
import { MOCK_CUSTOMERS } from '../../constants/mockCustomers'
import { MOCK_CONTRACTS } from '../../constants/mockContracts'
import { canViewCustomers, canManageCustomers, canManageCustomerBlacklist, homePath } from '../../constants/roles'
import { OverviewTab } from './detail/OverviewTab'
import { ContractHistoryTab } from './detail/ContractHistoryTab'
import { CustomerModal } from './components/CustomerModal'
import { Contact, Lock, Pencil, ShieldAlert, ShieldCheck } from 'lucide-react'
import { PageEmptyState } from '../../components/PageEmptyState'
import { MobileActionBar } from '../../components/MobileActionBar'
import type { MoreAction } from '../../components/MobileActionBar'
import { useIsMobile } from '../../components/useIsMobile'

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const actor = useCurrentUser()
  const navigate = useNavigate()
  const { modal, message } = App.useApp()
  const isMobile = useIsMobile()
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

  const canToggleBlacklist = canManageCustomerBlacklist(actor)

  function confirmToggleBlacklist() {
    const willBlacklist = !customer!.blacklisted
    modal.confirm({
      title: willBlacklist ? 'Blacklist this customer?' : 'Remove from blacklist?',
      content: willBlacklist
        ? 'New contracts for this customer will require approval and show a warning to whoever creates them.'
        : undefined,
      okText: willBlacklist ? 'Blacklist' : 'Remove',
      okButtonProps: { danger: willBlacklist },
      onOk: () => {
        customer!.blacklisted = willBlacklist
        refresh()
        message.success(willBlacklist ? `${customer!.fullName} blacklisted` : `${customer!.fullName} removed from blacklist`)
      },
    })
  }

  // Mobile: Edit in the bottom bar, the blacklist toggle behind "…" — or
  // the toggle itself in the bar for someone who can't edit.
  const blacklistAction: MoreAction = {
    key: 'blacklist',
    label: customer.blacklisted ? 'Remove from Blacklist' : 'Blacklist',
    icon: customer.blacklisted ? <ShieldCheck size={16} strokeWidth={2.25} /> : <ShieldAlert size={16} strokeWidth={2.25} />,
    danger: !customer.blacklisted,
    onClick: confirmToggleBlacklist,
  }

  return (
    <div>
      <OverviewTab
        customer={customer}
        canEdit={canEdit}
        canToggleBlacklist={canToggleBlacklist}
        onEdit={() => setEditOpen(true)}
        onToggleBlacklist={confirmToggleBlacklist}
      />

      <ContractHistoryTab contracts={contracts} />

      {isMobile && (canEdit || canToggleBlacklist) && (
        <MobileActionBar more={canEdit && canToggleBlacklist ? [blacklistAction] : []}>
          {canEdit ? (
            <Button type="primary" icon={<Pencil size={16} strokeWidth={2.25} />} onClick={() => setEditOpen(true)}>Edit</Button>
          ) : (
            <Button danger={blacklistAction.danger} icon={blacklistAction.icon} onClick={confirmToggleBlacklist}>{blacklistAction.label}</Button>
          )}
        </MobileActionBar>
      )}

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
