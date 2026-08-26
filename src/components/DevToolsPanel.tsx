import { Avatar, Dropdown, Space, Tag, Typography, theme } from 'antd'
import { User, BookOpen, ChevronDown, Home } from 'lucide-react'
import { useDevTools, DEVICE_PRESETS, DEVICE_PRESET_LABELS, THEME_LABELS } from '../contexts/DevToolsContext'
import { useAuth } from '../contexts/AuthContext'
import { ROLE_LABELS, ROLE_TAG_COLOR } from '../constants/roles'
import { MOCK_USER_ACCOUNTS } from '../constants/mockUsers'
import { getAvatarUrl } from '../utils/avatar'
import type { ThemeVariant } from '../contexts/DevToolsContext'
import type { ItemType } from 'antd/es/menu/interface'

const DOCS_MENU_ITEMS = [
  { key: 'overview', label: 'Design Docs', href: '/design-docs' },
  { key: 'typography', label: 'Typography', href: '/design-docs#typography' },
  { key: 'colors', label: 'Colors', href: '/design-docs#colors' },
]

const MENU_BAR_FONT_SIZE = 13

// A macOS-style menu bar item: plain text immediately followed by a chevron
// (8px gap, no reserved trigger-box width) with no border/background/shadow
// until opened — a plain Dropdown trigger rather than an antd Select, which
// always reserves its own padded box for the arrow and (via the shared
// "every input-like control gets a shadow" rule in index.css) picks up the
// same drop shadow as real form inputs regardless of `variant="borderless"`.
function MenuBarTrigger({ items, onSelect, children }: {
  items: ItemType[]
  onSelect?: (key: string) => void
  children: React.ReactNode
}) {
  const { token } = theme.useToken()
  return (
    <Dropdown
      menu={{ items, onClick: ({ key }) => onSelect?.(key) }}
      trigger={['click']}
    >
      <div className="ifix-menubar-item" style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        cursor: 'pointer',
        color: token.colorText,
        fontSize: MENU_BAR_FONT_SIZE,
      }}>
        <span>{children}</span>
        <ChevronDown size={12} strokeWidth={2.25} />
      </div>
    </Dropdown>
  )
}

export function DevToolsPanel() {
  const { windowSize, setWindowSize, themeVariant, setThemeVariant } = useDevTools()
  const { user, devSetUser } = useAuth()
  const { token } = theme.useToken()

  const matchedPreset = Object.keys(DEVICE_PRESETS).find(
    key => DEVICE_PRESETS[key].width === windowSize.width && DEVICE_PRESETS[key].height === windowSize.height,
  )
  const viewportLabel = matchedPreset
    ? `${DEVICE_PRESET_LABELS[matchedPreset]} · ${windowSize.width}×${windowSize.height}`
    : `Custom · ${windowSize.width}×${windowSize.height}`

  const viewportItems: ItemType[] = Object.keys(DEVICE_PRESETS).map(key => ({
    key,
    label: `${DEVICE_PRESET_LABELS[key]} · ${DEVICE_PRESETS[key].width}×${DEVICE_PRESETS[key].height}`,
  }))

  const themeItems: ItemType[] = (['neutral', 'blue', 'light'] as ThemeVariant[]).map(t => ({
    key: t,
    label: THEME_LABELS[t],
  }))

  const userItems: ItemType[] = MOCK_USER_ACCOUNTS.map(u => ({
    key: u.id,
    label: (
      <Space size={6}>
        <Avatar
          src={getAvatarUrl(u.id)}
          icon={<User size={15} strokeWidth={2.25} />}
          size={20}
          style={{ background: token.colorFill, flexShrink: 0 }}
        />
        <span style={{ fontSize: MENU_BAR_FONT_SIZE }}>{u.name}</span>
        <Tag color={ROLE_TAG_COLOR[u.role]} style={{ margin: 0 }}>{ROLE_LABELS[u.role]}</Tag>
      </Space>
    ),
  }))

  return (
    <div style={{
      flexShrink: 0,
      height: 44,
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      background: token.colorBgElevated,
      borderBottom: `0.5px solid ${token.colorBorderSecondary}`,
      position: 'relative',
      // Below antd's own popup z-index (zIndexPopupBase, ~1000) so Select/
      // Dropdown menus render above the bar instead of behind it — this only
      // needs to clear the desktop stage/app content below it, not popups.
      zIndex: 100,
    }}>
      {/* Left: Home (back to the app — mainly useful from the standalone
          /design-docs page, which has no sidebar of its own to navigate
          from) + User identity + branch info text. Home/User use a tighter
          4px gap than User/branch-text (10px) since the trigger items
          already carry their own 6px/10px padding from .ifix-menubar-item —
          a shared larger gap read as too much air between Home and User. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <a
            href="/"
            className="ifix-menubar-item"
            style={{ display: 'flex', alignItems: 'center', color: token.colorText }}
          >
            <Home size={15} strokeWidth={2.25} />
          </a>

          <MenuBarTrigger
            items={userItems}
            onSelect={id => {
              const account = MOCK_USER_ACCOUNTS.find(a => a.id === id)
              if (account) devSetUser(account)
            }}
          >
            {user ? user.name : 'Not signed in'}
          </MenuBarTrigger>
        </div>
        {user && (
          <Typography.Text style={{ color: token.colorTextTertiary, fontSize: MENU_BAR_FONT_SIZE }}>
            {user.branch ?? 'All branches'}
          </Typography.Text>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* Middle: Viewport size + Theme */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <MenuBarTrigger items={viewportItems} onSelect={key => setWindowSize(DEVICE_PRESETS[key])}>
          {viewportLabel}
        </MenuBarTrigger>
        <MenuBarTrigger items={themeItems} onSelect={key => setThemeVariant(key as ThemeVariant)}>
          {THEME_LABELS[themeVariant]}
        </MenuBarTrigger>
      </div>

      <div style={{ flex: 1 }} />

      {/* Right: Docs */}
      <Dropdown
        menu={{
          items: DOCS_MENU_ITEMS.map(item => ({
            key: item.key,
            label: (
              <a href={item.href} target="_blank" rel="noreferrer">
                {item.label}
              </a>
            ),
          })),
        }}
        trigger={['click']}
      >
        <div className="ifix-menubar-item" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: token.colorText, fontSize: MENU_BAR_FONT_SIZE, flexShrink: 0 }}>
          <BookOpen size={14} strokeWidth={2.25} />
          <span>Docs</span>
          <ChevronDown size={12} strokeWidth={2.25} />
        </div>
      </Dropdown>
    </div>
  )
}
