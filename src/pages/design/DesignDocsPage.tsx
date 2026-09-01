import { useEffect, useRef, useState } from 'react'
import { Typography, Button, message, theme } from 'antd'
import { Copy, Check, ChevronDown, Crosshair, ArrowLeft } from 'lucide-react'
import { useIconColors } from '../../constants/iconColors'
import { useDevTools } from '../../contexts/DevToolsContext'
import { SPACING_SCALE, RADIUS_SCALE, BORDER_WIDTH_SCALE } from '../../constants/designTokens'
import { toHex } from '../../utils/colorTokenLookup'

// Grouped nav, same shape as antd's own docs sidebar (a group label that
// toggles collapse, non-navigable itself, over a set of real section links).
// "Foundations" holds the token scales; "Components" holds real rendered
// component specs (Button first — Input/Tag/etc. join this array as they're
// documented the same way, not as a new top-level group).
const TOC_GROUPS = [
  {
    id: 'foundations',
    label: 'Foundations',
    items: [
      { id: 'typography', label: 'Typography' },
      { id: 'colors', label: 'Colors' },
      { id: 'spacing', label: 'Spacing' },
      { id: 'radius', label: 'Radius' },
      { id: 'shadow', label: 'Shadow' },
      { id: 'border', label: 'Border' },
    ],
  },
  {
    id: 'components',
    label: 'Components',
    items: [
      { id: 'button', label: 'Button' },
    ],
  },
]

// The scale itself (CLAUDE.md's Spacing section) lives in designTokens.ts —
// shared with InspectorOverlay.tsx so a spacing value it reports always
// names the same scale entry this page renders. Gaps are still deliberate
// (e.g. nothing between 16 and 24, or 24 and 32) — a value that falls
// between two of these rounds down to the tighter one rather than
// introducing a new size.

// toHex (rgb()/rgba() → hex, for the docs' more portable, universally-
// recognized display/copy form) lives in utils/colorTokenLookup.ts, shared
// with InspectorOverlay.tsx so its popover prints colors the same way.

const TOC_IDS = TOC_GROUPS.flatMap(group => group.items.map(item => item.id))

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  const { token } = theme.useToken()
  return (
    <div id={id} className="ifix-table-panel" style={{ marginBottom: 24, scrollMarginTop: 20 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        height: 56,
        padding: '0 16px',
        boxShadow: `inset 0 -0.5px 0 0 ${token.colorBorderSecondary}`,
      }}>
        <Typography.Text strong style={{ fontSize: 15 }}>{title}</Typography.Text>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  )
}

function TypeRow({ label, sample, tokenLabel }: { label: string; sample: React.CSSProperties; tokenLabel: string }) {
  const { token } = theme.useToken()
  return (
    <div style={{
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 24,
      padding: '16px 0',
      borderBottom: `0.5px solid ${token.colorBorderSecondary}`,
    }}>
      <div style={{ ...sample, color: token.colorText }}>{label}</div>
      <Typography.Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap', fontFamily: token.fontFamilyCode }}>
        {tokenLabel}
      </Typography.Text>
    </div>
  )
}

