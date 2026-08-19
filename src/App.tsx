import { App as AntApp, ConfigProvider, theme } from 'antd'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { DevToolsProvider, useDevTools, DEVICE_CONFIG } from './contexts/DevToolsContext'
import { DevToolsPanel } from './components/DevToolsPanel'
import { ICON_COLOR_SECONDARY, ICON_COLOR_PRIMARY } from './constants/iconColors'
import { router } from './router'

// Seed tokens for the app's theme — also fed into getDesignToken below so
// component overrides (Menu, Select, Pagination) can reference the same
// algorithm-derived fill tokens instead of hand-copied rgba literals.
const seedTokens = {
  colorPrimary: '#5b9aa8',
  colorSuccess: '#6a9c72',
  colorWarning: '#c99753',
  colorError: '#b8655a',
  lineWidth: 0.5,
  // All four base surface tokens set explicitly (rather than leaving colorBgBase/
  // colorBgLayout/colorBgElevated to the algorithm's implicit derivation) so every
  // component's background traces back to one of these four instead of a one-off
  // component override.
  colorBgBase: '#000000',
  colorBgContainer: '#0a0a0a',
  colorBgElevated: '#141414',
  colorBgLayout: '#000000',
  colorIcon: ICON_COLOR_SECONDARY,
  colorIconHover: ICON_COLOR_PRIMARY,
  colorSplit: 'rgba(255, 255, 255, 0.12)',
  controlHeight: 36,
  // boxShadowTertiary is a fixed algorithm constant, not derived from any seed
  // value, and its default alpha is too faint to read against this app's
  // near-black background — so panels bind to this seed token instead, which
  // the algorithm actually respects and which stays tweakable from one spot.
  boxShadow: '0 0.5px 1px 1px rgba(0, 0, 0, 0.3)',
}

const baseToken = theme.getDesignToken({ algorithm: theme.darkAlgorithm, token: seedTokens })

// antd's cssVar mode doesn't export box-shadow tokens (only scalar/color tokens
// get a css var), so the panel shadow is set here from the same computed
// baseToken and exposed as a custom property for index.css to reference.
document.documentElement.style.setProperty('--ifix-panel-shadow', baseToken.boxShadow)

// Flatten colorFillTertiary (an alpha overlay) onto colorBgElevated into one
// solid hex, so the fixed table columns' hover state can transition a plain
// background-color instead of a background-image (gradients can't animate,
// so a solid-to-gradient hover snapped instantly instead of fading like the
// rest of the table). Computed from the real tokens rather than hand-picked.
function blendOverlay(overlayRgba: string, baseHex: string): string {
  const [, r, g, b, a] = overlayRgba.match(/rgba\(\s*(\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\s*\)/) ?? []
  const base = [1, 3, 5].map(i => parseInt(baseHex.slice(i, i + 2), 16))
  const blended = base.map((c, i) => Math.round(Number([r, g, b][i]) * Number(a) + c * (1 - Number(a))))
  return `rgb(${blended.join(',')})`
}
document.documentElement.style.setProperty(
  '--ifix-fixed-cell-hover-bg',
  blendOverlay(baseToken.colorFillTertiary, seedTokens.colorBgElevated),
)

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

function App() {
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
          lineWidth: 1,
        },
        Pagination: {
          itemActiveBg: baseToken.colorFillSecondary,
        },
        Input: {
          colorBgContainer: baseToken.colorFillQuaternary,
          lineWidth: 1,
        },
        InputNumber: {
          colorBgContainer: baseToken.colorFillQuaternary,
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
          <DevToolsProvider>
            <AppViewport>
              <RouterProvider router={router} />
            </AppViewport>
            <DevToolsPanel />
          </DevToolsProvider>
        </AuthProvider>
      </AntApp>
    </ConfigProvider>
  )
}

export default App
