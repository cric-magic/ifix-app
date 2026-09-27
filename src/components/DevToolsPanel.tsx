import { useEffect, useRef, useState } from 'react'
import { App, Avatar, Dropdown, Space, Tag, Typography } from 'antd'
import { User, BookOpen, ChevronDown, Home, Crosshair, Play, X, Link2, MoreHorizontal, Check, SlidersHorizontal } from 'lucide-react'
import { useDevTools, DEVICE_PRESETS, DEVICE_PRESET_LABELS, THEME_LABELS } from '../contexts/DevToolsContext'
import { useAuth } from '../contexts/AuthContext'
import { ROLE_LABELS, ROLE_TAG_COLOR } from '../constants/roles'
import { MOCK_USER_ACCOUNTS } from '../constants/mockUsers'
import { getAvatarUrl } from '../utils/avatar'
import type { ThemeVariant } from '../contexts/DevToolsContext'
import type { ItemType } from 'antd/es/menu/interface'

const MENU_BAR_FONT_SIZE = 13

// Below this real browser width the bar's three groups no longer fit on one
// line, so it switches to its compact layout (see DevToolsPanel).
const COMPACT_BAR_MAX_WIDTH = 880

// This bar is dev-only tooling chrome floating over the simulated desktop,
// not branded app UI — it should read the same regardless of which theme
// (including Light) the app underneath it is currently showing, so unlike
// everywhere else in this codebase it deliberately does NOT read from
// `theme.useToken()`. These are the same white-alpha values antd's own
// dark algorithm computes by default for text/fill tiers on a dark
// surface, used here as fixed constants instead of a reactive token.
const BAR_BG = 'rgba(0, 0, 0, 0.5)'
const BAR_TEXT = 'rgba(255, 255, 255, 0.85)'
const BAR_TEXT_SECONDARY = 'rgba(255, 255, 255, 0.65)'
const BAR_TEXT_TERTIARY = 'rgba(255, 255, 255, 0.45)'
const BAR_FILL = 'rgba(255, 255, 255, 0.18)'
const BAR_FILL_SECONDARY = 'rgba(255, 255, 255, 0.12)'
const BAR_BLUR = 'blur(12px)'

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
        color: BAR_TEXT,
        fontSize: MENU_BAR_FONT_SIZE,
      }}>
        <span>{children}</span>
        <ChevronDown size={12} strokeWidth={2.25} />
      </div>
    </Dropdown>
  )
}

// The account picker's entries — avatar, name and role — shared by the menu
// bar and preview's tools button.
function accountItems(): ItemType[] {
  return MOCK_USER_ACCOUNTS.map(u => ({
    key: u.id,
    label: (
      <Space size={6}>
        <Avatar
          src={getAvatarUrl(u.id)}
          icon={<User size={16} strokeWidth={2.25} />}
          size={20}
          style={{ background: BAR_FILL, flexShrink: 0 }}
        />
        <span style={{ fontSize: MENU_BAR_FONT_SIZE }}>{u.name}</span>
        <Tag color={ROLE_TAG_COLOR[u.role]} style={{ margin: 0 }}>{ROLE_LABELS[u.role]}</Tag>
      </Space>
    ),
  }))
}

// A link that opens straight into preview, as the same account and in the
// same theme — for sending to a client. Read back by DevToolsContext
// (preview, theme) and AuthContext (as).
function previewLink(theme: ThemeVariant, accountId?: string): string {
  const params = new URLSearchParams({ preview: '1', theme })
  if (accountId) params.set('as', accountId)
  return `${window.location.origin}${window.location.pathname}?${params}`
}