function Swatch({ name, value, copyValue, tokenName, textOn }: { name: string; value: string; copyValue?: string; tokenName: string; textOn?: string }) {
  // `value` paints the swatch box (for text/icon tokens that's a neutral
  // backdrop to show the color on, e.g. colorBgElevated, not the token
  // itself). `copyValue` is what devs actually want to grab — defaults to
  // `value` for tokens where the two are the same thing (backgrounds,
  // fills, borders), and is passed explicitly wherever they differ
  // (text/icon tiers, where the real value is the `textOn` color).
  const displayValue = toHex(copyValue ?? value)
  const { token } = theme.useToken()
  const iconColors = useIconColors()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayValue)
    } catch {
      // Clipboard-write can be blocked by permissions policy (embedded
      // iframes, some sandboxed browser contexts) even on a plain click —
      // execCommand('copy') via a throwaway textarea still works there.
      const textarea = document.createElement('textarea')
      textarea.value = displayValue
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(textarea)
      if (!ok) {
        message.error('Copy failed — select and copy the value manually')
        return
      }
    }
    setCopied(true)
    message.success(`Copied ${displayValue}`)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 168 }}>
      <div style={{
        height: 64,
        borderRadius: 8,
        background: value,
        border: `0.5px solid ${token.colorBorderSecondary}`,
        display: 'flex',
        alignItems: 'flex-end',
        padding: 8,
      }}>
        {textOn && <span style={{ color: textOn, fontSize: 12 }}>Aa</span>}
      </div>
      <div>
        <Typography.Text style={{ fontSize: 13, display: 'block' }}>{name}</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 11, fontFamily: token.fontFamilyCode, display: 'block' }}>{tokenName}</Typography.Text>
        <div
          onClick={handleCopy}
          title="Click to copy"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            marginTop: 2,
            cursor: 'pointer',
            width: 'fit-content',
          }}
        >
          <Typography.Text
            style={{ fontSize: 11, fontFamily: token.fontFamilyCode, color: token.colorText, wordBreak: 'break-all' }}
          >
            {displayValue}
          </Typography.Text>
          {copied
            ? <Check size={11} strokeWidth={2.25} color={iconColors.secondary} style={{ flexShrink: 0 }} />
            : <Copy size={11} strokeWidth={2.25} color={iconColors.secondary} style={{ flexShrink: 0 }} />}
        </div>
      </div>
    </div>
  )
}

function SwatchRow({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>{children}</div>
}

function SpacingRow({ name, px }: { name: string; px: number }) {
  const { token } = theme.useToken()
  const iconColors = useIconColors()
  const [copied, setCopied] = useState(false)
  const displayValue = `${px}px`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayValue)
    } catch {
      // Clipboard-write can be blocked by permissions policy (embedded
      // iframes, some sandboxed browser contexts) even on a plain click —
      // execCommand('copy') via a throwaway textarea still works there.
      const textarea = document.createElement('textarea')
      textarea.value = displayValue
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(textarea)
      if (!ok) {
        message.error('Copy failed — select and copy the value manually')
        return
      }
    }
    setCopied(true)
    message.success(`Copied ${displayValue}`)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '8px 0',
      borderBottom: `0.5px solid ${token.colorBorderSecondary}`,
    }}>
      <Typography.Text style={{ width: 32, fontSize: 13, fontFamily: token.fontFamilyCode, flexShrink: 0 }}>
        {name}
      </Typography.Text>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Capped visual width (real scale runs up to 384px) — the point is
            to show relative proportions between nearby values, not to
            literally reproduce the largest ones at full size. */}
        <div style={{ width: Math.min(px, 320), height: 8, background: token.colorFillSecondary, borderRadius: 2 }} />
      </div>
      <div
        onClick={handleCopy}
        title="Click to copy"
        style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', width: 56, justifyContent: 'flex-end', flexShrink: 0 }}
      >
        <Typography.Text style={{ fontSize: 12, fontFamily: token.fontFamilyCode, color: token.colorText }}>
          {displayValue}
        </Typography.Text>
        {copied
          ? <Check size={11} strokeWidth={2.25} color={iconColors.secondary} style={{ flexShrink: 0 }} />
          : <Copy size={11} strokeWidth={2.25} color={iconColors.secondary} style={{ flexShrink: 0 }} />}
      </div>
    </div>
  )
}

