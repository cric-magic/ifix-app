import { useLayoutEffect, useMemo } from 'react'
import { App as AntApp, ConfigProvider, theme } from 'antd'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { DevToolsProvider, useDevTools, DEVICE_CONFIG } from './contexts/DevToolsContext'
import type { ThemeVariant } from './contexts/DevToolsContext'
import { DevToolsPanel } from './components/DevToolsPanel'
import { ICON_COLOR_SECONDARY, ICON_COLOR_PRIMARY } from './constants/iconColors'
import { router } from './router'

// Per-variant seed values — only the accent (colorPrimary) and the four
// background surfaces change between variants. Text, borders, split, and
// icon colors stay the shared pinned seed values (see buildTheme) across
// every variant, so switching theme changes the feel and the accent color
// without touching the rest of the established token structure.
const VARIANT_SEEDS: Record<ThemeVariant, {
  colorPrimary: string
  colorBgBase: string
  colorBgContainer: string
  colorBgLayout: string
}> = {
  neutral: {
    colorPrimary: '#5b9aa8',
    colorBgBase: '#000000',
    colorBgContainer: '#0a0a0a',
    colorBgLayout: '#000000',
  },
  blue: {
    colorPrimary: '#5b9aa8',
    colorBgBase: '#07080b',
    colorBgContainer: '#0c0e12',
    colorBgLayout: '#07080b',
  },
}

// Flattens a translucent overlay color (rgba, e.g. one of antd's colorFill*
// tokens) onto an opaque base color (hex or rgb) into one solid rgb() —
// used below to derive colorBgElevated and (further down) the fixed table
// columns' hover color, so both stay mathematically tied to the real tokens
// instead of hand-picked hexes that silently drift out of sync whenever the
// base neutrals change.
function parseColor(color: string): [number, number, number, number] {
  if (color.startsWith('#')) {
    const [r, g, b] = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16))
    return [r, g, b, 1]
  }
  const [, r, g, b, a] = color.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)/) ?? []
  return [Number(r), Number(g), Number(b), a !== undefined ? Number(a) : 1]
}
function blendOverlay(overlay: string, base: string): string {
  const [or_, og, ob, oa] = parseColor(overlay)
  const [br, bg, bb] = parseColor(base)
  const blend = (o: number, b: number) => Math.round(o * oa + b * (1 - oa))
  return `rgb(${blend(or_, br)},${blend(og, bg)},${blend(ob, bb)})`
}

function buildTheme(variant: ThemeVariant) {
  const seedTokens = {
    ...VARIANT_SEEDS[variant],
    colorSuccess: '#6a9c72',
    colorWarning: '#c99753',
    colorError: '#b8655a',
    lineWidth: 0.5,
    colorBgElevated: '#000000', // placeholder, replaced below once colorFillQuaternary is known
    colorIcon: ICON_COLOR_SECONDARY,
    colorIconHover: ICON_COLOR_PRIMARY,
    colorSplit: 'rgba(255, 255, 255, 0.12)',
    // Pinned to plain white-alpha rather than left to the dark algorithm's
    // derivation (which bases them on colorBgBase/Container/Elevated above) —
    // otherwise these pick up whatever tint those backgrounds have. Borders
    // should always stay neutral regardless of background tint or theme
    // variant.
    colorBorder: 'rgba(255, 255, 255, 0.12)',
    colorBorderSecondary: 'rgba(255, 255, 255, 0.08)',
    controlHeight: 36,
    // boxShadowTertiary is a fixed algorithm constant, not derived from any seed
    // value, and its default alpha is too faint to read against this app's
    // near-black background — so panels bind to this seed token instead, which
    // the algorithm actually respects and which stays tweakable from one spot.
    boxShadow: '0 0.5px 1px 1px rgba(0, 0, 0, 0.3)',
  }

  // First pass: derive colorFillQuaternary from the real neutrals (this seed's
  // colorBgElevated is a placeholder here — colorFill* tokens don't depend on
  // it, only on the neutral scale, so this is safe to use as final).
  const preToken = theme.getDesignToken({ algorithm: theme.darkAlgorithm, token: seedTokens })
  // The visible panel color is colorFillQuaternary layered twice — once by the
  // page Content background, once by .ifix-table-panel's own background (see
  // AppLayout.tsx's <Content> and .ifix-table-panel in index.css) — so
  // colorBgElevated (used by Drawer/Card, which render as one solid layer) has
  // to replicate that same double layering to actually match, not just one.
  const pageBg = blendOverlay(preToken.colorFillQuaternary, seedTokens.colorBgLayout)
  seedTokens.colorBgElevated = blendOverlay(preToken.colorFillQuaternary, pageBg)

  const baseToken = theme.getDesignToken({ algorithm: theme.darkAlgorithm, token: seedTokens })
  return { seedTokens, baseToken }
}

