import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { App, Button, message } from 'antd'
import { useCurrentUser } from '../../contexts/AuthContext'
import { MOCK_BRANCHES } from '../../constants/mockBranches'
import { MOCK_USER_ACCOUNTS } from '../../constants/mockUsers'
import { canManageBranch, scopedBranchList } from '../../constants/roles'
import { OverviewTab } from './detail/OverviewTab'
import { BankAccountTab } from './detail/BankAccountTab'
import { AssignedUsersTab } from './detail/AssignedUsersTab'
import { EditBranchModal } from './components/EditBranchModal'
import { Archive, ArchiveRestore, Pencil, Store } from 'lucide-react'
import { PageEmptyState } from '../../components/PageEmptyState'
import { MobileActionBar } from '../../components/MobileActionBar'
import { useIsMobile } from '../../components/useIsMobile'

export function BranchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const actor = useCurrentUser()
  const navigate = useNavigate()
  const { modal } = App.useApp()
  const isMobile = useIsMobile()
  const [editOpen, setEditOpen] = useState(false)
  const [version, setVersion] = useState(0)
  void version

  // scopedBranchList (not the raw MOCK_BRANCHES) so a Merchant Owner/Admin
  // can't reach another merchant's branch just by guessing an id — Super
  // Admin sees all, matching the same scoping convention as
  // scopedUserList/scopedProductList.
  const branch = scopedBranchList(actor, MOCK_BRANCHES).find(b => b.id === id)

  if (!branch) {
    return (
      <PageEmptyState
        icon={<Store size={22} strokeWidth={2.25} />}
        title="Branch not found"
        action={<Button onClick={() => navigate('/branches')}>Back to list</Button>}
      />
    )
  }

  const canEdit = canManageBranch(actor, branch)

  function refresh() {
    setVersion(v => v + 1)
  }

  function handleToggleArchive() {
    if (!branch) return

    if (branch.status === 'archived') {
      branch.status = 'active'
      branch.archivedBy = null
      branch.archivedAt = null
      message.success(`${branch.name} unarchived`)
    } else {
      branch.status = 'archived'
      branch.archivedBy = actor.id
      branch.archivedAt = new Date().toISOString()
      // Per the doc: archiving a branch suspends all its staff and branch
      // managers.
      MOCK_USER_ACCOUNTS
        .filter(u => u.merchantId === branch.merchantId && u.branch === branch.name && u.status !== 'suspended')
        .forEach(u => {
          u.status = 'suspended'
          u.suspendedBy = actor.id
          u.suspendedAt = new Date().toISOString()
        })
      message.success(`${branch.name} archived — its staff have been suspended`)
    }
    refresh()
  }

  const isArchived = branch.status === 'archived'

  function confirmToggleArchive() {
    modal.confirm({
      title: isArchived ? 'Unarchive this branch?' : 'Archive this branch?',
      content: isArchived ? undefined : 'All staff and branch managers at this branch will be suspended.',
      okText: isArchived ? 'Unarchive' : 'Archive',
      okButtonProps: { danger: !isArchived },
      onOk: handleToggleArchive,
    })
  }

  return (
    <div>
      <OverviewTab
        branch={branch}
        canEdit={canEdit}
        onEdit={() => setEditOpen(true)}
        onToggleArchive={confirmToggleArchive}
      />

      <BankAccountTab branch={branch} canManage={canEdit} onChanged={refresh} />

      <AssignedUsersTab branch={branch} canManage={canEdit} />

      {/* Mobile: Edit in the bottom bar, Archive behind "…". */}
      {isMobile && canEdit && (
        <MobileActionBar
          more={[{
            key: 'archive',
            label: isArchived ? 'Unarchive' : 'Archive',
            icon: isArchived ? <ArchiveRestore size={16} strokeWidth={2.25} /> : <Archive size={16} strokeWidth={2.25} />,
            danger: !isArchived,
            onClick: confirmToggleArchive,
          }]}
        >
          <Button type="primary" icon={<Pencil size={16} strokeWidth={2.25} />} onClick={() => setEditOpen(true)}>Edit</Button>
        </MobileActionBar>
      )}

      <EditBranchModal
        open={editOpen}
        branch={branch}
        onClose={() => setEditOpen(false)}
        onUpdated={() => {
          setEditOpen(false)
          refresh()
          message.success('Branch updated')
        }}
      />
    </div>
  )
}
