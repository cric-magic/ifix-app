import { useLayoutEffect, useMemo } from 'react'
import { App as AntApp, ConfigProvider, theme } from 'antd'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { DevToolsProvider, useDevTools } from './contexts/DevToolsContext'
import type { ThemeVariant } from './contexts/DevToolsContext'
import { DevToolsPanel } from './components/DevToolsPanel'
import { ICON_COLOR_SECONDARY, ICON_COLOR_PRIMARY } from './constants/iconColors'
import { router } from './router'

// Per-variant seed values. neutral/blue only ever change the accent +
// background hue and share the same dark algorithm, white-alpha
// borders/split, and light-on-dark icon colors. light is a genuine algorithm
// switch (theme.defaultAlgorithm, not just a background swap) — the real
// test of whether the token pipeline (border/split alpha direction, icon
// contrast, the colorBgElevated derivation) holds up outside the dark-mode
// assumptions the rest of this file was built under, so it also needs its
// own black-alpha borders/split and dark-on-light icon colors.
const VARIANT_SEEDS: Record<ThemeVariant, {
  colorPrimary: string
  colorBgBase: string
  colorBgContainer: string
  colorBgLayout: string
  algorithm: 'dark' | 'light'
  colorBorder: string
  colorBorderSecondary: string
  colorSplit: string
  colorIcon: string
  colorIconHover: string
}> = {
  neutral: {
    colorPrimary: '#5b9aa8',
    colorBgBase: '#000000',
    colorBgContainer: '#0a0a0a',
    colorBgLayout: '#000000',
    algorithm: 'dark',
    colorBorder: 'rgba(255, 255, 255, 0.12)',
    colorBorderSecondary: 'rgba(255, 255, 255, 0.08)',
    colorSplit: 'rgba(255, 255, 255, 0.12)',
    colorIcon: ICON_COLOR_SECONDARY,
    colorIconHover: ICON_COLOR_PRIMARY,
  },
  blue: {
    colorPrimary: '#5b9aa8',
    colorBgBase: '#07080b',
    colorBgContainer: '#0c0e12',
    colorBgLayout: '#07080b',
    algorithm: 'dark',
    colorBorder: 'rgba(255, 255, 255, 0.12)',
    colorBorderSecondary: 'rgba(255, 255, 255, 0.08)',
    colorSplit: 'rgba(255, 255, 255, 0.12)',
    colorIcon: ICON_COLOR_SECONDARY,
    colorIconHover: ICON_COLOR_PRIMARY,
  },
  light: {
    colorPrimary: '#3f7a88',
    // Elevation runs the opposite direction from dark mode: the outer page
    // canvas is the grayest surface and elevated components (Drawer/Card)
    // are pure white — see the colorBgElevated override in buildTheme below
    // for why this can't just reuse the dark-mode blend computation.
    colorBgBase: '#fafafa',
    colorBgContainer: '#fafafa',
    colorBgLayout: '#f5f5f5',
    algorithm: 'light',
    colorBorder: 'rgba(0, 0, 0, 0.12)',
    colorBorderSecondary: 'rgba(0, 0, 0, 0.08)',
    colorSplit: 'rgba(0, 0, 0, 0.12)',
    colorIcon: '#8c8c8c',
    colorIconHover: '#404040',
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

// Nudges `color` away from `against` by at least `minDelta` per channel, in
// whichever direction actually increases contrast for this variant (+ toward
// white for dark variants, - toward black for light) — used to guarantee
// colorBorderSecondary reads as a border and not as an invisible seam when
// it happens to land on the exact same solid value as colorBgElevated (the
// panel background it's drawn on in most places: .ifix-table-panel, photo/
// avatar borders, etc.). A no-op when the two are already distinct enough.
function ensureContrast(color: string, against: string, minDelta: number, direction: 1 | -1): string {
  const [cr, cg, cb] = parseColor(color)
  const [ar] = parseColor(against)
  const diff = direction === 1 ? cr - ar : ar - cr
  if (diff >= minDelta) return color
  const shift = (minDelta - diff) * direction
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)))
  return `rgb(${clamp(cr + shift)},${clamp(cg + shift)},${clamp(cb + shift)})`
}