function ShadowRow({ name, tokenName, value }: { name: string; tokenName: string; value: string }) {
  const { token } = theme.useToken()
  const iconColors = useIconColors()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = value
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(textarea)
      if (!ok) {
        message.error('Copy failed — select and copy the value manually')
        return
      }
    }
    setCopied(true)
    message.success(`Copied ${tokenName}`)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '8px 0',
      borderBottom: `0.5px solid ${token.colorBorderSecondary}`,
    }}>
      <Typography.Text style={{ width: 72, fontSize: 13, flexShrink: 0 }}>
        {name}
      </Typography.Text>
      <div style={{ flex: 1, minWidth: 0, display: 'flex' }}>
        {/* Backdrop is colorBgLayout (the real page canvas), not the panel's
            own colorBgContainer — against its own surface the shadow barely
            shows, same as it wouldn't in the app either. */}
        <div style={{
          width: '100%', maxWidth: 200, height: 48, background: token.colorBgLayout,
          borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: 96, height: 28, background: token.colorBgContainer, border: `0.5px solid ${token.colorBorderSecondary}`, borderRadius: 6, boxShadow: value }} />
        </div>
      </div>
      <div
        onClick={handleCopy}
        title="Click to copy"
        style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', width: 148, justifyContent: 'flex-end', flexShrink: 0 }}
      >
        <Typography.Text style={{ fontSize: 12, fontFamily: token.fontFamilyCode, color: token.colorText }}>
          {tokenName}
        </Typography.Text>
        {copied
          ? <Check size={11} strokeWidth={2.25} color={iconColors.secondary} style={{ flexShrink: 0 }} />
          : <Copy size={11} strokeWidth={2.25} color={iconColors.secondary} style={{ flexShrink: 0 }} />}
      </div>
    </div>
  )
}

function RadiusRow({ name, px }: { name: string; px: number }) {
  const { token } = theme.useToken()
  const iconColors = useIconColors()
  const [copied, setCopied] = useState(false)
  const displayValue = `${px}px`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayValue)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = displayValue
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(textarea)
      if (!ok) {
        message.error('Copy failed — select and copy the value manually')
        return
      }
    }
    setCopied(true)
    message.success(`Copied ${displayValue}`)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '8px 0',
      borderBottom: `0.5px solid ${token.colorBorderSecondary}`,
    }}>
      <Typography.Text style={{ width: 32, fontSize: 13, fontFamily: token.fontFamilyCode, flexShrink: 0 }}>
        {name}
      </Typography.Text>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* The shape itself, not a proportional bar — radius is much more
            legible as "how rounded does this look" than as a length. A
            999px radius on a 32px box just renders as a full pill/circle,
            which is exactly the right picture for it — no capping needed. */}
        <div style={{ width: 32, height: 32, background: token.colorFillSecondary, borderRadius: px }} />
      </div>
      <div
        onClick={handleCopy}
        title="Click to copy"
        style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', width: 56, justifyContent: 'flex-end', flexShrink: 0 }}
      >
        <Typography.Text style={{ fontSize: 12, fontFamily: token.fontFamilyCode, color: token.colorText }}>
          {displayValue}
        </Typography.Text>
        {copied
          ? <Check size={11} strokeWidth={2.25} color={iconColors.secondary} style={{ flexShrink: 0 }} />
          : <Copy size={11} strokeWidth={2.25} color={iconColors.secondary} style={{ flexShrink: 0 }} />}
      </div>
    </div>
  )
}

