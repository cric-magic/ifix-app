import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { theme } from 'antd'
import { Outlet } from 'react-router-dom'
import { useDevTools } from '../contexts/DevToolsContext'
import { AppWindowProvider } from '../contexts/AppWindowContext'
import desktopWallpaper from '../assets/desktop-wallpaper.jpg'

type ResizeDir = 'right' | 'bottom' | 'corner'

const MIN_WINDOW_WIDTH = 360
const MIN_WINDOW_HEIGHT = 400

// Tokens in this app are only ever hex or rgb()/rgba() (never a named CSS
// color — see utils/colorTokenLookup.ts's own note on the same guarantee),
// so this covers every real case the wallpaper scrim gradient below needs:
// turning colorBgLayout (a solid color) into a translucent version of
// itself at a given alpha, so the scrim tints toward whatever this
// variant's own page canvas color actually is instead of a fixed black
// that wouldn't shift with the theme.
function withAlpha(color: string, alpha: number): string {
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    const [r, g, b] = hex.length === 3
      ? hex.split('').map(c => parseInt(c + c, 16))
      : [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16))
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  const match = color.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/)
  if (!match) return color
  const [, r, g, b] = match
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Router layout route — wraps every route except /design-docs (registered as
// a separate top-level route in router/index.tsx, outside this layout) so
// the docs page renders as its own plain full-size page: no desktop
// background, no window chrome, not resizable.
export function DesktopStageLayout() {
  const { windowSize, setWindowSize, setAppWindowEl } = useDevTools()
  const { token } = theme.useToken()
  const [resizing, setResizing] = useState<ResizeDir | null>(null)
  const startRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null)
  // Captured via callback ref so the state update (and the re-render it
  // triggers for AppWindowProvider's value) happens right after mount,
  // rather than needing a separate effect just to read a ref.
  const [contentEl, setContentEl] = useState<HTMLDivElement | null>(null)

  // Mirrored into DevToolsContext too — see the comment there — so
  // InspectorOverlay (a sibling of the router tree, not a descendant of
  // this layout's Outlet) can scope itself to the same window bounds.
  useEffect(() => {
    setAppWindowEl(contentEl)
    return () => setAppWindowEl(null)
  }, [contentEl, setAppWindowEl])

  const startResize = (dir: ResizeDir) => (e: React.MouseEvent) => {
    e.preventDefault()
    startRef.current = { x: e.clientX, y: e.clientY, w: windowSize.width, h: windowSize.height }
    setResizing(dir)
  }

  useLayoutEffect(() => {
    if (!resizing) return
    function onMove(e: MouseEvent) {
      const start = startRef.current
      if (!start) return
      const dx = e.clientX - start.x
      const dy = e.clientY - start.y
      setWindowSize({
        width: resizing === 'bottom' ? start.w : Math.max(MIN_WINDOW_WIDTH, start.w + dx),
        height: resizing === 'right' ? start.h : Math.max(MIN_WINDOW_HEIGHT, start.h + dy),
      })
    }
    function onUp() {
      setResizing(null)
      startRef.current = null
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [resizing, setWindowSize])

  const handleStyle: React.CSSProperties = { position: 'absolute', userSelect: 'none' }

  return (
    <div style={{
      // minHeight (not height): this sits inside AppThemed's own flex:1/
      // overflow:auto scroll container, so it should fill that area at
      // minimum (to center the window both vertically and horizontally when
      // it's smaller than the viewport) but grow taller when the window is
      // dragged bigger than the visible area, rather than clipping it.
      minHeight: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      boxSizing: 'border-box',
      // Longhand backgroundColor, not the `background` shorthand — mixing
      // the shorthand with the backgroundImage/-Size/-Position/-Repeat
      // longhands below made React warn on every re-render (a shorthand
      // and its own longhand overlap on which one actually wins, and which
      // one wins can flip between renders). colorBgLayout here is just the
      // fallback shown while the wallpaper image loads (or if it fails to)
      // — same role a real desktop's solid backdrop color plays behind its
      // wallpaper.
      backgroundColor: token.colorBgLayout,
      // Two stacked background layers (CSS paints the first-listed on top):
      // a scrim gradient, tinted from this variant's own colorBgLayout
      // (not a fixed black) so it shifts with the theme — near-black for
      // Neutral, the brand navy for Bluish, near-white for Light — over the
      // wallpaper photo itself. 40% at the top, deepening to fully opaque
      // at the bottom.
      backgroundImage: `linear-gradient(to bottom, ${withAlpha(token.colorBgLayout, 0.4)} 0%, ${withAlpha(token.colorBgLayout, 1)} 100%), url(${desktopWallpaper})`,
      backgroundSize: 'cover, cover',
      backgroundPosition: 'center, center',
      backgroundRepeat: 'no-repeat, no-repeat',
    }}>
      {/* Sizing wrapper — holds the resize handles as siblings of the
          visible window box below, not children of it. The box itself
          clips to its rounded corners (overflow: hidden), so a handle
          straddling its edge with a negative offset (e.g. right: -4) used
          to get half-clipped by that same overflow, shrinking its hit area
          and, at the corner grip, visibly cutting the grip icon off square
          against the rounded corner instead of sitting outside it cleanly. */}
      <div style={{ position: 'relative', width: windowSize.width, height: windowSize.height, flexShrink: 0 }}>
        <div style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          background: token.colorBgContainer,
          borderRadius: 12,
          border: `0.5px solid ${token.colorBorder}`,
          // A bigger, softer shadow than the shared boxShadowSecondary
          // token (used everywhere else for floating overlays like
          // Dropdown/Select/DatePicker) — deliberately NOT that token here,
          // since bumping it would inflate every one of those too. This
          // window is meant to read like a real desktop OS window sitting
          // above the wallpaper, which calls for a much larger, softer
          // ambient shadow than a small popup needs. Two layers, same
          // recipe real macOS window shadows use: a big soft blur for the
          // ambient falloff, a tighter closer one for definition right at
          // the edge. Fixed black-alpha regardless of theme (including
          // Light) — window shadows read as neutral/ambient in every OS
          // theme, not tinted to the accent color.
          boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.5), 0 18px 36px -18px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
        }}>
          <div ref={setContentEl} style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            overflow: 'auto',
            // Drawer (and any other antd overlay) uses `position: fixed`
            // regardless of which DOM node it's portaled into — CSS `fixed`
            // positions relative to the viewport, not the nearest positioned
            // ancestor, UNLESS an ancestor establishes a new containing block
            // (transform/filter/perspective/contain/will-change). Without
            // this, the portal correctly nests in the DOM here (confirmed via
            // getContainer below) but still visually renders full-viewport —
            // this is what actually clips/contains it to the window's bounds.
            transform: 'translateZ(0)',
          }}>
            {/* Drawers (and anything else that would otherwise portal to
                document.body) mount here instead, via AppWindowProvider — see
                AppWindowContext — so they stay visually inside the simulated
                app window rather than covering the whole desktop canvas.
                `position: relative` makes this div the containing block antd
                positions the portaled content against. */}
            <AppWindowProvider value={contentEl}>
              <Outlet />
            </AppWindowProvider>
          </div>
        </div>

        {/* Resize handles — right edge (width), bottom edge (height), corner (both).
            Kept invisible at rest and only need to be wide enough to grab; the
            corner handle gets a small visible grip so the affordance is discoverable. */}
        <div onMouseDown={startResize('right')} style={{ ...handleStyle, top: 0, right: -4, width: 8, height: '100%', cursor: 'ew-resize' }} />
        <div onMouseDown={startResize('bottom')} style={{ ...handleStyle, left: 0, bottom: -4, height: 8, width: '100%', cursor: 'ns-resize' }} />
        <div onMouseDown={startResize('corner')} style={{
          ...handleStyle,
          right: 0,
          bottom: 0,
          width: 16,
          height: 16,
          cursor: 'nwse-resize',
          boxSizing: 'border-box',
          padding: 4,
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            borderBottom: `2px solid ${token.colorTextQuaternary}`,
            borderRight: `2px solid ${token.colorTextQuaternary}`,
            borderBottomRightRadius: 4,
          }} />
        </div>
      </div>
    </div>
  )
}
