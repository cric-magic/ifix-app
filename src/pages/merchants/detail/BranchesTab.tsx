import { useState } from 'react'
import { Button, message } from 'antd'
import { Plus } from 'lucide-react'
import type { AuthUser } from '../../../types/installment'
import type { Merchant } from '../../../types/merchant'
import type { Branch } from '../../../types/branch'
import { MOCK_BRANCHES } from '../../../constants/mockBranches'
import { canCreateBranch, canManageBranch } from '../../../constants/roles'
import { BranchTable } from '../../branches/components/BranchTable'
import { CreateBranchModal } from '../../branches/components/CreateBranchModal'

interface Props {
  actor: AuthUser
  merchant: Merchant
}

// Super Admin's path into a specific merchant's branches — scoped to
// merchant.id, shown as a tab on Merchant Detail rather than a global list,
// since Super Admin has no merchantId of their own for a BranchesPage-style
// list to be scoped to. Reuses BranchTable/CreateBranchModal directly —
// same components BranchesPage (Owner/Admin's own-workspace view) uses.
export function BranchesTab({ actor, merchant }: Props) {
  const [version, setVersion] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  void version

  const branches = MOCK_BRANCHES.filter(b => b.merchantId === merchant.id)

  function refresh() {
    setVersion(v => v + 1)
  }

  function handleToggleArchive(branch: Branch) {
    if (branch.status === 'archived') {
      branch.status = 'active'
      branch.archivedBy = null
      branch.archivedAt = null
      message.success(`${branch.name} unarchived`)
    } else {
      branch.status = 'archived'
      branch.archivedBy = actor.id
      branch.archivedAt = new Date().toISOString()
      message.success(`${branch.name} archived — its staff have been suspended`)
    }
    refresh()
  }

  return (
    <div>
      <BranchTable
        branches={branches}
        search=""
        canManage={branch => canManageBranch(actor, branch)}
        onToggleArchive={handleToggleArchive}
        headerAction={canCreateBranch(actor) ? (
          <Button icon={<Plus size={15} strokeWidth={2.25} />} onClick={() => setCreateOpen(true)}>
            Create Branch
          </Button>
        ) : null}
      />

      <CreateBranchModal
        open={createOpen}
        actor={actor}
        merchantId={merchant.id}
        onClose={() => setCreateOpen(false)}
        onCreated={branch => {
          setCreateOpen(false)
          MOCK_BRANCHES.push(branch)
          refresh()
          message.success(`${branch.name} created`)
        }}
      />
    </div>
  )
}