function BorderRow({ name, px }: { name: string; px: number }) {
  const { token } = theme.useToken()
  const iconColors = useIconColors()
  const [copied, setCopied] = useState(false)
  const displayValue = `${px}px`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayValue)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = displayValue
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(textarea)
      if (!ok) {
        message.error('Copy failed — select and copy the value manually')
        return
      }
    }
    setCopied(true)
    message.success(`Copied ${displayValue}`)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '8px 0',
      borderBottom: `0.5px solid ${token.colorBorderSecondary}`,
    }}>
      <Typography.Text style={{ width: 32, fontSize: 13, fontFamily: token.fontFamilyCode, flexShrink: 0 }}>
        {name}
      </Typography.Text>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* The line weight itself, same reasoning as RadiusRow's shape — at
            0.5px vs 1px, a proportional bar would round both to the same
            rendered pixel; the border is the only way to actually show the
            difference. */}
        <div style={{ width: 32, height: 32, borderRadius: 6, border: `${px}px solid ${token.colorBorder}` }} />
      </div>
      <div
        onClick={handleCopy}
        title="Click to copy"
        style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', width: 56, justifyContent: 'flex-end', flexShrink: 0 }}
      >
        <Typography.Text style={{ fontSize: 12, fontFamily: token.fontFamilyCode, color: token.colorText }}>
          {displayValue}
        </Typography.Text>
        {copied
          ? <Check size={11} strokeWidth={2.25} color={iconColors.secondary} style={{ flexShrink: 0 }} />
          : <Copy size={11} strokeWidth={2.25} color={iconColors.secondary} style={{ flexShrink: 0 }} />}
      </div>
    </div>
  )
}

// Each swatch renders the REAL antd Button (same padding/radius/font/shadow
// wiring as everywhere else in the app) — only Hover/Active/Focus need an
// inline style override to pin a state that can't be held still by just
// rendering it, since those only exist as live pseudo-classes. Loading and
// Disabled are genuine props, not visual approximations. Default is left
// completely real and interactive — hovering/clicking it live demonstrates
// the same Hover/Active states the pinned swatches show statically.
function ButtonStateSwatch({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {children}
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>{label}</Typography.Text>
    </div>
  )
}

// Component token specs used to be shown as hand-maintained tables here
// (property → token name → value). Replaced by InspectToggle + the real
// InspectorOverlay (see its definition below) — hovering/clicking an actual
// rendered instance shows the same info, live off computed styles, so it
// can't drift out of sync the way a manually-copied table could.

function SubHeading({ children }: { children: React.ReactNode }) {
  const { token } = theme.useToken()
  return (
    <Typography.Text
      type="secondary"
      style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8, color: token.colorTextTertiary }}
    >
      {children}
    </Typography.Text>
  )
}

// Highlights whichever section's heading is nearest the top of the
// scrolling ancestor — the docs page is rendered directly inside AppThemed's
// flex:1/overflow:auto container (see App.tsx), not inside a page-level
// scroller of its own, so IntersectionObserver's default root (the nearest
// scrollable ancestor) already resolves to the right element.
function useActiveSection(ids: string[]) {
  const [activeId, setActiveId] = useState(ids[0])

  useEffect(() => {
    const elements = ids.map(id => document.getElementById(id)).filter((el): el is HTMLElement => el !== null)
    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting)
        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '0px 0px -70% 0px', threshold: 0 },
    )
    elements.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [ids])

  return activeId
}

