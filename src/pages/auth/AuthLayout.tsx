import { useEffect, useRef, useState } from 'react'
import { Typography, theme } from 'antd'
import { useDevTools } from '../../contexts/DevToolsContext'
import { TronArenaBackground } from '../../components/TronArenaBackground'

interface Props {
  title: string
  subtitle?: string
  children: React.ReactNode
}

export function AuthLayout({ title, subtitle, children }: Props) {
  const { token } = theme.useToken()
  const { themeVariant } = useDevTools()
  const rootRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  // Where the form's own content ends (px from the top of the root
  // container) and how tall the remaining space below it is — passed down
  // as an explicit pixel box for TronArenaBackground's canvas, so it only
  // ever renders below the form instead of behind it. Height is passed
  // explicitly (not achieved via a bottom:0 + top offset) because the
  // root container only sets minHeight, not height — an absolutely
  // positioned box with both top and bottom set needs a definite
  // containing-block height to resolve sanely, and minHeight alone left
  // it indefinite (the canvas blew up to a huge fallback size). Re-measured
  // on resize (window resize, or the form's own height changing e.g. a
  // validation error appearing) via ResizeObserver on both boxes.
  const [box, setBox] = useState<{ top: number; height: number } | null>(null)

  useEffect(() => {
    const root = rootRef.current
    const content = contentRef.current
    if (!root || !content) return

    function measure() {
      const rootRect = root!.getBoundingClientRect()
      const contentRect = content!.getBoundingClientRect()
      const top = contentRect.bottom - rootRect.top
      setBox({ top, height: Math.max(0, rootRect.height - top) })
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    observer.observe(content)
    return () => observer.disconnect()
  }, [])

  // This page sits directly inside DesktopStageLayout's window box (shared
  // with the signed-in app, which paints it via the ambient colorBgContainer)
  // — but there's no Sider/header+content split here to justify a single
  // flat "elevated container" tone. A top-to-bottom gradient down to
  // colorBgLayout (the plain page-canvas tier) reads as one continuous
  // surface with the wallpaper behind the window, rather than a flat card
  // seam. Light uses colorBgElevated instead of colorBgContainer for the
  // top stop — Light's colorBgContainer is a near-white surface tone,
  // while colorBgElevated is the pure-white "most elevated" tier this page
  // (no sidebar/panel context) reads better against.
  const gradientTop = themeVariant === 'light' ? token.colorBgElevated : token.colorBgContainer

  return (
    <div ref={rootRef} style={{
      position: 'relative',
      overflow: 'hidden',
      minHeight: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      // Stop at 50% (not the default 100%) so colorBgLayout is reached at
      // the vertical midpoint and holds flat for the bottom half, instead
      // of fading the whole way down.
      background: `linear-gradient(to bottom, ${gradientTop} 0%, ${token.colorBgLayout} 50%)`,
    }}>
      {/* Renders on every theme — TronArenaBackground dims its own grid
          intensity for Light rather than being hidden there. Confined
          below the form (see the box measurement above) so it never shows
          through behind the title/fields. */}
      {box && <TronArenaBackground top={box.top} height={box.height} />}

      <div ref={contentRef} style={{ width: '100%', maxWidth: 360, position: 'relative' }}>
        <Typography.Title level={4} style={{ marginTop: 0, marginBottom: 4 }}>{title}</Typography.Title>
        {subtitle && (
          <Typography.Text style={{ display: 'block', marginBottom: 24, color: token.colorTextSecondary }}>
            {subtitle}
          </Typography.Text>
        )}
        {!subtitle && <div style={{ marginBottom: 24 }} />}

        {children}
      </div>
    </div>
  )
}