function AppViewport({ children }: { children: React.ReactNode }) {
  const { device } = useDevTools()
  const { token } = theme.useToken()
  const width = DEVICE_CONFIG[device].width
  const isConstrained = device !== 'desktop'

  return (
    <div style={{
      background: isConstrained ? token.colorBorder : token.colorBgLayout,
      minHeight: '100vh',
      paddingBottom: isConstrained ? 80 : 0,
    }}>
      <div style={{
        width,
        margin: '0 auto',
        overflow: 'hidden',
        transition: 'width 0.25s ease',
        // The app's own layout (Sider, page background) is intentionally
        // transparent, relying on a solid canvas beneath it — normally the
        // real page background, but the constrained frame's own background
        // above is a gray device backdrop, not that canvas. Without this,
        // transparent areas showed the gray frame through instead of black.
        background: isConstrained ? token.colorBgLayout : 'transparent',
        boxShadow: isConstrained ? `0 0 0 1px ${token.colorTextQuaternary}` : 'none',
        minHeight: '100vh',
      }}>
        {children}
      </div>
    </div>
  )
}

function AppThemed() {
  const { themeVariant } = useDevTools()
  const { seedTokens, baseToken } = useMemo(() => buildTheme(themeVariant), [themeVariant])

  // antd's cssVar mode doesn't export box-shadow tokens (only scalar/color
  // tokens get a css var), so the panel shadow and the fixed-column hover
  // color are set here from the computed baseToken and exposed as custom
  // properties for index.css to reference — re-run whenever the theme
  // variant changes so both stay in sync with the active theme.
  useLayoutEffect(() => {
    document.documentElement.style.setProperty('--ifix-panel-shadow', baseToken.boxShadow)
    document.documentElement.style.setProperty(
      '--ifix-fixed-cell-hover-bg',
      blendOverlay(baseToken.colorFillTertiary, seedTokens.colorBgElevated),
    )
  }, [baseToken, seedTokens])

  return (
    <ConfigProvider theme={{
      algorithm: theme.darkAlgorithm,
      token: seedTokens,
      components: {
        Menu: {
          itemColor: ICON_COLOR_SECONDARY,
          itemHoverColor: ICON_COLOR_PRIMARY,
          itemSelectedBg: baseToken.colorFillSecondary,
          itemSelectedColor: ICON_COLOR_PRIMARY,
          itemHeight: 36,
          itemBorderRadius: 6,
        },
        Tag: {
          borderRadiusSM: 999,
          defaultBg: baseToken.colorFillTertiary,
        },
        Segmented: {
          borderRadiusSM: 6,
          trackPadding: 2,
          trackBg: baseToken.colorFillTertiary,
          itemSelectedBg: baseToken.colorBgLayout,
          itemHoverBg: baseToken.colorFillSecondary,
        },
        Select: {
          optionSelectedBg: baseToken.colorFillTertiary,
          optionSelectedColor: baseToken.colorText,
          optionActiveBg: baseToken.colorFillQuaternary,
          colorBgContainer: baseToken.colorFillQuaternary,
          colorBorder: baseToken.colorBorderSecondary,
          lineWidth: 1,
        },
        Pagination: {
          itemActiveBg: baseToken.colorFillSecondary,
        },
        Input: {
          colorBgContainer: baseToken.colorFillQuaternary,
          colorBorder: baseToken.colorBorderSecondary,
          lineWidth: 1,
        },
        InputNumber: {
          colorBgContainer: baseToken.colorFillQuaternary,
          colorBorder: baseToken.colorBorderSecondary,
          lineWidth: 1,
        },
        Table: {
          colorBgContainer: 'transparent',
          headerBg: 'transparent',
          rowHoverBg: baseToken.colorFillTertiary,
          bodySortBg: 'transparent',
          headerSortActiveBg: 'transparent',
          headerSortHoverBg: 'transparent',
          lineWidth: 1,
        },
        Button: {
          paddingInline: baseToken.paddingSM,
          defaultBg: baseToken.colorFillQuaternary,
          defaultColor: baseToken.colorTextSecondary,
          defaultHoverBg: baseToken.colorFillTertiary,
          defaultHoverColor: baseToken.colorText,
          defaultBorderColor: baseToken.colorBorder,
          defaultHoverBorderColor: baseToken.colorBorder,
        },
      },
    }}>
      <AntApp>
        <AuthProvider>
          <AppViewport>
            <RouterProvider router={router} />
          </AppViewport>
          <DevToolsPanel />
        </AuthProvider>
      </AntApp>
    </ConfigProvider>
  )
}

function App() {
  return (
    <DevToolsProvider>
      <AppThemed />
    </DevToolsProvider>
  )
}

export default App
