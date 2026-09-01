import { useState } from 'react'
import { Alert, Button, Input, message } from 'antd'
import { Plus, Search } from 'lucide-react'
import { useCurrentUser } from '../../contexts/AuthContext'
import { useIconColors } from '../../constants/iconColors'
import { MOCK_BRANCHES } from '../../constants/mockBranches'
import { canViewBranchList, canCreateBranch, canManageBranch, scopedBranchList } from '../../constants/roles'
import type { Branch } from '../../types/branch'
import { BranchTable } from './components/BranchTable'
import { CreateBranchModal } from './components/CreateBranchModal'

// Merchant Owner/Admin's own-workspace branch list — Super Admin manages
// branches through Merchant Detail instead (see merchants/detail/
// BranchesTab.tsx), since Super Admin has no merchantId of their own to
// scope a list like this to.
export function BranchesPage() {
  const user = useCurrentUser()
  const iconColors = useIconColors()
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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 8 }}>
        <Input
          placeholder="Search by name or branch code"
          prefix={<Search size={15} strokeWidth={2.25} color={iconColors.secondary} />}
          allowClear
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        {canCreateBranch(user) && (
          <Button type="primary" icon={<Plus size={15} strokeWidth={2.25} />} onClick={() => setCreateOpen(true)}>
            Create Branch
          </Button>
        )}
      </div>

      <BranchTable
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
