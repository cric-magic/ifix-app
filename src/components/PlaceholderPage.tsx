import { Typography, theme } from 'antd'
import { useIconColors } from '../constants/iconColors'

interface Props {
  icon: React.ReactNode
  title: string
}

export function PlaceholderPage({ icon, title }: Props) {
  const { token } = theme.useToken()
  const iconColors = useIconColors()

  return (
    <div style={{
      // Was 60vh — measured against the real browser viewport, not the
      // simulated desktop window/Content area this actually renders
      // inside, so it could exceed the visible content height and trigger
      // a scrollbar for a page with nothing to scroll to. height: 100%
      // fills exactly the Content area's own real height (AppLayout.tsx's
      // wrapper div now passes that down), so this centers correctly with
      // no overshoot.
      height: '100%',
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
        <Typography.Text type="secondary">This section is coming soon.</Typography.Text>
      </div>
    </div>
  )
}