function buildTheme(variant: ThemeVariant) {
  const { algorithm: algorithmName, ...variantSeed } = VARIANT_SEEDS[variant]
  const algorithm = algorithmName === 'light' ? theme.defaultAlgorithm : theme.darkAlgorithm

  // colorBorder/colorFill*/colorText* etc. get assigned solid overrides
  // further down, after the values they're computed from (preToken) are
  // known — the index signature covers those; the explicit fields keep
  // their real (string) type so existing reads elsewhere don't widen to
  // `string | number`.
  const seedTokens: {
    colorPrimary: string
    colorBgBase: string
    colorBgContainer: string
    colorBgLayout: string
    colorBorder: string
    colorBorderSecondary: string
    colorSplit: string
    colorIcon: string
    colorIconHover: string
    colorBgElevated: string
    boxShadow: string
    [key: string]: string | number
  } = {
    ...variantSeed,
    colorSuccess: '#6a9c72',
    colorWarning: '#c99753',
    colorError: '#b8655a',
    // Same muted, moderate-saturation family as the three above (antd's own
    // default colorInfo is a vivid saturated blue with no relation to this
    // palette, which is what made Alert/Message's "info" variant look
    // jarring next to everything else — colorSuccess/Warning/Error being in
    // this family is also the only reason Tags already look consistent,
    // since Tag doesn't get its own component override; it just inherits
    // these seed tokens like Alert/Message/Notification/Badge all do).
    colorInfo: '#5d87a6',
    // Google Sans loaded via Google Fonts (see index.html) — falls back to
    // the system stack (antd's own default fontFamily) if it hasn't loaded
    // yet or the page is ever opened offline.
    fontFamily: "'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
    lineWidth: 0.5,
    colorBgElevated: '#000000', // placeholder, replaced below once colorFillQuaternary is known
    controlHeight: 36,
    // boxShadowTertiary is a fixed algorithm constant, not derived from any seed
    // value, and its default alpha is too faint to read against this app's
    // near-black background — so panels bind to this seed token instead, which
    // the algorithm actually respects and which stays tweakable from one spot.
    boxShadow: '0 0.5px 1px 1px rgba(0, 0, 0, 0.15)',
  }

  // First pass: derive colorFillQuaternary from the real neutrals (this seed's
  // colorBgElevated is a placeholder here — colorFill* tokens don't depend on
  // it, only on the neutral scale, so this is safe to use as final).
  const preToken = theme.getDesignToken({ algorithm, token: seedTokens })
  // The single-layer flatten of colorFillQuaternary over the page canvas —
  // this is what the app-shell wrapper (Header + Content) painted before
  // solid-izing below, and what dark mode's colorBgElevated still needs as
  // an intermediate step (see the double-layer comment right after).
  const pageBg = blendOverlay(preToken.colorFillQuaternary, seedTokens.colorBgLayout)
  if (algorithmName === 'light') {
    // Light mode's fill tokens are black-alpha overlays (the opposite of
    // dark mode's white-alpha ones), so blending them onto colorBgLayout —
    // the trick used below for dark mode — would make "elevated" darker
    // than the page, not lighter. Elevation in light mode instead runs
    // toward white directly.
    seedTokens.colorBgElevated = '#ffffff'
  } else {
    // The visible panel color is colorFillQuaternary layered twice — once by
    // the page Content background, once by .ifix-table-panel's own
    // background (see AppLayout.tsx's <Content> and .ifix-table-panel in
    // index.css) — so colorBgElevated (used by Drawer/Card, which render as
    // one solid layer) has to replicate that same double layering to
    // actually match, not just one.
    seedTokens.colorBgElevated = blendOverlay(preToken.colorFillQuaternary, pageBg)
  }

  // Flatten every alpha-based neutral/text/fill token to a solid hex/rgb,
  // computed by blending antd's algorithm-derived alpha value onto
  // colorBgLayout — the same blendOverlay technique already used above for
  // colorBgElevated, just applied across the board instead of one token.
  // antd's defaults for these are always translucent overlays (rgba over
  // white/black) so they can automatically layer over arbitrary theme
  // backgrounds; solidifying them trades that automatic backdrop-adaptation
  // for values that are portable (a real color someone can paste into
  // Figma/CSS without knowing what it was layered over) at the cost of
  // assuming colorBgLayout as their typical backdrop. The few spots that
  // actually need the ORIGINAL alpha value blended against a specific,
  // different backdrop (colorBgElevated, panelBg/wrapperBg below) read
  // `preToken` directly instead of `baseToken`, so they're unaffected by
  // this and keep matching the exact look this app already had.
  const solidize = (alpha: string) => blendOverlay(alpha, seedTokens.colorBgLayout)
  seedTokens.colorBorder = solidize(preToken.colorBorder)
  // colorBorderSecondary's own alpha math can coincidentally land on the
  // exact same solid value as colorBgElevated (they're derived from
  // different backdrops but similar-strength alpha) — guarantee it stays a
  // touch lighter/darker (whichever direction the theme runs) than the panel
  // background it's most often drawn on top of, or it reads as no border at
  // all rather than just a faint one.
  seedTokens.colorBorderSecondary = ensureContrast(
    solidize(preToken.colorBorderSecondary),
    seedTokens.colorBgElevated,
    12,
    algorithmName === 'light' ? -1 : 1,
  )
  seedTokens.colorSplit = solidize(preToken.colorSplit)
  seedTokens.colorFill = solidize(preToken.colorFill)
  seedTokens.colorFillSecondary = solidize(preToken.colorFillSecondary)
  seedTokens.colorFillTertiary = solidize(preToken.colorFillTertiary)
  seedTokens.colorFillQuaternary = solidize(preToken.colorFillQuaternary)
  seedTokens.colorText = solidize(preToken.colorText)
  seedTokens.colorTextSecondary = solidize(preToken.colorTextSecondary)
  seedTokens.colorTextTertiary = solidize(preToken.colorTextTertiary)
  seedTokens.colorTextQuaternary = solidize(preToken.colorTextQuaternary)
  seedTokens.colorTextDisabled = solidize(preToken.colorTextDisabled)

  const baseToken = theme.getDesignToken({ algorithm, token: seedTokens })
  // Nested panels (.ifix-table-panel: Product/Unit Details, Sale Info,
  // Notes, list-page table wrappers) — white in light mode, same as
  // colorBgElevated, so they read as a clearly separate surface from the
  // gray page canvas instead of the faint gray colorFillQuaternary would
  // give against an already-gray page. Dark mode reuses colorBgElevated
  // directly since it's already the exact double-layered flatten this panel
  // needs (see the colorBgElevated derivation above) — using the new solid
  // colorFillQuaternary here instead would only be a single layer, visibly
  // lighter than the original double-translucent-layer look.
  const panelBg = algorithmName === 'light' ? '#ffffff' : seedTokens.colorBgElevated
  // The app-shell wrapper (Header + Content in AppLayout.tsx) previously
  // painted colorFillQuaternary — the same tint .ifix-table-panel paints on
  // top of it, stacking two tints. In light mode the wrapper should just be
  // flat body-canvas color (colorBgLayout) so only the nested panel (now
  // white, see panelBg above) reads as a distinct surface. Dark mode reuses
  // `pageBg` (the single-layer flatten computed above) rather than the new
  // solid colorFillQuaternary, since the wrapper is only ever painted once.
  const wrapperBg = algorithmName === 'light' ? seedTokens.colorBgLayout : pageBg
  // Light mode drops the shadow entirely on inputs/panels/buttons — flat
  // bordered surfaces instead (the border already does the job of
  // separating them from the page). Floating overlays (dropdowns, Select's
  // option list, DatePicker) are the exception: they still need a shadow to
  // read as detached from the page underneath, so they get their own
  // dropdownShadow instead of sharing this one. Dark mode is unchanged —
  // both stay the same boxShadow seed value as before.
  const panelShadow = algorithmName === 'light' ? 'none' : baseToken.boxShadow
  const dropdownShadow = algorithmName === 'light'
    ? 'rgba(0, 0, 0, 0.08) 0px 0px 0px 1px, rgba(0, 0, 0, 0.08) 0px 4px 12px 0px'
    : baseToken.boxShadow
  // The outer wrapper (Header + Content Layout in AppLayout.tsx) normally
  // borders with colorSplit and the nested .ifix-table-panel borders with the
  // fainter colorBorderSecondary. In light mode that reads backwards — the
  // wrapper's border ends up stronger than the panel's — so swap which token
  // each one uses there. Dark mode keeps the original pairing.
  const wrapperBorder = algorithmName === 'light' ? baseToken.colorBorderSecondary : baseToken.colorSplit
  const panelBorder = algorithmName === 'light' ? baseToken.colorSplit : baseToken.colorBorderSecondary
  // antd's default Drawer mask is a fixed black-alpha overlay regardless of
  // algorithm, which reads oddly against a light page. Tint the mask from
  // this variant's own colorBgBase instead — black-alpha for the dark
  // variants (colorBgBase is near-black) and white-alpha for light
  // (colorBgBase is near-white) — so it darkens or lightens the page,
  // whichever direction that theme's canvas actually goes.
  const [maskR, maskG, maskB] = parseColor(seedTokens.colorBgBase)
  const maskBg = `rgba(${maskR}, ${maskG}, ${maskB}, 0.45)`
  return { seedTokens, baseToken, algorithm, panelBg, wrapperBg, panelShadow, dropdownShadow, wrapperBorder, panelBorder, maskBg }
}