// One collapsible group ("Foundations", "Components") — the group label
// itself isn't a nav target (it has no section/anchor of its own, same as
// antd's own docs sidebar), it only toggles its children's visibility.
function TocGroup({ label, items, activeId }: { label: string; items: { id: string; label: string }[]; activeId: string }) {
  const { token } = theme.useToken()
  const iconColors = useIconColors()
  // Default open — a group containing the active section should never load
  // collapsed, so this only ever needs to go one direction (open -> closed)
  // via user action once expanded state exists per-group.
  const [open, setOpen] = useState(true)

  return (
    <div>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 8px',
          cursor: 'pointer',
        }}
      >
        <Typography.Text
          style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, color: token.colorTextTertiary }}
        >
          {label}
        </Typography.Text>
        <ChevronDown
          size={13}
          strokeWidth={2.25}
          color={iconColors.secondary}
          style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s ease', flexShrink: 0 }}
        />
      </div>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
          {items.map(item => {
            const isActive = item.id === activeId
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                style={{
                  fontSize: 13,
                  padding: '4px 8px 4px 16px',
                  borderRadius: 6,
                  color: isActive ? token.colorText : token.colorTextTertiary,
                  background: isActive ? token.colorFillTertiary : 'transparent',
                  fontWeight: isActive ? token.fontWeightStrong : 'normal',
                  textDecoration: 'none',
                }}
              >
                {item.label}
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TableOfContents() {
  const activeId = useActiveSection(TOC_IDS)
  const { token } = theme.useToken()

  return (
    <nav style={{ position: 'sticky', top: 48, width: 176, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <a
        href="/"
        className="ifix-text-link"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 8px',
          borderRadius: 6,
          fontSize: 13,
          color: token.colorTextSecondary,
        }}
      >
        <ArrowLeft size={14} strokeWidth={2.25} />
        <span>Back to Prototype</span>
      </a>
      {TOC_GROUPS.map(group => (
        <TocGroup key={group.id} label={group.label} items={group.items} activeId={activeId} />
      ))}
    </nav>
  )
}

// Toggles the same Inspect mode as the main app's DevTools bar, scoped to
// whatever DOM node componentsAreaRef points at (here, the Components
// section) via appWindowEl — the exact mechanism DesktopStageLayout uses to
// scope Inspect to the simulated app window. This is what replaces the
// hand-maintained token-spec tables for components: hovering/clicking a real
// rendered instance shows its actual computed padding/radius/color via
// InspectorOverlay (already mounted globally in App.tsx), which can never
// drift out of sync with the component the way a manually-copied table of
// token names could.
function InspectToggle() {
  const { token } = theme.useToken()
  const { inspectMode, setInspectMode } = useDevTools()
  return (
    <button
      type="button"
      onClick={() => setInspectMode(!inspectMode)}
      className="ifix-focus-ring"
      style={{
        display: 'flex', alignItems: 'center', gap: 6, border: 'none', cursor: 'pointer',
        background: inspectMode ? token.colorFillSecondary : token.colorFillTertiary,
        color: inspectMode ? token.colorText : token.colorTextSecondary,
        fontSize: 12, padding: '4px 10px', borderRadius: 6,
      }}
    >
      <Crosshair size={13} strokeWidth={2.25} />
      <span>{inspectMode ? 'Inspecting — hover or click a swatch' : 'Inspect'}</span>
    </button>
  )
}

export function DesignDocsPage() {
  const { token } = theme.useToken()
  const iconColors = useIconColors()
  const { setAppWindowEl } = useDevTools()
  const componentsAreaRef = useRef<HTMLDivElement>(null)

  // Scope InspectorOverlay to just the Components section's rendered demos —
  // same registration DesktopStageLayout does for the simulated app window.
  useEffect(() => {
    setAppWindowEl(componentsAreaRef.current)
    return () => setAppWindowEl(null)
  }, [setAppWindowEl])

  return (
    <div style={{ minHeight: '100%', background: token.colorBgLayout, padding: '48px 24px' }}>
      <div style={{ display: 'flex', gap: 32, maxWidth: 940, margin: '0 auto', alignItems: 'flex-start' }}>
        <TableOfContents />

        <div style={{ flex: 1, minWidth: 0 }}>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>Design Docs</Typography.Title>
          <Typography.Text type="secondary">
            Live reference for IFix's typography and color tokens — updates automatically with the theme switcher in DevTools.
          </Typography.Text>

          <div style={{ height: 32 }} />

          <Section id="typography" title="Typography">
            <SubHeading>Font Family</SubHeading>
            <Typography.Text style={{ fontFamily: token.fontFamily, fontSize: 13 }}>
              {token.fontFamily}
            </Typography.Text>

            <div style={{ height: 24 }} />

            <SubHeading>Scale</SubHeading>
            <TypeRow
              label="Heading 1"
              sample={{ fontSize: token.fontSizeHeading1, fontWeight: token.fontWeightStrong, lineHeight: token.lineHeightHeading1 }}
              tokenLabel={`fontSizeHeading1 · ${token.fontSizeHeading1}px / ${token.lineHeightHeading1}`}
            />
            <TypeRow
              label="Heading 2"
              sample={{ fontSize: token.fontSizeHeading2, fontWeight: token.fontWeightStrong, lineHeight: token.lineHeightHeading2 }}
              tokenLabel={`fontSizeHeading2 · ${token.fontSizeHeading2}px / ${token.lineHeightHeading2}`}
            />
            <TypeRow
              label="Heading 3"
              sample={{ fontSize: token.fontSizeHeading3, fontWeight: token.fontWeightStrong, lineHeight: token.lineHeightHeading3 }}
              tokenLabel={`fontSizeHeading3 · ${token.fontSizeHeading3}px / ${token.lineHeightHeading3}`}
            />
            <TypeRow
              label="Heading 4"
              sample={{ fontSize: token.fontSizeHeading4, fontWeight: token.fontWeightStrong, lineHeight: token.lineHeightHeading4 }}
              tokenLabel={`fontSizeHeading4 · ${token.fontSizeHeading4}px / ${token.lineHeightHeading4}`}
            />
            <TypeRow
              label="Heading 5"
              sample={{ fontSize: token.fontSizeHeading5, fontWeight: token.fontWeightStrong, lineHeight: token.lineHeightHeading5 }}
              tokenLabel={`fontSizeHeading5 · ${token.fontSizeHeading5}px / ${token.lineHeightHeading5}`}
            />
            <TypeRow
              label="Body Large"
              sample={{ fontSize: token.fontSizeLG, lineHeight: token.lineHeightLG }}
              tokenLabel={`fontSizeLG · ${token.fontSizeLG}px / ${token.lineHeightLG}`}
            />
            <TypeRow
              label="Body"
              sample={{ fontSize: token.fontSize, lineHeight: token.lineHeight }}
              tokenLabel={`fontSize · ${token.fontSize}px / ${token.lineHeight}`}
            />
            <TypeRow
              label="Body Small"
              sample={{ fontSize: token.fontSizeSM, lineHeight: token.lineHeightSM }}
              tokenLabel={`fontSizeSM · ${token.fontSizeSM}px / ${token.lineHeightSM}`}
            />
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 24, padding: '16px 0 0' }}>
              <Typography.Text strong style={{ fontWeight: token.fontWeightStrong }}>Strong / Semibold</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12, fontFamily: token.fontFamilyCode }}>
                fontWeightStrong · {token.fontWeightStrong}
              </Typography.Text>
            </div>
          </Section>

          <Section id="colors" title="Colors">
            <SubHeading>Semantic</SubHeading>
            <SwatchRow>
              <Swatch name="Primary" value={token.colorPrimary} tokenName="colorPrimary" textOn={token.colorTextLightSolid} />
              <Swatch name="Success" value={token.colorSuccess} tokenName="colorSuccess" textOn={token.colorTextLightSolid} />
              <Swatch name="Warning" value={token.colorWarning} tokenName="colorWarning" textOn={token.colorTextLightSolid} />
              <Swatch name="Error" value={token.colorError} tokenName="colorError" textOn={token.colorTextLightSolid} />
              <Swatch name="Info" value={token.colorInfo} tokenName="colorInfo" textOn={token.colorTextLightSolid} />
            </SwatchRow>

            <SubHeading>Text</SubHeading>
            <SwatchRow>
              <Swatch name="Text" value={token.colorBgElevated} copyValue={token.colorText} tokenName="colorText" textOn={token.colorText} />
              <Swatch name="Secondary" value={token.colorBgElevated} copyValue={token.colorTextSecondary} tokenName="colorTextSecondary" textOn={token.colorTextSecondary} />
              <Swatch name="Tertiary" value={token.colorBgElevated} copyValue={token.colorTextTertiary} tokenName="colorTextTertiary" textOn={token.colorTextTertiary} />
              <Swatch name="Quaternary" value={token.colorBgElevated} copyValue={token.colorTextQuaternary} tokenName="colorTextQuaternary" textOn={token.colorTextQuaternary} />
              <Swatch name="Disabled" value={token.colorBgElevated} copyValue={token.colorTextDisabled} tokenName="colorTextDisabled" textOn={token.colorTextDisabled} />
              {/* Backdrop is colorPrimary, not the elevated panel like the other
                  four above — this token is specifically for text sitting on a
                  solid semantic color (primary Button, colored Tag, filled
                  Badge, etc.), not on a neutral surface, so demonstrating it on
                  one is the honest picture of how it's actually used. */}
              <Swatch name="Light Solid" value={token.colorPrimary} copyValue={token.colorTextLightSolid} tokenName="colorTextLightSolid" textOn={token.colorTextLightSolid} />
            </SwatchRow>

            <SubHeading>Backgrounds &amp; Fills</SubHeading>
            <SwatchRow>
              <Swatch name="Body / Layout" value={token.colorBgLayout} tokenName="colorBgLayout" />
              <Swatch name="Container" value={token.colorBgContainer} tokenName="colorBgContainer" />
              <Swatch name="Elevated / Panel" value={token.colorBgElevated} tokenName="colorBgElevated" />
              <Swatch name="Fill" value={token.colorFill} tokenName="colorFill" />
              <Swatch name="Fill Secondary" value={token.colorFillSecondary} tokenName="colorFillSecondary" />
              <Swatch name="Fill Tertiary" value={token.colorFillTertiary} tokenName="colorFillTertiary" />
              <Swatch name="Fill Quaternary" value={token.colorFillQuaternary} tokenName="colorFillQuaternary" />
            </SwatchRow>

            <SubHeading>Borders</SubHeading>
            <SwatchRow>
              <Swatch name="Border" value={token.colorBorder} tokenName="colorBorder" />
              <Swatch name="Border Secondary" value={token.colorBorderSecondary} tokenName="colorBorderSecondary" />
              <Swatch name="Split" value={token.colorSplit} tokenName="colorSplit" />
            </SwatchRow>

            <SubHeading>Icons</SubHeading>
            <SwatchRow>
              <Swatch name="Icon (default)" value={token.colorBgElevated} copyValue={iconColors.secondary} tokenName="colorIcon" textOn={iconColors.secondary} />
              <Swatch name="Icon (hover/active)" value={token.colorBgElevated} copyValue={iconColors.primary} tokenName="colorIconHover" textOn={iconColors.primary} />
            </SwatchRow>
          </Section>

          <Section id="spacing" title="Spacing">
            <Typography.Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 16 }}>
              Gaps are deliberate (nothing between 16–24 or 24–32) — round down to the tighter value.
            </Typography.Text>
            {SPACING_SCALE.map(s => <SpacingRow key={s.name} name={s.name} px={s.px} />)}
          </Section>

          <Section id="radius" title="Radius">
            <Typography.Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 16 }}>
              XS/SM/Base/LG are antd's defaults; XL and Pill are this project's own additions.
            </Typography.Text>
            {RADIUS_SCALE.map(s => <RadiusRow key={s.name} name={s.name} px={s.px} />)}
          </Section>

          <Section id="shadow" title="Shadow">
            <Typography.Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 16 }}>
              Panel drops to none in light mode; Dropdown always keeps one.
            </Typography.Text>
            <ShadowRow name="Panel" tokenName="boxShadow" value={token.boxShadow} />
            <ShadowRow name="Dropdown" tokenName="boxShadowSecondary" value={token.boxShadowSecondary} />
          </Section>

          <Section id="border" title="Border">
            <Typography.Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 16 }}>
              0.5px is the global default; 1px is a per-component override on the input family.
            </Typography.Text>
            {BORDER_WIDTH_SCALE.map(s => <BorderRow key={s.name} name={s.name} px={s.px} />)}
          </Section>

          <Section id="button" title="Button">
            <Typography.Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 16 }}>
              Starting with the most-used config first (Primary, no icon); other types/variants follow.
            </Typography.Text>

            <SubHeading>Primary</SubHeading>
            {/* Same backdrop treatment as the Shadow section's example boxes
                (colorBgLayout, the real page canvas color, radius 8) — the
                swatches read as floating on the app's own background instead
                of blending into this panel's own colorBgElevated. Wrapped in
                componentsAreaRef so Inspect (toggled top-right) can scope its
                hover/click listeners here — see InspectToggle's comment for
                why this replaced the old hand-maintained token tables. */}
            <div
              ref={componentsAreaRef}
              data-ifix-inspect-atomic-only
              style={{
                position: 'relative',
                background: token.colorBgLayout,
                borderRadius: 8,
                paddingTop: 32,
                paddingBottom: 32,
                paddingLeft: 24,
                paddingRight: 24,
                display: 'flex',
                gap: 24,
                flexWrap: 'wrap',
                marginBottom: 8,
            }}>
              {/* data-ifix-inspect-exclude: this toggle lives inside the
                  same container Inspect scopes to (componentsAreaRef), so
                  without opting out, Inspect's own click-capture would pin
                  the toggle itself instead of firing its onClick. */}
              <div data-ifix-inspect-exclude style={{ position: 'absolute', top: 8, right: 8 }}>
                <InspectToggle />
              </div>
              <ButtonStateSwatch label="Default">
                <Button type="primary">Button</Button>
              </ButtonStateSwatch>
              <ButtonStateSwatch label="Hover">
                {/* The border-beam treatment (App.tsx/index.css) reads
                    hover/active/focus off real :hover/:active/:focus-visible
                    pseudo-classes and its own !important background — an
                    inline style override can no longer pin the look the
                    way it could when this button was a flat colorPrimary
                    fill, so these swatches force each one via its own
                    plain class instead (.ifix-btn-force-hover/-active/
                    -focus in index.css) — each state has its own distinct
                    look now: Hover beams+glows, Active reverses the
                    gradient with no beam/glow, Focus is a plain white
                    outline with no beam. */}
                <Button type="primary" className="ifix-btn-force-hover">Button</Button>
              </ButtonStateSwatch>
              <ButtonStateSwatch label="Active">
                <Button type="primary" className="ifix-btn-force-active">Button</Button>
              </ButtonStateSwatch>
              <ButtonStateSwatch label="Focus">
                {/* Real focus, not a pinned approximation — antd's own
                    default focus-visible ring can't be faked with an
                    inline style (blocked by this button's own !important
                    box-shadow, same reason Hover/Active/Disabled moved to
                    force-classes), but autoFocus gets genuine browser
                    focus on mount, which the browser does treat as
                    focus-visible with no prior pointer interaction. */}
                <Button type="primary" autoFocus className="ifix-btn-force-focus">Button</Button>
              </ButtonStateSwatch>
              <ButtonStateSwatch label="Loading">
                <Button type="primary" loading>Button</Button>
              </ButtonStateSwatch>
              <ButtonStateSwatch label="Disabled">
                {/* No `disabled` prop — a native disabled attribute stops the
                    browser from firing pointer events on it at all, which is
                    exactly why this swatch alone couldn't be inspected. Same
                    force-class approach as Hover/Active/Focus above
                    (.ifix-btn-force-disabled in index.css): the real
                    disabled tokens, applied via CSS instead of inline style
                    (which can't win against this button's own !important
                    rules), so it looks identical but stays
                    hoverable/clickable/inspectable. */}
                <Button type="primary" className="ifix-btn-force-disabled" style={{ cursor: 'not-allowed' }}>
                  Button
                </Button>
              </ButtonStateSwatch>
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}
