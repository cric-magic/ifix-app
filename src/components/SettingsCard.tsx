import { Typography, theme } from 'antd'

export function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="ifix-table-panel" style={{ padding: 20, marginBottom: 20 }}>
      <Typography.Text strong style={{ fontSize: 15, display: 'block', marginBottom: 14 }}>
        {title}
      </Typography.Text>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  )
}

export function SettingsRow({ label, children }: { label: string; children: React.ReactNode }) {
  const { token } = theme.useToken()
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: `0.5px solid ${token.colorBorderSecondary}`,
      padding: '10px 0',
    }}>
      <span style={{ fontSize: 13, color: token.colorTextSecondary }}>{label}</span>
      <span style={{ fontSize: 14, color: token.colorText, display: 'flex', alignItems: 'center', gap: 8 }}>
        {children}
      </span>
    </div>
  )
}
