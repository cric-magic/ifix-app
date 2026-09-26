import { Typography, theme } from 'antd'

// `action` sits on the right of the title row (e.g. an Edit button for the
// card's own settings) rather than trailing below the rows, where it read
// as belonging to the last row instead of the whole card.
export function SettingsCard({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="ifix-table-panel" style={{ padding: 16, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 16 }}>
        <Typography.Text strong style={{ fontSize: 15 }}>
          {title}
        </Typography.Text>
        {action}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  )
}

export function SettingsRow({ label, children }: { label: string; children: React.ReactNode }) {
  const { token } = theme.useToken()
  return (
    // Divider lives in index.css (.ifix-settings-row) so the card's last row
    // can drop it — the card's own edge already closes the list.
    <div className="ifix-settings-row" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      // A long value (an address) keeps a gap from its label instead of
      // running into it, and wraps right-aligned like every short value.
      // Either side can wrap when space runs out, so a value that mustn't
      // break (a code) can keep itself on one line and let its label wrap.
      gap: 16,
      padding: '8px 0',
    }}>
      <span style={{ fontSize: 14, color: token.colorTextSecondary }}>{label}</span>
      <span style={{ fontSize: 14, color: token.colorText, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, minWidth: 0, textAlign: 'right' }}>
        {children}
      </span>
    </div>
  )
}
