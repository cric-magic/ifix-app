import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Result, message } from 'antd'
import { useCurrentUser } from '../../contexts/AuthContext'
import { MOCK_MERCHANTS } from '../../constants/mockMerchants'
import { canViewMerchantList, canEditMerchant, canManageBankAccounts } from '../../constants/roles'
import { OverviewTab } from './detail/OverviewTab'
import { BankAccountsTab } from './detail/BankAccountsTab'
import { BranchesTab } from './detail/BranchesTab'
import { EditMerchantModal } from './components/EditMerchantModal'

export function MerchantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const actor = useCurrentUser()
  const navigate = useNavigate()
  const [editOpen, setEditOpen] = useState(false)
  const [version, setVersion] = useState(0)
  void version // trigger re-render after mutating the mock record in place

  if (!canViewMerchantList(actor)) {
    return (
      <Result
        status="403"
        title="Access denied"
        subTitle="Merchants is only accessible to Super Admin."
        extra={<Button onClick={() => navigate('/contracts')}>Back home</Button>}
      />
    )
  }

  const merchant = MOCK_MERCHANTS.find(m => m.id === id)

  if (!merchant) {
    return (
      <Result
        status="404"
        title="Merchant not found"
        extra={<Button onClick={() => navigate('/merchants')}>Back to list</Button>}
      />
    )
  }

  function refresh() {
    setVersion(v => v + 1)
  }

  function handleToggleSuspend() {
    if (!merchant) return
    if (merchant.status === 'suspended') {
      merchant.status = 'active'
      merchant.suspendedBy = null
      merchant.suspendedAt = null
      message.success(`${merchant.name} reactivated`)
    } else {
      merchant.status = 'suspended'
      merchant.suspendedBy = actor.id
      merchant.suspendedAt = new Date().toISOString()
      message.success(`${merchant.name} suspended`)
    }
    refresh()
  }

  return (
    <div>
      <OverviewTab
        merchant={merchant}
        canEdit={canEditMerchant(actor, merchant)}
        onEdit={() => setEditOpen(true)}
        onToggleSuspend={handleToggleSuspend}
      />

      <BankAccountsTab
        merchant={merchant}
        canManage={canManageBankAccounts(actor, merchant)}
        onChanged={refresh}
      />

      <BranchesTab actor={actor} merchant={merchant} />

      <EditMerchantModal
        open={editOpen}
        merchant={merchant}
        onClose={() => setEditOpen(false)}
        onUpdated={() => {
          setEditOpen(false)
          refresh()
          message.success('Merchant updated')
        }}
      />
    </div>
  )
}