function AppThemed() {
  const { themeVariant } = useDevTools()
  const { seedTokens, baseToken, algorithm, panelBg, wrapperBg, panelShadow, dropdownShadow, wrapperBorder, panelBorder, maskBg } = useMemo(() => buildTheme(themeVariant), [themeVariant])

  // antd's cssVar mode doesn't export box-shadow tokens (only scalar/color
  // tokens get a css var), so the panel/dropdown shadows and the
  // nested-panel/wrapper backgrounds are set here from the computed
  // baseToken and exposed as custom properties for index.css and
  // AppLayout.tsx to reference — re-run whenever the theme variant changes
  // so all of them stay in sync with the active theme.
  useLayoutEffect(() => {
    document.documentElement.style.setProperty('--ifix-panel-shadow', panelShadow)
    document.documentElement.style.setProperty('--ifix-dropdown-shadow', dropdownShadow)
    document.documentElement.style.setProperty('--ifix-panel-bg', panelBg)
    document.documentElement.style.setProperty('--ifix-wrapper-bg', wrapperBg)
    document.documentElement.style.setProperty('--ifix-wrapper-border', wrapperBorder)
    document.documentElement.style.setProperty('--ifix-panel-border', panelBorder)
    // index.css's scrollbar rule falls back to a hardcoded white-alpha color
    // when --ant-color-fill-secondary isn't in scope (antd's cssVar mode only
    // defines it on the ConfigProvider's own wrapper div, not on :root, so any
    // scrollable element outside that div — like the page's own <html>/<body>
    // scrollbar — misses it). That fallback was invisible against a light
    // background, so bridge the real values onto :root the same way as the
    // other custom properties here.
    document.documentElement.style.setProperty('--ifix-scrollbar-thumb', baseToken.colorFillSecondary)
    document.documentElement.style.setProperty('--ifix-scrollbar-thumb-hover', baseToken.colorFill)
  }, [baseToken, seedTokens, panelBg, wrapperBg, panelShadow, dropdownShadow, wrapperBorder, panelBorder])

  return (
    <ConfigProvider theme={{
      algorithm,
      token: seedTokens,
      components: {
        Drawer: {
          colorBgMask: maskBg,
        },
        Menu: {
          itemColor: seedTokens.colorIcon,
          itemHoverColor: seedTokens.colorIconHover,
          itemSelectedBg: baseToken.colorFillSecondary,
          itemSelectedColor: seedTokens.colorIconHover,
          itemHeight: 36,
          itemBorderRadius: 6,
        },
        Tag: {
          borderRadiusSM: 999,
          defaultBg: baseToken.colorFillSecondary,
        },
        Segmented: {
          // trackPadding (the inset between the wrapper's border and the
          // selected-item thumb) matches the wrapper's own border width
          // (0.5px, see .ant-segmented in index.css) instead of an arbitrary
          // gap. The thumb's own radius is then the wrapper's radius minus
          // that same inset, so the two stay concentric — a rounded shape
          // inset from another rounded shape only looks "nested" correctly
          // when its radius shrinks by the inset amount, not when it copies
          // the outer radius outright.
          borderRadiusSM: baseToken.borderRadius - 0.5,
          trackPadding: 0.5,
          trackBg: baseToken.colorFillTertiary,
          itemSelectedBg: baseToken.colorBgLayout,
          itemHoverBg: baseToken.colorFillSecondary,
        },
        Select: {
          optionSelectedBg: baseToken.colorFillTertiary,
          optionSelectedColor: baseToken.colorText,
          optionActiveBg: baseToken.colorFillQuaternary,
          colorBgContainer: baseToken.colorFillQuaternary,
          colorBorder: baseToken.colorBorder,
          lineWidth: 1,
        },
        Pagination: {
          itemActiveBg: baseToken.colorFillSecondary,
        },
        Input: {
          colorBgContainer: baseToken.colorFillQuaternary,
          colorBorder: baseToken.colorBorder,
          lineWidth: 1,
        },
        InputNumber: {
          colorBgContainer: baseToken.colorFillQuaternary,
          colorBorder: baseToken.colorBorder,
          lineWidth: 1,
        },
        Table: {
          // Explicit colorBgElevated (not 'transparent') on every cell —
          // this equals panelBg exactly (see buildTheme above), so it still
          // reads as seamlessly blended into .ifix-table-panel same as
          // 'transparent' did, but now every cell (fixed columns included)
          // paints the identical solid color instead of fixed columns
          // needing their own separate opaque override + a separately
          // pre-blended hover color to avoid alpha double-stacking — now
          // that colors are solid, that whole workaround is unnecessary:
          // rowHoverBg below applies uniformly to fixed and scrolling cells
          // alike, no special-casing required (see index.css's now-removed
          // .ant-table-cell-fix-* rules).
          colorBgContainer: baseToken.colorBgElevated,
          headerBg: baseToken.colorBgElevated,
          rowHoverBg: baseToken.colorFillTertiary,
          bodySortBg: baseToken.colorBgElevated,
          headerSortActiveBg: baseToken.colorBgElevated,
          headerSortHoverBg: baseToken.colorBgElevated,
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
          // antd's own primary/danger button shadow (a colorPrimary-tinted
          // `0 1px 0` line, separate from the seed boxShadow token this app
          // already zeroes out for light mode) survived the earlier
          // shadow-removal pass since it's a Button-specific component token,
          // not part of the shared seed. Kill it the same way in light mode.
          // Only set the key at all when light — an explicit `undefined`
          // isn't ignored the way omitting the key is, so it would blank out
          // dark mode's shadow too instead of leaving antd's own default.
          ...(algorithm === theme.defaultAlgorithm ? { primaryShadow: 'none', dangerShadow: 'none' } : {}),
        },
      },
    }}>
      <AntApp>
        <AuthProvider>
          <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <DevToolsPanel />
            {/* Always present regardless of route, so both the windowed app
                (via DesktopStageLayout, nested inside the router tree) and
                the standalone /design-docs page (rendered directly, no
                window chrome) get the same definite-height, scrollable
                container to fill — see the height:100% chain notes in
                AppLayout.tsx and DesignDocsPage.tsx. */}
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
              <RouterProvider router={router} />
            </div>
          </div>
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
