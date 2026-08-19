import { Typography, theme } from 'antd'

interface Props {
  title: string
  subtitle?: string
  children: React.ReactNode
}

export function AuthLayout({ title, subtitle, children }: Props) {
  const { token } = theme.useToken()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
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
