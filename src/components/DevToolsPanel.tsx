import { useState } from 'react'
import { Avatar, Space, Tag, Tooltip, Typography } from 'antd'
import {
  DesktopOutlined, TabletOutlined, MobileOutlined,
  UserOutlined, MinusOutlined, UpOutlined,
} from '@ant-design/icons'
import { useDevTools, DEVICE_CONFIG } from '../contexts/DevToolsContext'
import { useAuth } from '../contexts/AuthContext'
import { MOCK_USERS } from '../constants/roles'
import type { DeviceSize } from '../contexts/DevToolsContext'

const ROLE_COLOR: Record<string, string> = { admin: '#1677ff', retail: '#52c41a' }

const DEVICE_ICONS: Record<DeviceSize, React.ReactNode> = {
  desktop: <DesktopOutlined />,
  tablet:  <TabletOutlined />,
  mobile:  <MobileOutlined />,
}

export function DevToolsPanel() {
  const { device, setDevice } = useDevTools()
  const { user, setUser } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

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
          background: '#1a1a2e',
          border: 'none',
          borderRadius: 20,
          color: '#aaa',
          fontSize: 11,
          padding: '3px 12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {collapsed ? <UpOutlined style={{ fontSize: 9 }} /> : <MinusOutlined style={{ fontSize: 9 }} />}
        <span>DevTools</span>
      </button>

      {/* Main panel */}
      {!collapsed && (
        <div style={{
          pointerEvents: 'all',
          background: '#1a1a2e',
          borderRadius: 12,
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 20,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          border: '1px solid #2e2e4e',
        }}>

          {/* Device switcher */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Typography.Text style={{ color: '#666', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              Viewport
            </Typography.Text>
            <Space size={4}>
              {(['desktop', 'tablet', 'mobile'] as DeviceSize[]).map(d => (
                <Tooltip key={d} title={DEVICE_CONFIG[d].label} zIndex={10000}>
                  <button
                    onClick={() => setDevice(d)}
                    style={{
                      background: device === d ? '#1677ff' : '#2a2a44',
                      border: 'none',
                      borderRadius: 6,
                      color: device === d ? '#fff' : '#888',
                      width: 32,
                      height: 32,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 15,
                      transition: 'all 0.15s',
                    }}
                  >
                    {DEVICE_ICONS[d]}
                  </button>
                </Tooltip>
              ))}
            </Space>
          </div>

          <div style={{ width: 1, height: 40, background: '#2e2e4e' }} />

          {/* User switcher */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Typography.Text style={{ color: '#666', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              User
            </Typography.Text>
            <Space size={6} wrap>
              {MOCK_USERS.map(u => {
                const isActive = user.id === u.id
                return (
                  <Tooltip
                    key={u.id}
                    zIndex={10000}
                    title={
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                        <div style={{ opacity: 0.75 }}>{u.role} · {u.branch}</div>
                      </div>
                    }
                  >
                    <button
                      onClick={() => setUser(u)}
                      style={{
                        background: isActive ? ROLE_COLOR[u.role] : '#2a2a44',
                        border: isActive ? `1.5px solid ${ROLE_COLOR[u.role]}` : '1.5px solid transparent',
                        borderRadius: 20,
                        padding: '3px 10px 3px 4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        transition: 'all 0.15s',
                      }}
                    >
                      <Avatar
                        icon={<UserOutlined />}
                        size={18}
                        style={{ background: isActive ? 'rgba(255,255,255,0.3)' : '#3a3a5e', flexShrink: 0 }}
                      />
                      <span style={{ color: isActive ? '#fff' : '#aaa', fontSize: 12, whiteSpace: 'nowrap' }}>
                        {u.name.split(' ')[0]}
                      </span>
                      <Tag
                        style={{
                          margin: 0,
                          fontSize: 10,
                          padding: '0 4px',
                          lineHeight: '16px',
                          background: isActive ? 'rgba(255,255,255,0.2)' : '#3a3a5e',
                          border: 'none',
                          color: isActive ? '#fff' : '#777',
                          borderRadius: 3,
                        }}
                      >
                        {u.role}
                      </Tag>
                    </button>
                  </Tooltip>
                )
              })}
            </Space>
          </div>

          <div style={{ width: 1, height: 40, background: '#2e2e4e' }} />

          {/* Current state readout */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography.Text style={{ color: '#666', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              Active
            </Typography.Text>
            <Typography.Text style={{ color: '#eee', fontSize: 12, whiteSpace: 'nowrap' }}>
              {DEVICE_CONFIG[device].label}
              {device !== 'desktop' && (
                <span style={{ color: '#666' }}> · {DEVICE_CONFIG[device].width}px</span>
              )}
            </Typography.Text>
            <Typography.Text style={{ color: '#eee', fontSize: 12, whiteSpace: 'nowrap' }}>
              {user.name}
              <span style={{ color: '#666' }}> · {user.branch}</span>
            </Typography.Text>
          </div>

        </div>
      )}
    </div>
  )
}
