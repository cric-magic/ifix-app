import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Space, Tabs } from 'antd'
import { Pencil, FileText, Lock } from 'lucide-react'
import { useCurrentUser } from '../../contexts/AuthContext'
import { MOCK_CONTRACTS } from '../../constants/mockContracts'
import { canEditContractFields, canManageContract, canViewContracts, homePath, scopedContractList } from '../../constants/roles'
import { recalculateSchedule } from '../../utils/contract'
import { OverviewTab } from './detail/OverviewTab'
import { CustomerTab } from './detail/CustomerTab'
import { ScheduleTab } from './detail/ScheduleTab'
import { PaymentHistoryTab } from './detail/PaymentHistoryTab'
import { PenaltyTab } from './detail/PenaltyTab'
import { ContractPreviewTab } from './detail/ContractPreviewTab'
import { LifecycleActions } from './components/LifecycleActions'
import { PageEmptyState } from '../../components/PageEmptyState'
import { MobileActionBar } from '../../components/MobileActionBar'
import { useIsMobile } from '../../components/useIsMobile'
import { hasLifecycleAction } from './components/hasLifecycleAction'

export function ContractDetailPage() {
  const { id } = useParams<{ id: string }>()
  const actor = useCurrentUser()
  const navigate = useNavigate()
  const [version, setVersion] = useState(0)
  const isMobile = useIsMobile()
  void version // trigger re-render after mutating the mock record in place

  if (!canViewContracts(actor)) {
    return (
      <PageEmptyState
        icon={<Lock size={22} strokeWidth={2.25} />}
        title="Not applicable"
        description="Contracts are scoped to a merchant workspace. Super Admin operates at the platform level."
        action={<Button onClick={() => navigate(homePath(actor))}>Back home</Button>}
      />
    )
  }

  // scopedContractList (not a raw merchantId filter) — Staff/Branch Manager
  // are scoped to their own branch (per the doc), so this also blocks them
  // from opening another branch's contract by guessing/typing its id.
  const contract = scopedContractList(actor, MOCK_CONTRACTS).find(c => c.id === id)

  if (!contract) {
    return (
      <PageEmptyState
        icon={<FileText size={22} strokeWidth={2.25} />}
        title="Contract not found"
        action={<Button onClick={() => navigate('/contracts')}>Back to list</Button>}
      />
    )
  }

  const canManage = canManageContract(actor, contract)
  const canEditFields = canEditContractFields(actor, contract)

  // Defensive, idempotent recompute on every view (a no-op before
  // activation — see the function's own guard) — this is what makes an
  // Active contract's item flip to Overdue the moment its due date has
  // actually passed, per the doc's own non-functional requirement,
  // without needing a cron job or background check for a prototype with
  // no real backend.
  recalculateSchedule(contract)

  function refresh() {
    setVersion(v => v + 1)
  }

  const hasSchedule = contract.schedule.some(s => s.period > 0)

  function goToEdit() {
    navigate(`/contracts/${contract!.id}/edit`)
  }

  // Mobile action bar: the lifecycle step (Start Review, Reject | Approve,
  // Print Contract, …) gets the bar when there is one, with Edit behind
  // "…"; otherwise Edit is the next step itself (Draft, Rejected) and takes
  // the bar as the primary button.
  const lifecycleInBar = canManage && hasLifecycleAction(contract, actor)
  const mobileActions = isMobile && (
    <MobileActionBar
      more={lifecycleInBar && canEditFields
        ? [{ key: 'edit', label: 'Edit', icon: <Pencil size={16} strokeWidth={2.25} />, onClick: goToEdit }]
        : []}
    >
      {lifecycleInBar
        ? <LifecycleActions contract={contract} actor={actor} onChanged={refresh} />
        : canEditFields && (
          <Button type="primary" icon={<Pencil size={16} strokeWidth={2.25} />} onClick={goToEdit}>
            Edit
          </Button>
        )}
    </MobileActionBar>
  )

  return (
    <div>
      <OverviewTab
        contract={contract}
        // On mobile the actions move to the bar at the bottom (below).
        actions={isMobile ? null : (
          <Space size={8}>
            {canEditFields && (
              <Button icon={<Pencil size={16} strokeWidth={2.25} />} onClick={goToEdit}>
                Edit
              </Button>
            )}
            {canManage && <LifecycleActions contract={contract} actor={actor} onChanged={refresh} />}
          </Space>
        )}
      />

      {/* Grouped by purpose, not one tab per panel — Schedule and Payment
          History are the same "what's due / what's been paid" story, and
          Penalty + Collection Fees (PenaltyTab renders both) are their own
          concern. Overview stays outside the tabs, same as every other
          detail page's header section. */}
      <Tabs
        items={[
          {
            key: 'customer',
            label: 'Customer',
            children: <CustomerTab customer={contract.customer} />,
          },
          {
            key: 'payments',
            label: 'Payments',
            children: (
              <>
                <ScheduleTab contract={contract} actor={actor} onChanged={refresh} />
                <PaymentHistoryTab contract={contract} actor={actor} onChanged={refresh} />
              </>
            ),
          },
          ...(hasSchedule ? [{
            key: 'penalty',
            label: 'Penalty & Fees',
            children: <PenaltyTab contract={contract} actor={actor} onChanged={refresh} />,
          }] : []),
          {
            key: 'preview',
            label: 'Contract Preview',
            children: <ContractPreviewTab contract={contract} />,
          },
        ]}
      />

      {mobileActions}
    </div>
  )
}
