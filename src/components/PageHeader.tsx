import { Button, Space, Typography } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

interface Props {
  title: React.ReactNode
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  showBack?: boolean
}

export function PageHeader({ title, subtitle, actions, showBack }: Props) {
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
      <Space align="center" size={12}>
        {showBack && (
          <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate(-1)} />
        )}
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {title}
          </Typography.Title>
          {subtitle && (
            <Typography.Text type="secondary">{subtitle}</Typography.Text>
          )}
        </div>
      </Space>
      {actions && <Space>{actions}</Space>}
    </div>
  )
}
