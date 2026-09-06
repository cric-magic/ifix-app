import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Result, Space } from 'antd'
import { Pencil } from 'lucide-react'
import { useCurrentUser } from '../../contexts/AuthContext'
import { MOCK_CONTRACTS } from '../../constants/mockContracts'
import { canEditContractFields, canManageContract, canViewContracts, homePath, scopedContractList } from '../../constants/roles'
import { recalculateSchedule } from '../../utils/contract'
import { OverviewTab } from './detail/OverviewTab'
import { CustomerTab } from './detail/CustomerTab'
import { ScheduleTab } from './detail/ScheduleTab'
import { PaymentHistoryTab } from './detail/PaymentHistoryTab'
import { ContractPreviewTab } from './detail/ContractPreviewTab'
import { LifecycleActions } from './components/LifecycleActions'

export function ContractDetailPage() {
  const { id } = useParams<{ id: string }>()
  const actor = useCurrentUser()
  const navigate = useNavigate()
  const [version, setVersion] = useState(0)
  void version // trigger re-render after mutating the mock record in place

  if (!canViewContracts(actor)) {
    return (
      <Result
        status="403"
        title="Not applicable"
        subTitle="Contracts are scoped to a merchant workspace. Super Admin operates at the platform level."
        extra={<Button onClick={() => navigate(homePath(actor))}>Back home</Button>}
      />
    )
  }

  // scopedContractList (not a raw merchantId filter) — Staff/Branch Manager
  // are scoped to their own branch (per the doc), so this also blocks them
  // from opening another branch's contract by guessing/typing its id.
  const contract = scopedContractList(actor, MOCK_CONTRACTS).find(c => c.id === id)

  if (!contract) {
    return (
      <Result
        status="404"
        title="Contract not found"
        extra={<Button onClick={() => navigate('/contracts')}>Back to list</Button>}
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

  return (
    <div>
      <OverviewTab
        contract={contract}
        actions={
          <Space size={8}>
            {canEditFields && (
              <Button icon={<Pencil size={16} strokeWidth={2.25} />} onClick={() => navigate(`/contracts/${contract.id}/edit`)}>
                Edit
              </Button>
            )}
            {canManage && <LifecycleActions contract={contract} actor={actor} onChanged={refresh} />}
          </Space>
        }
      />

      <CustomerTab customer={contract.customer} />

      <ScheduleTab contract={contract} actor={actor} onChanged={refresh} />

      <PaymentHistoryTab contract={contract} actor={actor} onChanged={refresh} />

      <ContractPreviewTab contract={contract} />
    </div>
  )
}
