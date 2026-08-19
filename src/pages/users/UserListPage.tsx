import { useEffect, useState } from 'react'
import { Alert, Button, message } from 'antd'
import { Plus } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useCurrentUser } from '../../contexts/AuthContext'
import { MOCK_USER_ACCOUNTS, generateTempPassword } from '../../constants/mockUsers'
import { canManageUsers, canViewUserList, scopedUserList } from '../../constants/roles'
import type { UserAccount } from '../../types/user'
import { UserTable } from './components/UserTable'
import { CreateUserModal } from './components/CreateUserModal'
import { EditUserModal } from './components/EditUserModal'
import { TempPasswordModal } from './components/TempPasswordModal'

export function UserListPage() {
  const user = useCurrentUser()
  const [searchParams, setSearchParams] = useSearchParams()
  const [version, setVersion] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<UserAccount | null>(null)
  const [tempPasswordModal, setTempPasswordModal] = useState<{ name: string; password: string } | null>(null)

  useEffect(() => {
    if (searchParams.get('invite') === '1' && canManageUsers(user)) {
      setCreateOpen(true)
      setSearchParams(params => {
        params.delete('invite')
        return params
      }, { replace: true })
    }
  }, [searchParams, user, setSearchParams])

  if (!canViewUserList(user)) {
    return (
      <Alert
        type="error"
        message="Access Denied"
        description="The user list is only accessible to Branch Manager and above."
        showIcon
      />
    )
  }

  const accounts = scopedUserList(user, MOCK_USER_ACCOUNTS)
  void version // trigger re-render on mutation

  function refresh() {
    setVersion(v => v + 1)
  }

  function handleToggleSuspend(account: UserAccount) {
    if (account.status === 'suspended') {
      account.status = 'active'
      account.suspendedBy = null
      account.suspendedAt = null
      message.success(`${account.name} reactivated`)
    } else {
      account.status = 'suspended'
      account.suspendedBy = user.id
      account.suspendedAt = new Date().toISOString()
      message.success(`${account.name} suspended`)
    }
    refresh()
  }

  function handleForceReset(account: UserAccount) {
    const tempPassword = generateTempPassword()
    account.password = tempPassword
    account.isTemporaryPassword = true
    refresh()
    setTempPasswordModal({ name: account.name, password: tempPassword })
  }

  return (
    <div>
      {canManageUsers(user) && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <Button type="primary" icon={<Plus size={15} strokeWidth={2.25} />} onClick={() => setCreateOpen(true)}>
            Create User
          </Button>
        </div>
      )}

      <UserTable
        actor={user}
        accounts={accounts}
        onEdit={setEditingAccount}
        onToggleSuspend={handleToggleSuspend}
        onForceReset={handleForceReset}
      />

      <CreateUserModal
        open={createOpen}
        actor={user}
        onClose={() => setCreateOpen(false)}
        onCreated={(account, tempPassword) => {
          setCreateOpen(false)
          refresh()
          setTempPasswordModal({ name: account.name, password: tempPassword })
        }}
      />

      <EditUserModal
        open={!!editingAccount}
        actor={user}
        account={editingAccount}
        onClose={() => setEditingAccount(null)}
        onUpdated={() => {
          setEditingAccount(null)
          refresh()
          message.success('User updated')
        }}
      />

      <TempPasswordModal
        open={!!tempPasswordModal}
        userName={tempPasswordModal?.name ?? ''}
        tempPassword={tempPasswordModal?.password ?? ''}
        onClose={() => setTempPasswordModal(null)}
      />
    </div>
  )
}
