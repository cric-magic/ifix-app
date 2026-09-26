import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { App, Button, Tabs, message } from 'antd'
import { useCurrentUser } from '../../contexts/AuthContext'
import { MOCK_MERCHANTS } from '../../constants/mockMerchants'
import { canViewMerchantList, canEditMerchant, canManageBankAccounts, homePath } from '../../constants/roles'
import { OverviewTab } from './detail/OverviewTab'
import { BankAccountsTab } from './detail/BankAccountsTab'
import { BranchesTab } from './detail/BranchesTab'
import { ContractTemplatesTab } from './detail/ContractTemplatesTab'
import { EditMerchantModal } from './components/EditMerchantModal'
import { Ban, Building2, Lock, Pencil, RotateCcw } from 'lucide-react'
import { PageEmptyState } from '../../components/PageEmptyState'
import { MobileActionBar } from '../../components/MobileActionBar'
import { useIsMobile } from '../../components/useIsMobile'

export function MerchantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const actor = useCurrentUser()
  const navigate = useNavigate()
  const { modal } = App.useApp()
  const isMobile = useIsMobile()
  const [editOpen, setEditOpen] = useState(false)
  const [version, setVersion] = useState(0)
  void version // trigger re-render after mutating the mock record in place

  if (!canViewMerchantList(actor)) {
    return (
      <PageEmptyState
        icon={<Lock size={22} strokeWidth={2.25} />}
        title="Access denied"
        description="Merchants is only accessible to Super Admin."
        action={<Button onClick={() => navigate(homePath(actor))}>Back home</Button>}
      />
    )
  }

  const merchant = MOCK_MERCHANTS.find(m => m.id === id)

  if (!merchant) {
    return (
      <PageEmptyState
        icon={<Building2 size={22} strokeWidth={2.25} />}
        title="Merchant not found"
        action={<Button onClick={() => navigate('/merchants')}>Back to list</Button>}
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

  const isSuspended = merchant.status === 'suspended'
  const canEdit = canEditMerchant(actor, merchant)

  function confirmToggleSuspend() {
    modal.confirm({
      title: isSuspended ? 'Reactivate this merchant?' : 'Suspend this merchant?',
      content: isSuspended ? undefined : 'This merchant loses access to the platform until reactivated.',
      okText: isSuspended ? 'Reactivate' : 'Suspend',
      okButtonProps: { danger: !isSuspended },
      onOk: handleToggleSuspend,
    })
  }

  return (
    <div>
      <OverviewTab
        merchant={merchant}
        canEdit={canEdit}
        onEdit={() => setEditOpen(true)}
        onToggleSuspend={confirmToggleSuspend}
      />

      {/* Header + merchant details above, everything else in tabs — the
          same arrangement Contract Detail uses, and what keeps this page
          readable now that a merchant's templates live here too. */}
      <Tabs
        items={[
          {
            key: 'bank-accounts',
            label: 'Bank Accounts',
            children: (
              <BankAccountsTab
                merchant={merchant}
                canManage={canManageBankAccounts(actor, merchant)}
                onChanged={refresh}
              />
            ),
          },
          {
            key: 'branches',
            label: 'Branches',
            children: <BranchesTab actor={actor} merchant={merchant} />,
          },
          {
            key: 'contract-templates',
            label: 'Contract Templates',
            children: <ContractTemplatesTab merchantId={merchant.id} />,
          },
        ]}
      />

      {/* Mobile: Edit in the bottom bar, Suspend behind "…". Only Super
          Admin reaches this page, and they can always suspend. */}
      {isMobile && (
        <MobileActionBar
          more={canEdit ? [{
            key: 'suspend',
            label: isSuspended ? 'Reactivate' : 'Suspend',
            icon: isSuspended ? <RotateCcw size={16} strokeWidth={2.25} /> : <Ban size={16} strokeWidth={2.25} />,
            danger: !isSuspended,
            onClick: confirmToggleSuspend,
          }] : []}
        >
          {canEdit ? (
            <Button type="primary" icon={<Pencil size={16} strokeWidth={2.25} />} onClick={() => setEditOpen(true)}>Edit</Button>
          ) : (
            <Button
              danger={!isSuspended}
              icon={isSuspended ? <RotateCcw size={16} strokeWidth={2.25} /> : <Ban size={16} strokeWidth={2.25} />}
              onClick={confirmToggleSuspend}
            >
              {isSuspended ? 'Reactivate' : 'Suspend'}
            </Button>
          )}
        </MobileActionBar>
      )}

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