export function DevToolsPanel() {
  const { windowSize, setWindowSize, themeVariant, setThemeVariant, inspectMode, setInspectMode, previewMode, setPreviewMode, viewport } = useDevTools()
  const compact = viewport.width < COMPACT_BAR_MAX_WIDTH
  const { user, devSetUser } = useAuth()
  // DevToolsPanel renders as a sibling above <RouterProvider> in App.tsx
  // (a shared flex parent for both the windowed app and the standalone
  // /design-docs page), not inside the router tree — so useLocation() isn't
  // available here. That's fine: /design-docs is only ever reached via a
  // real page load (the Docs link opens it in a new tab; there's no
  // SPA-internal navigate() to it anywhere), so a plain read of
  // window.location.pathname at render time is already correct for this
  // component's whole lifetime — no reactivity to in-app navigation needed.
  const isDesignDocs = window.location.pathname === '/design-docs'

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

  const userItems = accountItems()

  // The design-docs page is a standalone reference, not the app itself —
  // none of the normal menu bar's app-state controls (viewport, theme,
  // signed-in user, Inspect) apply there, and per explicit direction the
  // page no longer gets any top bar at all, not even the minimal
  // "Back to Prototype" one this used to swap in.
  // Preview hides the whole bar; PreviewControls (below) is the way back.
  if (isDesignDocs || previewMode) {
    return null
  }

  const barStyle: React.CSSProperties = {
    flexShrink: 0,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    padding: '0 8px',
    background: BAR_BG,
    backdropFilter: BAR_BLUR,
    WebkitBackdropFilter: BAR_BLUR,
    borderRadius: 8,
    position: 'fixed',
    top: 8,
    left: 8,
    right: 8,
    zIndex: 100,
  }

  const accountTrigger = (
    <MenuBarTrigger
      items={userItems}
      onSelect={id => {
        const account = MOCK_USER_ACCOUNTS.find(a => a.id === id)
        if (account) devSetUser(account)
      }}
    >
      {user ? user.name : 'Not signed in'}
    </MenuBarTrigger>
  )

  // Compact (a narrow real window, e.g. a phone): the account stays up
  // front and Preview stays one tap away; the viewport and theme pickers,
  // Inspect and Docs fold into one "…" menu, each current choice ticked.
  if (compact) {
    const tick = (on: boolean) => on ? <Check size={14} strokeWidth={2.25} /> : null
    const moreItems: ItemType[] = [
      {
        type: 'group',
        label: 'Viewport',
        children: Object.keys(DEVICE_PRESETS).map(key => ({
          key: `viewport:${key}`,
          label: `${DEVICE_PRESET_LABELS[key]} · ${DEVICE_PRESETS[key].width}×${DEVICE_PRESETS[key].height}`,
          extra: tick(key === matchedPreset),
        })),
      },
      {
        type: 'group',
        label: 'Theme',
        children: (['neutral', 'blue', 'light'] as ThemeVariant[]).map(t => ({
          key: `theme:${t}`,
          label: THEME_LABELS[t],
          extra: tick(t === themeVariant),
        })),
      },
      { type: 'divider' },
      { key: 'inspect', icon: <Crosshair size={14} strokeWidth={2.25} />, label: 'Inspect', extra: tick(inspectMode) },
      { key: 'docs', icon: <BookOpen size={14} strokeWidth={2.25} />, label: 'Docs' },
    ]

    function onMore(key: string) {
      if (key.startsWith('viewport:')) setWindowSize(DEVICE_PRESETS[key.slice('viewport:'.length)])
      else if (key.startsWith('theme:')) setThemeVariant(key.slice('theme:'.length) as ThemeVariant)
      else if (key === 'inspect') setInspectMode(!inspectMode)
      else if (key === 'docs') window.open('/design-docs', '_blank', 'noreferrer')
    }

    const iconButton: React.CSSProperties = {
      display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer',
      background: 'transparent', color: BAR_TEXT, padding: '0 10px',
    }

    return (
      <div data-ifix-devtools-bar style={barStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
          <a href="/" aria-label="Home" className="ifix-menubar-item" style={{ display: 'flex', alignItems: 'center', color: BAR_TEXT, flexShrink: 0 }}>
            <Home size={16} strokeWidth={2.25} />
          </a>
          <div className="ifix-menubar-compact-account" style={{ minWidth: 0 }}>{accountTrigger}</div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          <button type="button" aria-label="Preview" className="ifix-menubar-item" style={iconButton} onClick={() => setPreviewMode(true)}>
            <Play size={16} strokeWidth={2.25} />
          </button>
          <Dropdown trigger={['click']} placement="bottomRight" menu={{ items: moreItems, onClick: ({ key }) => onMore(key) }}>
            <button type="button" aria-label="More tools" className="ifix-menubar-item" style={iconButton}>
              <MoreHorizontal size={16} strokeWidth={2.25} />
            </button>
          </Dropdown>
        </div>
      </div>
    )
  }

  return (
    <div data-ifix-devtools-bar style={barStyle}>
      {/* Left: Home (back to the app — mainly useful from the standalone
          /design-docs page, which has no sidebar of its own to navigate
          from) + User identity + branch info text. Home/User use a tighter
          4px gap than User/branch-text (8px) since the trigger items
          already carry their own horizontal padding from .ifix-menubar-item —
          a shared larger gap read as too much air between Home and User. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <a
            href="/"
            className="ifix-menubar-item"
            style={{ display: 'flex', alignItems: 'center', color: BAR_TEXT }}
          >
            <Home size={16} strokeWidth={2.25} />
          </a>

          {accountTrigger}
        </div>
        {user && (
          <Typography.Text style={{ color: BAR_TEXT_TERTIARY, fontSize: MENU_BAR_FONT_SIZE }}>
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

      {/* Right: Inspect toggle + Docs link */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
      {/* Preview — the app on its own at the real screen size, without the
          desktop, window frame or this bar (see PreviewControls). */}
      <button
        type="button"
        onClick={() => setPreviewMode(true)}
        className="ifix-menubar-item"
        style={{
          display: 'flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer',
          background: 'transparent', color: BAR_TEXT_SECONDARY, fontSize: MENU_BAR_FONT_SIZE,
        }}
      >
        <Play size={14} strokeWidth={2.25} />
        <span>Preview</span>
      </button>

      {/* Active state reuses the exact hover background (colorFillSecondary,
          via .ifix-menubar-item:hover elsewhere in this bar) rather than a
          separate "selected" color — so toggled-on just looks like it's
          permanently in the state hovering it would put it in. */}
      <button
        type="button"
        onClick={() => setInspectMode(!inspectMode)}
        className="ifix-menubar-item"
        style={{
          display: 'flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer',
          background: inspectMode ? BAR_FILL_SECONDARY : 'transparent',
          color: inspectMode ? BAR_TEXT : BAR_TEXT_SECONDARY,
          fontSize: MENU_BAR_FONT_SIZE,
        }}
      >
        <Crosshair size={14} strokeWidth={2.25} />
        <span>Inspect</span>
      </button>

      {/* Docs — a plain link, not a dropdown. The docs page has its own
          in-page table of contents (Typography/Colors/Spacing) now, so a
          menu of shortcuts into it here was redundant with that. */}
      <a
        href="/design-docs"
        target="_blank"
        rel="noreferrer"
        className="ifix-menubar-item"
        style={{ display: 'flex', alignItems: 'center', gap: 8, color: BAR_TEXT, fontSize: MENU_BAR_FONT_SIZE, flexShrink: 0 }}
      >
        <BookOpen size={14} strokeWidth={2.25} />
        <span>Docs</span>
      </a>
      </div>
    </div>
  )
}

// Whether an overlay that Esc should close first is open — a drawer, modal,
// menu or picker. Esc then belongs to it; the next Esc exits preview.
function overlayOpen(): boolean {
  return [...document.querySelectorAll<HTMLElement>(
    '.ant-drawer-open, .ant-modal-wrap, .ant-dropdown, .ant-select-dropdown, .ant-picker-dropdown, .ant-image-preview',
  )].some(el => el.getClientRects().length > 0 && !/-hidden\b/.test(el.className))
}

// Preview's only chrome. With a mouse: a small pill at the top centre with
// Exit preview and Copy link, shown for a moment on entering, then out of
// the way until the pointer comes up to the top edge, like a video player's
// controls; Esc exits too. On a touch screen (a real phone, where preview
// starts by itself and the simulated desktop is no use to exit to): a
// floating tools button instead, for switching account or theme in place.
export function PreviewControls() {
  const { previewMode } = useDevTools()
  const [coarsePointer] = useState(() => window.matchMedia('(pointer: coarse)').matches)
  if (!previewMode) return null
  // Remounted each time preview starts, so the pill always shows first.
  return coarsePointer ? <PreviewToolsButton /> : <PreviewPill />
}

// Touch screens' preview tools: a round button in the bottom-right corner
// (lifted above a detail page's bottom action bar — see
// .ifix-preview-tools in index.css) opening the account and theme pickers
// and Copy link.
function PreviewToolsButton() {
  const { themeVariant, setThemeVariant } = useDevTools()
  const { user, devSetUser } = useAuth()
  const { message } = App.useApp()

  const tick = (on: boolean) => on ? <Check size={14} strokeWidth={2.25} /> : null
  const items: ItemType[] = [
    // Inline rather than a submenu: a flyout opens on hover (so not on a
    // tap) and runs off a phone-width screen.
    {
      type: 'group',
      label: 'Account',
      children: accountItems().map(item => item && 'key' in item
        ? { ...item, key: `account:${item.key}`, extra: tick(item.key === user?.id) }
        : item),
    },
    {
      type: 'group',
      label: 'Theme',
      children: (['neutral', 'blue', 'light'] as ThemeVariant[]).map(t => ({
        key: `theme:${t}`,
        label: THEME_LABELS[t],
        extra: tick(t === themeVariant),
      })),
    },
    { type: 'divider' },
    { key: 'copy', icon: <Link2 size={14} strokeWidth={2.25} />, label: 'Copy link' },
  ]

  function onSelect(key: string) {
    if (key.startsWith('account:')) {
      const account = MOCK_USER_ACCOUNTS.find(a => a.id === key.slice('account:'.length))
      if (account) devSetUser(account)
    } else if (key.startsWith('theme:')) {
      setThemeVariant(key.slice('theme:'.length) as ThemeVariant)
    } else if (key === 'copy') {
      navigator.clipboard.writeText(previewLink(themeVariant, user?.id))
        .then(() => message.success('Preview link copied'))
        .catch(() => message.error('Could not copy the link'))
    }
  }

  return (
    <Dropdown trigger={['click']} placement="topRight" menu={{ items, onClick: ({ key }) => onSelect(key) }}>
      <button
        type="button"
        aria-label="Prototype tools"
        className="ifix-preview-tools"
        style={{
          position: 'fixed',
          right: 16,
          bottom: 16,
          zIndex: 1100,
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: BAR_BG,
          backdropFilter: BAR_BLUR,
          WebkitBackdropFilter: BAR_BLUR,
          color: BAR_TEXT,
          cursor: 'pointer',
        }}
      >
        <SlidersHorizontal size={16} strokeWidth={2.25} />
      </button>
    </Dropdown>
  )
}

// The pointer counts as "at the top" within this many px of the edge.
const REVEAL_ZONE = 56

function PreviewPill() {
  const { setPreviewMode, themeVariant } = useDevTools()
  const { user } = useAuth()
  const { message } = App.useApp()
  const [shown, setShown] = useState(true)
  const hovering = useRef(false)

  useEffect(() => {
    let timer = window.setTimeout(() => setShown(false), 2500)
    function hideSoon() {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => { if (!hovering.current) setShown(false) }, 800)
    }
    function onMove(e: MouseEvent) {
      if (e.clientY <= REVEAL_ZONE) {
        window.clearTimeout(timer)
        setShown(true)
      } else if (!hovering.current) {
        hideSoon()
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !overlayOpen()) setPreviewMode(false)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('keydown', onKey)
    }
  }, [setPreviewMode])

  function copyLink() {
    navigator.clipboard.writeText(previewLink(themeVariant, user?.id))
      .then(() => message.success('Preview link copied'))
      .catch(() => message.error('Could not copy the link'))
  }

  const itemStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer',
    background: 'transparent', color: BAR_TEXT, fontSize: MENU_BAR_FONT_SIZE,
  }

  return (
    <div
      onMouseEnter={() => { hovering.current = true; setShown(true) }}
      onMouseLeave={() => { hovering.current = false }}
      style={{
        position: 'fixed',
        top: 8,
        left: '50%',
        transform: `translate(-50%, ${shown ? 0 : -8}px)`,
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: 4,
        // Centred with left: 50%, which on its own caps an auto width at
        // half the screen — on a narrow window the labels broke onto two
        // lines. max-content keeps it one row at its natural width.
        width: 'max-content',
        whiteSpace: 'nowrap',
        background: BAR_BG,
        backdropFilter: BAR_BLUR,
        WebkitBackdropFilter: BAR_BLUR,
        borderRadius: 8,
        opacity: shown ? 1 : 0,
        pointerEvents: shown ? 'auto' : 'none',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
      }}
    >
      <button type="button" className="ifix-menubar-item" style={itemStyle} onClick={() => setPreviewMode(false)}>
        <X size={14} strokeWidth={2.25} />
        <span>Exit preview</span>
        <span style={{ color: BAR_TEXT_TERTIARY }}>Esc</span>
      </button>
      <button type="button" className="ifix-menubar-item" style={{ ...itemStyle, color: BAR_TEXT_SECONDARY }} onClick={copyLink}>
        <Link2 size={14} strokeWidth={2.25} />
        <span>Copy link</span>
      </button>
    </div>
  )
}
