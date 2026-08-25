import { useEffect, useState } from 'react'
import { Typography, message, theme } from 'antd'
import { Copy, Check } from 'lucide-react'
import { useIconColors } from '../../constants/iconColors'

const TOC_ITEMS = [
  { id: 'typography', label: 'Typography' },
  { id: 'colors', label: 'Colors' },
]

// Solid tokens resolve to `rgb(r, g, b)` (App.tsx's blendOverlay output) or
// already to a literal hex (the semantic colorPrimary/Success/etc. seeds) —
// normalize both to hex here so the docs always show/copy the more portable,
// universally-recognized form. Actually-translucent values (rgba with
// alpha < 1, none currently shown here but kept safe) pass through
// unchanged, since flattening those to hex would silently drop the alpha.
function toHex(value: string): string {
  const match = value.match(/^rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)$/)
  if (!match) return value
  const [, r, g, b, a] = match
  if (a !== undefined && Number(a) < 1) return value
  const toByte = (n: string) => Number(n).toString(16).padStart(2, '0')
  return `#${toByte(r)}${toByte(g)}${toByte(b)}`
}

const TOC_IDS = TOC_ITEMS.map(item => item.id)

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  const { token } = theme.useToken()
  return (
    <div id={id} className="ifix-table-panel" style={{ marginBottom: 24, scrollMarginTop: 20 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        height: 56,
        padding: '0 20px',
        boxShadow: `inset 0 -0.5px 0 0 ${token.colorBorderSecondary}`,
      }}>
        <Typography.Text strong style={{ fontSize: 15 }}>{title}</Typography.Text>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
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
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>{children}</div>
}

function SubHeading({ children }: { children: React.ReactNode }) {
  const { token } = theme.useToken()
  return (
    <Typography.Text
      type="secondary"
      style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 12, color: token.colorTextTertiary }}
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

function TableOfContents() {
  const { token } = theme.useToken()
  const activeId = useActiveSection(TOC_IDS)

  return (
    <nav style={{ position: 'sticky', top: 48, width: 160, flexShrink: 0 }}>
      <Typography.Text
        type="secondary"
        style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 12, color: token.colorTextTertiary }}
      >
        On this page
      </Typography.Text>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {TOC_ITEMS.map(item => {
          const isActive = item.id === activeId
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              style={{
                fontSize: 13,
                padding: '6px 10px',
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
    </nav>
  )
}

export function DesignDocsPage() {
  const { token } = theme.useToken()
  const iconColors = useIconColors()

  return (
    <div style={{ minHeight: '100%', background: token.colorBgLayout, padding: '48px 24px' }}>
      <div style={{ display: 'flex', gap: 40, maxWidth: 940, margin: '0 auto', alignItems: 'flex-start' }}>
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
        </div>
      </div>
    </div>
  )
}
