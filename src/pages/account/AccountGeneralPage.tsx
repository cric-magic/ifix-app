import { Avatar, Typography } from 'antd'
import { useCurrentUser } from '../../contexts/AuthContext'
import { MOCK_USER_ACCOUNTS } from '../../constants/mockUsers'
import { ROLE_LABELS } from '../../constants/roles'
import { getAvatarUrl } from '../../utils/avatar'
import { UserStatusTag } from '../users/components/UserStatusTag'
import { SettingsCard, SettingsRow } from '../../components/SettingsCard'

const dateFormatter = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : '—'
}

function actorName(userId: string | null): string | null {
  return userId ? MOCK_USER_ACCOUNTS.find(a => a.id === userId)?.name ?? null : null
}

// Read-only — per the User Account doc's Out of Scope: "User cannot edit
// his/her details in MVP." Same header + card layout as UserDetailPage
// (the admin-facing view of another user) so the two stay visually
// identical; this one never shows the Edit/actions controls since a user
// can never manage their own account.
export function AccountGeneralPage() {
  const user = useCurrentUser()
  const account = MOCK_USER_ACCOUNTS.find(a => a.id === user.id)

  if (!account) return null

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
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
    </div>
  )
}
