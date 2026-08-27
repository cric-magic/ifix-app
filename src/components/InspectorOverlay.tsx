import { useEffect, useMemo, useRef, useState } from 'react'
import { theme } from 'antd'
import { useDevTools } from '../contexts/DevToolsContext'
import { useIconColors } from '../constants/iconColors'
import { getNamedColorTokens, getNamedShadowTokens, findSpacingName, findRadiusName } from '../constants/designTokens'
import { buildColorTokenLookup, buildShadowTokenLookup, isTransparentColor, toHex } from '../utils/colorTokenLookup'

// Dev-only box-model + token inspector, toggled from the "Inspect" button in
// DevToolsPanel. Scoped to the simulated app window (the same container
// Drawers/Modals portal into via AppWindowContext) — hovering the desktop
// canvas or the DevTools bar itself does nothing, and on /design-docs (which
// has no window at all) Inspect has no effect.
//
// Hovering draws a crisp outline plus two translucent bands — margin
// (orange/colorWarning) and padding+border (green/colorSuccess) — built the
// way Chrome's own inspector does: a div sized to the border box whose own
// border-width is set to the margin/padding amount, so the border itself
// becomes the band. Each nonzero side gets a small pixel-value badge
// centered on its band. Clicking pins the element and adds a popover
// naming padding/margin/gap against SPACING_SCALE and colors against the
// same token names /design-docs uses (see designTokens.ts).
const px = (v: string) => parseFloat(v) || 0

function formatPx(value: number): { text: string; onScale: boolean } {
  const name = findSpacingName(value)
  if (name) return { text: `${value}px · Spacing ${name}`, onScale: true }
  return { text: `${value}px`, onScale: value === 0 }
}

function formatRadius(value: number): { text: string; onScale: boolean } {
  const name = findRadiusName(value)
  if (name) return { text: `${value}px · ${name}`, onScale: true }
  return { text: `${value}px`, onScale: value === 0 }
}

interface GapBand { x: number; y: number; w: number; h: number; value: number }

// The actual measured space between each pair of adjacent children, not
// just flex/grid's `gap` CSS property — most spacing between siblings in
// this app comes from a child's own margin (e.g. antd Form.Item's
// margin-bottom in a plain block-flow form), not a `gap` on the parent, and
// visually there's no difference between the two. Row-axis measurement
// (flex-direction: row) only kicks in for flex containers; everything else
// (block flow, flex-direction: column) is measured top-to-bottom. Grid is
// skipped — its 2D gap regions would need row/column grouping this doesn't
// attempt, so grid still falls back to the numeric-only popover row below.
function getGapBands(el: HTMLElement, cs: CSSStyleDeclaration, contentBox: { left: number; top: number; right: number; bottom: number }): GapBand[] {
  if (cs.display.includes('grid')) return []
  const children = Array.from(el.children) as HTMLElement[]
  if (children.length < 2) return []
  const isRow = cs.display.includes('flex') && cs.flexDirection.startsWith('row')
  const rects = children
    .map(c => c.getBoundingClientRect())
    .sort((a, b) => isRow ? a.left - b.left : a.top - b.top)

  const bands: GapBand[] = []
  for (let i = 0; i < rects.length - 1; i++) {
    const a = rects[i], b = rects[i + 1]
    if (isRow) {
      const w = b.left - a.right
      if (w > 0.5) bands.push({ x: a.right, y: contentBox.top, w, h: contentBox.bottom - contentBox.top, value: Math.round(w) })
    } else {
      const h = b.top - a.bottom
      if (h > 0.5) bands.push({ x: contentBox.left, y: a.bottom, w: contentBox.right - contentBox.left, h, value: Math.round(h) })
    }
  }
  return bands
}

