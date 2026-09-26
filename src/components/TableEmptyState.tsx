import { Typography, theme } from 'antd'
import { useIconColors } from '../constants/iconColors'

interface Props {
  icon: React.ReactNode
  title: string
  description?: string
  // A way out, e.g. "Back to list" — used by PageEmptyState.
  action?: React.ReactNode
}

export function TableEmptyState({ icon, title, description, action }: Props) {
  const { token } = theme.useToken()
  const iconColors = useIconColors()

  return (
    <div style={{
      minHeight: 220,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      // Table cells are nowrap (see .ifix-panel-table in index.css) — the
      // description has to wrap anyway, or on a phone it runs off both
      // sides of the panel.
      whiteSpace: 'normal',
      padding: '0 16px',
    }}>
      <div style={{
        width: 56,
        height: 56,
        borderRadius: 12,
        background: token.colorFillSecondary,
        color: iconColors.secondary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div style={{ textAlign: 'center' }}>
        <Typography.Title level={5} style={{ margin: 0 }}>{title}</Typography.Title>
        {description && <Typography.Text type="secondary">{description}</Typography.Text>}
      </div>
      {action}
    </div>
  )
}
