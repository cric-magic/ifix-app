import { Avatar, Dropdown, Space, Tag, Typography } from 'antd'
import { User, BookOpen, ChevronDown, Home, Crosshair, ArrowLeft } from 'lucide-react'
import { useDevTools, DEVICE_PRESETS, DEVICE_PRESET_LABELS, THEME_LABELS } from '../contexts/DevToolsContext'
import { useAuth } from '../contexts/AuthContext'
import { ROLE_LABELS, ROLE_TAG_COLOR } from '../constants/roles'
import { MOCK_USER_ACCOUNTS } from '../constants/mockUsers'
import { getAvatarUrl } from '../utils/avatar'
import type { ThemeVariant } from '../contexts/DevToolsContext'
import type { ItemType } from 'antd/es/menu/interface'

const MENU_BAR_FONT_SIZE = 13

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

export function DevToolsPanel() {
  const { windowSize, setWindowSize, themeVariant, setThemeVariant, inspectMode, setInspectMode } = useDevTools()
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

  const userItems: ItemType[] = MOCK_USER_ACCOUNTS.map(u => ({
    key: u.id,
    label: (
      <Space size={6}>
        <Avatar
          src={getAvatarUrl(u.id)}
          icon={<User size={15} strokeWidth={2.25} />}
          size={20}
          style={{ background: BAR_FILL, flexShrink: 0 }}
        />
        <span style={{ fontSize: MENU_BAR_FONT_SIZE }}>{u.name}</span>
        <Tag color={ROLE_TAG_COLOR[u.role]} style={{ margin: 0 }}>{ROLE_LABELS[u.role]}</Tag>
      </Space>
    ),
  }))

  // The design-docs page is a standalone reference, not the app itself —
  // none of the normal menu bar's app-state controls (viewport, theme,
  // signed-in user, Inspect) apply there, so instead of hiding them one by
  // one, swap in a minimal bar with just a way back out. Same floating-pill
  // treatment (rounded, inset from the edges) as the main bar below, for
  // consistency between the two — this one just has no wallpaper to reveal
  // on the sides, only the plain page background.
  if (isDesignDocs) {
    return (
      <div data-ifix-devtools-bar style={{
        flexShrink: 0,
        height: 44,
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        margin: '8px 8px 0',
        background: BAR_BG,
        backdropFilter: BAR_BLUR,
        WebkitBackdropFilter: BAR_BLUR,
        borderRadius: 8,
        position: 'relative',
        zIndex: 100,
      }}>
        <a
          href="/"
          className="ifix-menubar-item"
          style={{ display: 'flex', alignItems: 'center', gap: 8, color: BAR_TEXT, fontSize: MENU_BAR_FONT_SIZE }}
        >
          <ArrowLeft size={14} strokeWidth={2.25} />
          <span>Back to Prototype</span>
        </a>
      </div>
    )
  }

  return (
    <div data-ifix-devtools-bar style={{
      flexShrink: 0,
      height: 44,
      display: 'flex',
      alignItems: 'center',
      padding: '0 8px',
      // Pure black at reduced opacity + a blur of whatever's behind it
      // (the desktop wallpaper) — a frosted-glass menu bar floating over
      // the wallpaper instead of a solid strip that pushes it down. Fixed
      // to the viewport (not `relative`, its previous value) so it stays
      // pinned above the wallpaper as an overlay while the windowed app
      // scrolls/resizes underneath, the same way a real OS's menu bar
      // floats over the desktop rather than being laid out as part of it.
      background: BAR_BG,
      backdropFilter: BAR_BLUR,
      WebkitBackdropFilter: BAR_BLUR,
      // Rounded + inset 8px on all three visible sides (top/left/right —
      // was flush edge-to-edge, radius 0) so it reads as a floating pill
      // with the wallpaper visible around it, rather than a flat strip
      // spanning the full viewport width.
      borderRadius: 8,
      position: 'fixed',
      top: 8,
      left: 8,
      right: 8,
      // Below antd's own popup z-index (zIndexPopupBase, ~1000) so Select/
      // Dropdown menus render above the bar instead of behind it — this only
      // needs to clear the desktop stage/app content below it, not popups.
      zIndex: 100,
    }}>
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