function Badge({ x, y, value, color, token }: { x: number; y: number; value: number; color: string; token: any }) {
  if (value <= 0) return null
  return (
    <div style={{
      position: 'fixed', left: x, top: y, transform: 'translate(-50%, -50%)',
      pointerEvents: 'none', zIndex: 99998,
      background: token.colorBgElevated, border: `0.5px solid ${color}`,
      color, fontSize: 10, lineHeight: '14px', fontFamily: token.fontFamilyCode,
      padding: '0 4px', borderRadius: 4, whiteSpace: 'nowrap',
    }}>
      {value}
    </div>
  )
}

function SideValues({ label, t, r, b, l, token }: { label: string; t: number; r: number; b: number; l: number; token: any }) {
  const uniform = t === r && r === b && b === l
  const Row = ({ side, v }: { side: string; v: number }) => {
    const f = formatPx(v)
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ color: token.colorTextTertiary }}>{side}</span>
        <span style={{ color: f.onScale ? token.colorText : token.colorWarning }}>{f.text}</span>
      </div>
    )
  }
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ color: token.colorTextTertiary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
      {uniform ? <Row side="All sides" v={t} /> : (
        <>
          <Row side="Top" v={t} />
          <Row side="Right" v={r} />
          <Row side="Bottom" v={b} />
          <Row side="Left" v={l} />
        </>
      )}
    </div>
  )
}

// Same row shape as SideValues' Row above (label left, value right,
// space-between) so a color reads exactly like a padding/margin value does.
function ColorRow({ label, value, lookup, token }: { label: string; value: string; lookup: (v: string) => string | null; token: any }) {
  if (!value || isTransparentColor(value)) return null
  const name = lookup(value)
  const hex = toHex(value)
  const text = `${hex} · ${name ?? 'No token match'}`
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <span style={{ color: token.colorTextTertiary, flexShrink: 0 }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
        <span style={{ width: 12, height: 12, borderRadius: 4, background: value, border: `0.5px solid ${token.colorBorderSecondary}`, flexShrink: 0 }} />
        {/* No fontFamilyCode here — SideValues' padding/margin rows use the
            plain UI font too, and monospace renders the " · " separator
            with noticeably wider letter-spacing, which was the actual
            cause of the gap reading as bigger than theirs. */}
        <span title={text} style={{ color: name ? token.colorText : token.colorTextTertiary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {text}
        </span>
      </span>
    </div>
  )
}

// Same row shape again, but the swatch is a small box with the actual
// box-shadow applied (so you can see it) instead of a solid-color dot, and
// the value is just the matched token name — the raw multi-layer shadow
// string is too long to usefully print in a 320px popover.
function ShadowRow({ value, lookup, token }: { value: string; lookup: (v: string) => string | null; token: any }) {
  if (!value || value === 'none') return null
  const name = lookup(value)
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <span style={{ color: token.colorTextTertiary, flexShrink: 0 }}>Shadow</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
        <span style={{ width: 12, height: 12, borderRadius: 4, background: token.colorBgContainer, boxShadow: value, flexShrink: 0 }} />
        <span title={name ?? value} style={{ color: name ? token.colorText : token.colorTextTertiary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {name ?? 'No token match'}
        </span>
      </span>
    </div>
  )
}

// Corner values (border-radius) — same shape as SideValues, matched against
// RADIUS_SCALE (CLAUDE.md's "## Radius" table) instead of SPACING_SCALE.
function CornerValues({ label, tl, tr, br, bl, token }: { label: string; tl: number; tr: number; br: number; bl: number; token: any }) {
  const uniform = tl === tr && tr === br && br === bl
  const Row = ({ corner, v }: { corner: string; v: number }) => {
    const f = formatRadius(v)
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ color: token.colorTextTertiary }}>{corner}</span>
        <span style={{ color: f.onScale ? token.colorText : token.colorWarning }}>{f.text}</span>
      </div>
    )
  }
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ color: token.colorTextTertiary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
      {uniform ? <Row corner="All corners" v={tl} /> : (
        <>
          <Row corner="Top left" v={tl} />
          <Row corner="Top right" v={tr} />
          <Row corner="Bottom right" v={br} />
          <Row corner="Bottom left" v={bl} />
        </>
      )}
    </div>
  )
}

