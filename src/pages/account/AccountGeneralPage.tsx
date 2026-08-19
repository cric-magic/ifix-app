import { Typography, theme } from 'antd'
import { useCurrentUser } from '../../contexts/AuthContext'
import { MOCK_USER_ACCOUNTS } from '../../constants/mockUsers'
import { ROLE_LABELS } from '../../constants/roles'
import { UserStatusTag } from '../users/components/UserStatusTag'
import { SettingsCard, SettingsRow } from '../../components/SettingsCard'

const dateFormatter = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : '—'
}

// Read-only — per the User Account doc's Out of Scope: "User cannot edit
// his/her details in MVP." This page displays the signed-in user's own
// account, sourced from the full record (useCurrentUser only exposes a
// trimmed AuthUser shape).
export function AccountGeneralPage() {
  const user = useCurrentUser()
  const { token } = theme.useToken()
  const account = MOCK_USER_ACCOUNTS.find(a => a.id === user.id)

  if (!account) return null

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <Typography.Text style={{ display: 'block', marginBottom: 20, color: token.colorTextSecondary, fontSize: 13 }}>
        Your account details are managed by your workspace admin and can't be edited here.
      </Typography.Text>

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
        <SettingsRow label="Member since">{formatDate(account.createdAt)}</SettingsRow>
      </SettingsCard>
    </div>
  )
}
