import { Typography, theme } from 'antd'
import { ICON_COLOR_SECONDARY } from '../constants/iconColors'

interface Props {
  icon: React.ReactNode
  title: string
}

export function PlaceholderPage({ icon, title }: Props) {
  const { token } = theme.useToken()

  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    }}>
      <div style={{
        width: 56,
        height: 56,
        borderRadius: 12,
        background: token.colorFillSecondary,
        color: ICON_COLOR_SECONDARY,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div style={{ textAlign: 'center' }}>
        <Typography.Title level={5} style={{ margin: 0 }}>{title}</Typography.Title>
        <Typography.Text type="secondary">This section is coming soon.</Typography.Text>
      </div>
    </div>
  )
}
