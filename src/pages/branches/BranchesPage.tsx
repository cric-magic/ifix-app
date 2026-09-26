import { useState } from 'react'
import { Alert, message } from 'antd'
import { useCurrentUser } from '../../contexts/AuthContext'
import { MOCK_BRANCHES } from '../../constants/mockBranches'
import { canViewBranchList, canCreateBranch, canManageBranch, scopedBranchList } from '../../constants/roles'
import type { Branch } from '../../types/branch'
import { BranchTable } from './components/BranchTable'
import { CreateBranchModal } from './components/CreateBranchModal'
import { ListToolbar } from '../../components/ListToolbar'
import { ListSearch } from '../../components/ListSearch'

// Merchant Owner/Admin's own-workspace branch list — Super Admin manages
// branches through Merchant Detail instead (see merchants/detail/
// BranchesTab.tsx), since Super Admin has no merchantId of their own to
// scope a list like this to.
export function BranchesPage() {
  const user = useCurrentUser()
  const [version, setVersion] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [search, setSearch] = useState('')

  if (!canViewBranchList(user)) {
    return (
      <Alert
        type="error"
        message="Access Denied"
        description="Branches is only accessible to Merchant Admin and above."
        showIcon
      />
    )
  }

  const allBranches = scopedBranchList(user, MOCK_BRANCHES)
  const query = search.trim().toLowerCase()
  const branches = query
    ? allBranches.filter(b => b.name.toLowerCase().includes(query) || b.code.toLowerCase().includes(query))
    : allBranches
  void version

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
      branch.archivedBy = user.id
      branch.archivedAt = new Date().toISOString()
      message.success(`${branch.name} archived — its staff have been suspended`)
    }
    refresh()
  }

  return (
    <div className="ifix-fill-page">
      <ListToolbar
        search={<ListSearch value={search} onChange={setSearch} placeholder="Search by name or branch code" mobilePlaceholder="Search branches" />}
        action={canCreateBranch(user) ? { label: 'Create Branch', onClick: () => setCreateOpen(true) } : undefined}
      />

      <BranchTable
        fillHeight
        branches={branches}
        search={search}
        canManage={branch => canManageBranch(user, branch)}
        onToggleArchive={handleToggleArchive}
      />

      <CreateBranchModal
        open={createOpen}
        actor={user}
        merchantId={user.merchantId!}
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
