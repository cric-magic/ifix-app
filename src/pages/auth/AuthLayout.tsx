import { Typography, theme } from 'antd'
import { useDevTools } from '../../contexts/DevToolsContext'

interface Props {
  title: string
  subtitle?: string
  children: React.ReactNode
}

export function AuthLayout({ title, subtitle, children }: Props) {
  const { token } = theme.useToken()
  const { themeVariant } = useDevTools()

  // This page sits directly inside DesktopStageLayout's window box (shared
  // with the signed-in app, which paints it via the ambient colorBgContainer)
  // — but there's no Sider/header+content split here to justify a single
  // flat "elevated container" tone. A top-to-bottom gradient down to
  // colorBgLayout (the plain page-canvas tier) reads as one continuous
  // surface with the wallpaper behind the window, rather than a flat card
  // seam. Light uses colorBgElevated instead of colorBgContainer for the
  // top stop — Light's colorBgContainer is a near-white surface tone,
  // while colorBgElevated is the pure-white "most elevated" tier this page
  // (no sidebar/panel context) reads better against.
  const gradientTop = themeVariant === 'light' ? token.colorBgElevated : token.colorBgContainer

  return (
    <div style={{
      minHeight: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      // Stop at 50% (not the default 100%) so colorBgLayout is reached at
      // the vertical midpoint and holds flat for the bottom half, instead
      // of fading the whole way down.
      background: `linear-gradient(to bottom, ${gradientTop} 0%, ${token.colorBgLayout} 50%)`,
    }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <Typography.Title level={4} style={{ marginTop: 0, marginBottom: 4 }}>{title}</Typography.Title>
        {subtitle && (
          <Typography.Text style={{ display: 'block', marginBottom: 24, color: token.colorTextSecondary }}>
            {subtitle}
          </Typography.Text>
        )}
        {!subtitle && <div style={{ marginBottom: 24 }} />}

        {children}
      </div>
    </div>
  )
}
