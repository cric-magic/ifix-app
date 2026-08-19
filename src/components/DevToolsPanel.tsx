import { useState } from 'react'
import { Avatar, Button, Space, Tag, Tooltip, Typography, theme } from 'antd'
import { Monitor, Tablet, Smartphone, User, Minus, ChevronUp } from 'lucide-react'
import { Select } from './AppSelect'
import { useDevTools, DEVICE_CONFIG } from '../contexts/DevToolsContext'
import { useAuth } from '../contexts/AuthContext'
import { ROLE_LABELS, ROLE_TAG_COLOR } from '../constants/roles'
import { MOCK_USER_ACCOUNTS } from '../constants/mockUsers'
import type { DeviceSize } from '../contexts/DevToolsContext'
import type { UserAccount } from '../types/user'

const DEVICE_ICONS: Record<DeviceSize, React.ReactNode> = {
  desktop: <Monitor size={17} strokeWidth={2.25} />,
  tablet:  <Tablet size={17} strokeWidth={2.25} />,
  mobile:  <Smartphone size={17} strokeWidth={2.25} />,
}

const USER_OPTIONS = MOCK_USER_ACCOUNTS.map(u => ({
  value: u.id,
  label: u.name,
  user: u,
}))

export function DevToolsPanel() {
  const { device, setDevice } = useDevTools()
  const { user, devSetUser } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const { token } = theme.useToken()

  return (
    <div style={{
      position: 'fixed',
      bottom: 16,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      pointerEvents: 'none',
    }}>
      {/* Collapse toggle tab */}
      <button
        onClick={() => setCollapsed(p => !p)}
        style={{
          pointerEvents: 'all',
          background: token.colorBgLayout,
          border: `0.5px solid ${token.colorBorderSecondary}`,
          borderRadius: 20,
          color: token.colorTextSecondary,
          fontSize: 11,
          padding: '3px 12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          boxShadow: token.boxShadow,
        }}
      >
        {collapsed ? <ChevronUp size={13} strokeWidth={2.25} /> : <Minus size={13} strokeWidth={2.25} />}
        <span>DevTools</span>
      </button>

      {/* Main panel */}
      {!collapsed && (
        <div style={{
          pointerEvents: 'all',
          background: token.colorBgLayout,
          borderRadius: token.borderRadiusLG,
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          boxShadow: token.boxShadowSecondary,
          border: `0.5px solid ${token.colorBorderSecondary}`,
          maxWidth: 720,
        }}>
          {/* Device switcher */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Typography.Text style={{ color: token.colorTextQuaternary, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              Viewport
            </Typography.Text>
            <Space size={4}>
              {(['desktop', 'tablet', 'mobile'] as DeviceSize[]).map(d => (
                <Tooltip key={d} title={DEVICE_CONFIG[d].label} zIndex={10000}>
                  <Button
                    type={device === d ? 'primary' : 'default'}
                    icon={DEVICE_ICONS[d]}
                    onClick={() => setDevice(d)}
                  />
                </Tooltip>
              ))}
            </Space>
          </div>

          {/* User switcher */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, position: 'relative' }}>
            <Typography.Text style={{ color: token.colorTextQuaternary, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              User
            </Typography.Text>
            <Select
              value={user?.id}
              placeholder="Not signed in"
              style={{ width: 260 }}
              popupMatchSelectWidth={false}
              placement="topLeft"
              getPopupContainer={trigger => trigger.parentElement ?? trigger}
              onChange={id => {
                const account = MOCK_USER_ACCOUNTS.find(a => a.id === id)
                if (account) devSetUser(account)
              }}
              options={USER_OPTIONS}
              optionRender={option => {
                const u = option.data.user as UserAccount
                return (
                  <Space size={6}>
                    <Avatar icon={<User size={15} strokeWidth={2.25} />} size={24} style={{ background: token.colorFill, flexShrink: 0 }} />
                    <span style={{ fontSize: 13 }}>{u.name}</span>
                    <Tag color={ROLE_TAG_COLOR[u.role]} style={{ margin: 0 }}>{ROLE_LABELS[u.role]}</Tag>
                  </Space>
                )
              }}
              labelRender={label => {
                const account = MOCK_USER_ACCOUNTS.find(a => a.id === label.value)
                if (!account) return label.label
                return (
                  <Space size={6}>
                    <Avatar icon={<User size={15} strokeWidth={2.25} />} size={24} style={{ background: token.colorPrimaryActive, flexShrink: 0 }} />
                    <span style={{ fontSize: 13 }}>{account.name}</span>
                    <Tag color={ROLE_TAG_COLOR[account.role]} style={{ margin: 0 }}>{ROLE_LABELS[account.role]}</Tag>
                  </Space>
                )
              }}
            />
          </div>

          {/* Current state readout */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Typography.Text style={{ color: token.colorTextQuaternary, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              Active
            </Typography.Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, lineHeight: 1.3 }}>
              <Typography.Text style={{ color: token.colorText, fontSize: 12, whiteSpace: 'nowrap' }}>
                {user ? user.name : 'Not signed in'}
              </Typography.Text>
              {user && (
                <Typography.Text style={{ color: token.colorTextTertiary, fontSize: 12, whiteSpace: 'nowrap' }}>
                  {user.branch ?? 'All branches'}
                </Typography.Text>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
