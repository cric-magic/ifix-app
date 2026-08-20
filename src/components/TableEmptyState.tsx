import { Typography, theme } from 'antd'
import { useIconColors } from '../constants/iconColors'

interface Props {
  icon: React.ReactNode
  title: string
  description?: string
}

export function TableEmptyState({ icon, title, description }: Props) {
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
    </div>
  )
}
