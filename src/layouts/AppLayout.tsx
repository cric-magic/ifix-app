import { Layout, Menu } from 'antd'
import {
  FileTextOutlined, SettingOutlined,
  CalculatorOutlined, PlusOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const { Sider, Content } = Layout

export function AppLayout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const selectedKey = location.pathname.startsWith('/installments')
    ? 'installments'
    : location.pathname.startsWith('/penalty-settings')
    ? 'penalty-settings'
    : location.pathname.startsWith('/calculator')
    ? 'calculator'
    : location.pathname.startsWith('/contracts/new')
    ? 'contracts-new'
    : ''

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          style={{ border: 'none', marginTop: 16 }}
          items={[
            {
              key: 'contracts-new',
              icon: <PlusOutlined />,
              label: 'New Contract',
              onClick: () => navigate('/contracts/new'),
            },
            {
              key: 'calculator',
              icon: <CalculatorOutlined />,
              label: 'Smart Calculator',
              onClick: () => navigate('/calculator'),
            },
            {
              key: 'installments',
              icon: <FileTextOutlined />,
              label: 'Installment Overview',
              onClick: () => navigate('/installments'),
            },
            ...(user.role === 'admin'
              ? [{
                  key: 'penalty-settings',
                  icon: <SettingOutlined />,
                  label: 'Penalty Settings',
                  onClick: () => navigate('/penalty-settings'),
                }]
              : []),
          ]}
        />
      </Sider>

      <Layout>
        <Content style={{ background: '#f5f5f5', padding: 24, minHeight: '100vh' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