export function InspectorOverlay() {
  const { inspectMode, setInspectMode, appWindowEl: containerEl } = useDevTools()
  const { token } = theme.useToken()
  const iconColors = useIconColors()
  const [hoverEl, setHoverEl] = useState<HTMLElement | null>(null)
  const [pinnedEl, setPinnedEl] = useState<HTMLElement | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const colorTokens = useMemo(() => getNamedColorTokens(token as unknown as Record<string, unknown>, iconColors), [token, iconColors])
  const lookupColor = useMemo(() => buildColorTokenLookup(colorTokens), [colorTokens])

  const shadowTokens = useMemo(() => getNamedShadowTokens(token as unknown as Record<string, unknown>), [token])
  const lookupShadow = useMemo(() => buildShadowTokenLookup(shadowTokens), [shadowTokens])

  // Crosshair cursor only over the simulated app window, not the whole page.
  useEffect(() => {
    if (!containerEl) return
    if (inspectMode) containerEl.style.cursor = 'crosshair'
    else containerEl.style.cursor = ''
    return () => { containerEl.style.cursor = '' }
  }, [inspectMode, containerEl])

  useEffect(() => {
    if (!inspectMode || !containerEl) {
      setHoverEl(null)
      setPinnedEl(null)
      return
    }

    // antd portals Dropdown/Select/Picker/Tooltip/Popover content to
    // document.body by default (unlike Drawer/Modal, which are configured to
    // stay inside the app window via AppWindowContext) — so it lives outside
    // `containerEl` even though it visually belongs to something inside the
    // window. Treat it as in-scope anyway so an opened dropdown's own
    // content can still be hovered/pinned.
    const inPortaledPopup = (target: Element) =>
      !!target.closest('.ant-dropdown, .ant-select-dropdown, .ant-picker-dropdown, .ant-cascader-dropdown, .ant-tooltip, .ant-popover')

    // Elements whose whole purpose is to reveal more content to inspect
    // (a Dropdown/Select trigger) — clicking these must be left completely
    // alone (no preventDefault/stopPropagation) or the popup they're
    // supposed to open never gets the click, since stopping it here in the
    // capture phase means React's own delegated click handler downstream
    // never runs. Genuine buttons/links are still blocked below, since those
    // can carry real side effects (navigate, submit, delete) — this carve-out
    // is deliberately narrow.
    const isRevealTrigger = (target: Element) =>
      !!target.closest('.ant-dropdown-trigger, .ant-select, .ant-picker, [aria-haspopup]')

    const isExcluded = (target: EventTarget | null): boolean => {
      if (!(target instanceof Element)) return true
      if (rootRef.current?.contains(target)) return true
      if (target.closest('[data-ifix-devtools-bar]')) return true
      if (inPortaledPopup(target)) return false
      return !containerEl.contains(target)
    }

    function onMove(e: MouseEvent) {
      if (isExcluded(e.target)) return
      setHoverEl(e.target as HTMLElement)
    }
    function onClick(e: MouseEvent) {
      if (isExcluded(e.target)) return
      const target = e.target as HTMLElement
      if (!isRevealTrigger(target)) {
        e.preventDefault()
        e.stopPropagation()
      }
      setPinnedEl(prev => (prev === target ? null : target))
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setInspectMode(false)
    }

    window.addEventListener('mousemove', onMove, true)
    window.addEventListener('click', onClick, true)
    window.addEventListener('keydown', onKeyDown, true)
    return () => {
      window.removeEventListener('mousemove', onMove, true)
      window.removeEventListener('click', onClick, true)
      window.removeEventListener('keydown', onKeyDown, true)
    }
  }, [inspectMode, containerEl, setInspectMode])

  if (!inspectMode || !containerEl) return null

  const activeEl = pinnedEl ?? hoverEl
  if (!activeEl || !activeEl.isConnected) {
    return <div ref={rootRef} />
  }

  const rect = activeEl.getBoundingClientRect()
  const cs = getComputedStyle(activeEl)
  const marginT = px(cs.marginTop), marginR = px(cs.marginRight), marginB = px(cs.marginBottom), marginL = px(cs.marginLeft)
  const borderT = px(cs.borderTopWidth), borderR = px(cs.borderRightWidth), borderB = px(cs.borderBottomWidth), borderL = px(cs.borderLeftWidth)
  const paddingT = px(cs.paddingTop), paddingR = px(cs.paddingRight), paddingB = px(cs.paddingBottom), paddingL = px(cs.paddingLeft)
  const radiusTL = px(cs.borderTopLeftRadius), radiusTR = px(cs.borderTopRightRadius), radiusBR = px(cs.borderBottomRightRadius), radiusBL = px(cs.borderBottomLeftRadius)
  const isFlexOrGrid = /flex|grid/.test(cs.display)
  const rowGap = isFlexOrGrid ? px(cs.rowGap) : 0
  const columnGap = isFlexOrGrid ? px(cs.columnGap) : 0
  const gapBands = getGapBands(activeEl, cs, {
    left: rect.left + borderL + paddingL, top: rect.top + borderT + paddingT,
    right: rect.right - borderR - paddingR, bottom: rect.bottom - borderB - paddingB,
  })

  const midX = rect.left + rect.width / 2
  const midY = rect.top + rect.height / 2

  // Always to the right of the selected element — flips to the left only
  // when there's genuinely no room on the right, rather than ever dropping
  // below it.
  // Wide enough that the longest real token name (colorBorderSecondary,
  // plus its hex value) fits a color row on one line without wrapping.
  const popoverWidth = 320
  const popoverMaxHeight = 400
  const gap = 8
  const placeRight = rect.right + gap + popoverWidth <= window.innerWidth
  const popoverLeft = placeRight ? rect.right + gap : Math.max(gap, rect.left - popoverWidth - gap)
  const popoverTop = Math.min(Math.max(gap, rect.top), Math.max(gap, window.innerHeight - popoverMaxHeight - gap))

  const tagLabel = activeEl.tagName.toLowerCase() + (activeEl.className && typeof activeEl.className === 'string' ? `.${activeEl.className.split(' ')[0]}` : '')

  return (
    <div ref={rootRef} data-ifix-inspector-root>
      {/* Crisp outline at the element's own visual edge (border box). */}
      <div style={{
        position: 'fixed', pointerEvents: 'none', zIndex: 99998, boxSizing: 'border-box',
        left: rect.left, top: rect.top, width: rect.width, height: rect.height,
        outline: `1px solid ${token.colorPrimary}`, outlineOffset: -1,
      }} />
      {/* Margin band — content-box div sized to the border box; its border
          widths equal the margin amounts, so the border itself is the band. */}
      <div style={{
        position: 'fixed', pointerEvents: 'none', zIndex: 99997, boxSizing: 'content-box',
        left: rect.left, top: rect.top, width: rect.width, height: rect.height,
        borderStyle: 'solid', borderColor: token.colorWarning, opacity: 0.3,
        borderWidth: `${marginT}px ${marginR}px ${marginB}px ${marginL}px`,
      }} />
      {/* Padding + border band — border-box div at the border box; border
          width = border + padding, so it sits between the visual edge and
          the content box. */}
      <div style={{
        position: 'fixed', pointerEvents: 'none', zIndex: 99997, boxSizing: 'border-box',
        left: rect.left, top: rect.top, width: rect.width, height: rect.height,
        borderStyle: 'solid', borderColor: token.colorSuccess, opacity: 0.35,
        borderWidth: `${borderT + paddingT}px ${borderR + paddingR}px ${borderB + paddingB}px ${borderL + paddingL}px`,
      }} />

      {/* Pixel-value badges — one per nonzero side, centered on its band. */}
      <Badge x={midX} y={rect.top - marginT / 2} value={marginT} color={token.colorWarning} token={token} />
      <Badge x={rect.right + marginR / 2} y={midY} value={marginR} color={token.colorWarning} token={token} />
      <Badge x={midX} y={rect.bottom + marginB / 2} value={marginB} color={token.colorWarning} token={token} />
      <Badge x={rect.left - marginL / 2} y={midY} value={marginL} color={token.colorWarning} token={token} />

      <Badge x={midX} y={rect.top + borderT + paddingT / 2} value={paddingT} color={token.colorSuccess} token={token} />
      <Badge x={rect.right - borderR - paddingR / 2} y={midY} value={paddingR} color={token.colorSuccess} token={token} />
      <Badge x={midX} y={rect.bottom - borderB - paddingB / 2} value={paddingB} color={token.colorSuccess} token={token} />
      <Badge x={rect.left + borderL + paddingL / 2} y={midY} value={paddingL} color={token.colorSuccess} token={token} />

      {/* Gap bands — the actual strip between each pair of children, not
          just a reported number (see getGapBands above). Grid containers
          fall back to the numeric-only popover row below since 2D grid gap
          regions need row/column grouping this doesn't attempt. */}
      {gapBands.map((band, i) => (
        <div key={i}>
          <div style={{
            position: 'fixed', pointerEvents: 'none', zIndex: 99997,
            left: band.x, top: band.y, width: band.w, height: band.h,
            background: token.colorInfo, opacity: 0.3,
          }} />
          <Badge x={band.x + band.w / 2} y={band.y + band.h / 2} value={band.value} color={token.colorInfo} token={token} />
        </div>
      ))}

      {pinnedEl && (
        <div style={{
          position: 'fixed', zIndex: 99999,
          left: popoverLeft, top: popoverTop,
          width: popoverWidth, maxHeight: popoverMaxHeight, overflow: 'auto',
          background: token.colorBgElevated, border: `0.5px solid ${token.colorBorderSecondary}`,
          borderRadius: 8, boxShadow: token.boxShadowSecondary, padding: 12,
          fontSize: 12,
        }}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ color: token.colorText, fontFamily: token.fontFamilyCode, fontWeight: 600 }}>{tagLabel}</span>
          </div>

          <SideValues label="Padding" t={paddingT} r={paddingR} b={paddingB} l={paddingL} token={token} />
          <SideValues label="Margin" t={marginT} r={marginR} b={marginB} l={marginL} token={token} />
          {(radiusTL > 0 || radiusTR > 0 || radiusBR > 0 || radiusBL > 0) && (
            <CornerValues label="Radius" tl={radiusTL} tr={radiusTR} br={radiusBR} bl={radiusBL} token={token} />
          )}

          {isFlexOrGrid && (rowGap > 0 || columnGap > 0) && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ color: token.colorTextTertiary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Gap</div>
              {columnGap > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ color: token.colorTextTertiary }}>Column</span>
                  <span style={{ color: token.colorText }}>{formatPx(columnGap).text}</span>
                </div>
              )}
              {rowGap > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ color: token.colorTextTertiary }}>Row</span>
                  <span style={{ color: token.colorText }}>{formatPx(rowGap).text}</span>
                </div>
              )}
            </div>
          )}

          <div>
            <div style={{ color: token.colorTextTertiary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Colors</div>
            <ColorRow label="Background" value={cs.backgroundColor} lookup={lookupColor} token={token} />
            <ColorRow label="Text" value={cs.color} lookup={lookupColor} token={token} />
            {(borderT > 0 || borderR > 0 || borderB > 0 || borderL > 0) && (
              <ColorRow label="Border" value={cs.borderTopColor} lookup={lookupColor} token={token} />
            )}
            <ShadowRow value={cs.boxShadow} lookup={lookupShadow} token={token} />
          </div>
        </div>
      )}
    </div>
  )
}
