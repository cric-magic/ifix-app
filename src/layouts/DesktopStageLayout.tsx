import { useLayoutEffect, useRef, useState } from 'react'
import { theme } from 'antd'
import { Outlet } from 'react-router-dom'
import { useDevTools } from '../contexts/DevToolsContext'

type ResizeDir = 'right' | 'bottom' | 'corner'

const MIN_WINDOW_WIDTH = 360
const MIN_WINDOW_HEIGHT = 400

// Router layout route — wraps every route except /design-docs (registered as
// a separate top-level route in router/index.tsx, outside this layout) so
// the docs page renders as its own plain full-size page: no desktop
// background, no window chrome, not resizable.
export function DesktopStageLayout() {
  const { windowSize, setWindowSize } = useDevTools()
  const { token } = theme.useToken()
  const [resizing, setResizing] = useState<ResizeDir | null>(null)
  const startRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null)

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
      padding: 40,
      boxSizing: 'border-box',
      background: token.colorBgLayout,
      // A faint dot grid sells the "desktop canvas" read — subtle enough not
      // to compete with the window sitting on top of it, built from
      // colorBorderSecondary so it's already correctly muted per theme.
      backgroundImage: `radial-gradient(${token.colorBorderSecondary} 1px, transparent 1px)`,
      backgroundSize: '24px 24px',
    }}>
      <div style={{
        position: 'relative',
        width: windowSize.width,
        height: windowSize.height,
        flexShrink: 0,
        background: token.colorBgContainer,
        borderRadius: 12,
        border: `0.5px solid ${token.colorBorder}`,
        boxShadow: token.boxShadowSecondary,
        overflow: 'hidden',
      }}>
        <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
          <Outlet />
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
          padding: 3,
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
