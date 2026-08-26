import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { App, Avatar, Button, Dropdown, Result, Typography, message } from 'antd'
import { Pencil, Ban, RotateCcw, KeyRound, MoreHorizontal } from 'lucide-react'
import { useCurrentUser } from '../../contexts/AuthContext'
import { MOCK_USER_ACCOUNTS, generateTempPassword } from '../../constants/mockUsers'
import { ROLE_LABELS, canManageTargetUser, canViewUserList, scopedUserList } from '../../constants/roles'
import { getAvatarUrl } from '../../utils/avatar'
import { SettingsCard, SettingsRow } from '../../components/SettingsCard'
import { UserStatusTag } from './components/UserStatusTag'
import { EditUserModal } from './components/EditUserModal'
import { TempPasswordModal } from './components/TempPasswordModal'

const dateFormatter = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : '—'
}

function actorName(userId: string | null): string | null {
  return userId ? MOCK_USER_ACCOUNTS.find(a => a.id === userId)?.name ?? null : null
}

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const actor = useCurrentUser()
  const navigate = useNavigate()
  const { modal } = App.useApp()
  const [editOpen, setEditOpen] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  void version // trigger re-render after mutating the mock record in place

  if (!canViewUserList(actor)) {
    return (
      <Result
        status="403"
        title="Access denied"
        subTitle="The user list is only accessible to Branch Manager and above."
        extra={<Button onClick={() => navigate('/contracts')}>Back home</Button>}
      />
    )
  }

  // scopedUserList (not the full MOCK_USER_ACCOUNTS) so a Branch Manager
  // can't reach a member outside their own branch just by guessing an id.
  const account = scopedUserList(actor, MOCK_USER_ACCOUNTS).find(a => a.id === id)

  if (!account) {
    return (
      <Result
        status="404"
        title="User not found"
        extra={<Button onClick={() => navigate('/settings/members')}>Back to list</Button>}
      />
    )
  }

  // Same rule as the table's row actions — also false for the signed-in
  // actor's own row, matching the Account page's "cannot edit own details"
  // read-only behavior instead of a separate special case here.
  const canEdit = canManageTargetUser(actor, account)
  const isSuspended = account.status === 'suspended'

  function refresh() {
    setVersion(v => v + 1)
  }

  function handleToggleSuspend() {
    if (isSuspended) {
      account!.status = 'active'
      account!.suspendedBy = null
      account!.suspendedAt = null
      message.success(`${account!.name} reactivated`)
    } else {
      account!.status = 'suspended'
      account!.suspendedBy = actor.id
      account!.suspendedAt = new Date().toISOString()
      message.success(`${account!.name} suspended`)
    }
    refresh()
  }

  function handleForceReset() {
    const newTemp = generateTempPassword()
    account!.password = newTemp
    account!.isTemporaryPassword = true
    refresh()
    setTempPassword(newTemp)
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <Avatar src={getAvatarUrl(account.id)} size={48} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Typography.Text strong style={{ fontSize: 18, display: 'block' }} ellipsis>
            {account.name}
          </Typography.Text>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>{ROLE_LABELS[account.role]}</Typography.Text>
            <UserStatusTag status={account.status} />
          </div>
        </div>
        {canEdit && (
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <Button icon={<Pencil size={15} strokeWidth={2.25} />} onClick={() => setEditOpen(true)}>Edit</Button>
            <Dropdown
              trigger={['click']}
              placement="bottomRight"
              menu={{
                items: [
                  { key: 'reset', icon: <KeyRound size={15} strokeWidth={2.25} />, label: 'Reset password' },
                  { type: 'divider' },
                  {
                    key: 'suspend',
                    danger: !isSuspended,
                    icon: isSuspended ? <RotateCcw size={15} strokeWidth={2.25} /> : <Ban size={15} strokeWidth={2.25} />,
                    label: isSuspended ? 'Reactivate' : 'Suspend',
                  },
                ],
                onClick: ({ key }) => {
                  if (key === 'reset') handleForceReset()
                  if (key === 'suspend') {
                    modal.confirm({
                      title: isSuspended ? 'Reactivate this user?' : 'Suspend this user?',
                      okText: isSuspended ? 'Reactivate' : 'Suspend',
                      okButtonProps: { danger: !isSuspended },
                      onOk: handleToggleSuspend,
                    })
                  }
                },
              }}
            >
              <Button icon={<MoreHorizontal size={15} strokeWidth={2.25} />} />
            </Dropdown>
          </div>
        )}
      </div>

      <SettingsCard title="Profile">
        <SettingsRow label="Name">{account.name}</SettingsRow>
        <SettingsRow label="Staff ID">{account.staffId}</SettingsRow>
        <SettingsRow label="Role">{ROLE_LABELS[account.role]}</SettingsRow>
        {account.branch && <SettingsRow label="Branch">{account.branch}</SettingsRow>}
      </SettingsCard>

      <SettingsCard title="Contact">
        <SettingsRow label="Email">{account.email}</SettingsRow>
        <SettingsRow label="Phone">{account.phone}</SettingsRow>
      </SettingsCard>

      <SettingsCard title="Account">
        <SettingsRow label="Status"><UserStatusTag status={account.status} /></SettingsRow>
        <SettingsRow label="Created by & at">
          {actorName(account.createdBy) ? `${actorName(account.createdBy)} · ${formatDate(account.createdAt)}` : formatDate(account.createdAt)}
        </SettingsRow>
        <SettingsRow label="Activated at">{formatDate(account.activatedAt)}</SettingsRow>
        <SettingsRow label="Suspended by & at">
          {account.suspendedBy ? `${actorName(account.suspendedBy) ?? '—'} · ${formatDate(account.suspendedAt)}` : '—'}
        </SettingsRow>
      </SettingsCard>

      <EditUserModal
        open={editOpen}
        actor={actor}
        account={account}
        onClose={() => setEditOpen(false)}
        onUpdated={() => {
          setEditOpen(false)
          refresh()
          message.success('User updated')
        }}
      />

      <TempPasswordModal
        open={!!tempPassword}
        userName={account.name}
        tempPassword={tempPassword ?? ''}
        onClose={() => setTempPassword(null)}
      />
    </div>
  )
}
