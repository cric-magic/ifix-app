import { useLayoutEffect, useMemo } from 'react'
import { App as AntApp, ConfigProvider, theme } from 'antd'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { DevToolsProvider, useDevTools } from './contexts/DevToolsContext'
import type { ThemeVariant } from './contexts/DevToolsContext'
import { DevToolsPanel } from './components/DevToolsPanel'
import { InspectorOverlay } from './components/InspectorOverlay'
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
  // boxShadow/boxShadowSecondary set directly per-variant here (rather than
  // computed after the fact into a separate --ifix-panel-shadow/-dropdown-
  // shadow custom property, as this used to work) — antd already gives every
  // component two independent shadow slots; this app just needed to actually
  // use both instead of introducing its own on top. boxShadow = flat
  // surfaces (panels, table cards); boxShadowSecondary = floating overlays
  // (Dropdown/Select/DatePicker), which still need to read as detached from
  // the page even where flat surfaces don't.
  boxShadow: string
  boxShadowSecondary: string
  // Optional per-variant override for the functional colors — omitted only
  // for neutral, which keeps the shared muted family below (tuned around
  // that variant's own teal-ish primary). Bluish and Light both use the
  // real brand primary (#3283F8), a lot more saturated than that muted
  // family, so success/warning/error/info need their own more vivid family
  // to actually look like they belong next to it instead of reading dull/
  // mismatched. colorInfo intentionally equals colorPrimary here — "info"
  // already means "brand blue" in most systems, and having a second,
  // different blue for it next to a genuinely blue primary would just read
  // as two competing blues rather than one consistent brand color used in
  // an informational context.
  functionalColors?: {
    colorSuccess: string
    colorWarning: string
    colorError: string
    colorInfo: string
  }
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
    // antd's own default boxShadow (a soft 3-layer ambient glow, max alpha
    // 0.12) is tuned for a light backdrop and reads as nearly invisible
    // against near-black — this flatter, higher-contrast single line is
    // legible on dark without antd's fixed boxShadowTertiary's even-fainter
    // alpha (0.03) being an option either.
    boxShadow: '0 0.5px 1px 1px rgba(0, 0, 0, 0.15)',
    boxShadowSecondary: '0 0.5px 1px 1px rgba(0, 0, 0, 0.15)',
  },
  blue: {
    // Real brand colors (as of this pass): primary #3283F8, dark navy
    // #121B22, plus a lighter sky-blue #68D2F9 that has no seed slot to
    // land in yet — this token schema only has one accent color
    // (colorPrimary), with every hover/active shade auto-derived from it
    // by antd's algorithm rather than hand-specified per state. Left
    // unused for now rather than force it into colorPrimaryHover or
    // similar without knowing that's actually the intended role.
    colorPrimary: '#3283F8',
    // Base/container/layout all one flat #121B22 — no manual gap between
    // the page canvas and the container seed here. The visible elevation
    // step between the page and an actual panel (.ifix-table-panel) still
    // exists and comes entirely from colorBgElevated's own double-layered
    // colorFillQuaternary blend further down (same mechanism every variant
    // already relies on) — a same-magnitude gap that read as barely
    // perceptible near pure black apparently reads as a much more obvious
    // seam at this navy's higher base lightness, so removing the extra
    // seed-level gap here brings it back in line with how flat neutral's
    // own base/layout vs. container felt.
    colorBgBase: '#121b22',
    colorBgContainer: '#121b22',
    colorBgLayout: '#121b22',
    algorithm: 'dark',
    colorBorder: 'rgba(255, 255, 255, 0.12)',
    colorBorderSecondary: 'rgba(255, 255, 255, 0.08)',
    colorSplit: 'rgba(255, 255, 255, 0.12)',
    colorIcon: ICON_COLOR_SECONDARY,
    colorIconHover: ICON_COLOR_PRIMARY,
    boxShadow: '0 0.5px 1px 1px rgba(0, 0, 0, 0.15)',
    boxShadowSecondary: '0 0.5px 1px 1px rgba(0, 0, 0, 0.15)',
    functionalColors: {
      colorSuccess: '#22C55E',
      colorWarning: '#F59E0B',
      colorError: '#EF4444',
      colorInfo: '#3283F8',
    },
  },
  light: {
    // Same real brand primary as Bluish (#3283F8), not the old muted teal —
    // this is the one accent color meant to represent the actual brand, so
    // Light shouldn't show a different one just because the surface flipped
    // to white. Functional colors below are the same vivid family Bluish
    // uses for the same reason (see that variant's own comment).
    colorPrimary: '#3283F8',
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
    // Flat surfaces drop the shadow entirely in light mode — the border
    // already separates them from the page, and antd's own soft glow reads
    // as a smudge on a light backdrop rather than elevation. Floating
    // overlays still need one to read as detached, so they keep a real
    // (lighter, bordered) shadow via boxShadowSecondary instead.
    boxShadow: 'none',
    boxShadowSecondary: 'rgba(0, 0, 0, 0.08) 0px 0px 0px 1px, rgba(0, 0, 0, 0.08) 0px 4px 12px 0px',
    functionalColors: {
      colorSuccess: '#22C55E',
      colorWarning: '#F59E0B',
      colorError: '#EF4444',
      colorInfo: '#3283F8',
    },
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

// Shared fallback for variants that don't specify their own functionalColors
// override (neutral, light) — muted, moderate-saturation family tuned
// around those variants' own teal-ish primary. Kept as the default rather
// than duplicated onto every variant so only Bluish (the one with an
// actual brand primary so far) needs to specify anything different.
const DEFAULT_FUNCTIONAL_COLORS = {
  colorSuccess: '#6a9c72',
  colorWarning: '#c99753',
  colorError: '#b8655a',
  // antd's own default colorInfo is a vivid saturated blue with no relation
  // to this muted palette, which is what made Alert/Message's "info"
  // variant look jarring next to everything else — colorSuccess/Warning/
  // Error being in this family is also the only reason Tags already look
  // consistent, since Tag doesn't get its own component override; it just
  // inherits these seed tokens like Alert/Message/Notification/Badge all do.
  colorInfo: '#5d87a6',
}

function buildTheme(variant: ThemeVariant) {
  const { algorithm: algorithmName, functionalColors, ...variantSeed } = VARIANT_SEEDS[variant]
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
    boxShadowSecondary: string
    [key: string]: string | number
  } = {
    ...variantSeed,
    ...(functionalColors ?? DEFAULT_FUNCTIONAL_COLORS),
    // Google Sans loaded via Google Fonts (see index.html) — falls back to
    // the system stack (antd's own default fontFamily) if it hasn't loaded
    // yet or the page is ever opened offline.
    fontFamily: "'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
    lineWidth: 0.5,
    colorBgElevated: '#000000', // placeholder, replaced below once colorFillQuaternary is known
    controlHeight: 36,
    // boxShadow/boxShadowSecondary come from variantSeed above now, not a
    // shared literal here — see the comment on VARIANT_SEEDS' type.
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
  // controlItemBgHover/-Active back antd's own Dropdown menu items (the
  // menu-bar user/branch pickers) directly from the global token set, not
  // from the Menu component override below — that override only reaches
  // an actual <Menu>, not Dropdown's internal one. Left at antd's defaults
  // they're raw alpha overlays computed against colorBgContainer: hover
  // solidized down to exactly colorBgElevated (invisible), and active kept
  // a leftover blue-tinted alpha never covered by the solid-color pass.
  // Pin both to the same solid fill so hover and active read identically.
  seedTokens.controlItemBgHover = baseToken.colorFillSecondary
  seedTokens.controlItemBgActive = baseToken.colorFillSecondary
  // colorFill (not colorFillTertiary — that's weaker than Secondary in
  // antd's scale and landed indistinguishable from colorBgElevated here)
  // so hovering an already-active item still reads as a step up.
  seedTokens.controlItemBgActiveHover = baseToken.colorFill
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
  return { seedTokens, baseToken, algorithm, panelBg, wrapperBg, wrapperBorder, panelBorder, maskBg }
}

function AppThemed() {
  const { themeVariant } = useDevTools()
  const { seedTokens, baseToken, algorithm, panelBg, wrapperBg, wrapperBorder, panelBorder, maskBg } = useMemo(() => buildTheme(themeVariant), [themeVariant])

  // Shadows are no longer set here — boxShadow/boxShadowSecondary are real
  // per-variant seed tokens now (VARIANT_SEEDS above), so index.css and
  // AppLayout.tsx reference antd's own --ant-box-shadow/--ant-box-shadow-
  // secondary cssVars directly instead of a custom bridge property. The
  // nested-panel/wrapper backgrounds still need one, since those aren't
  // color/shadow AliasTokens antd exports a cssVar for on its own — re-run
  // whenever the theme variant changes so they stay in sync with it.
  useLayoutEffect(() => {
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
    // Exposes which variant is active to plain CSS (index.css's primary-
    // button beam/glow swap colors specifically for Light) — cssVars alone
    // can't express "use this token only in this variant", so this is the
    // one place a variant name itself, not just its resolved tokens, needs
    // to reach a stylesheet.
    document.documentElement.setAttribute('data-ifix-theme', themeVariant)
  }, [baseToken, seedTokens, panelBg, wrapperBg, wrapperBorder, panelBorder, themeVariant])

  return (
    <ConfigProvider theme={{
      algorithm,
      token: seedTokens,
      components: {
        Alert: {
          // antd's default with-description padding is asymmetric
          // (16px vertical / 24px horizontal) — flatten it to a uniform
          // 16px to match the rest of the app's panel/drawer padding.
          withDescriptionPadding: '16px',
          // Default is fontSizeHeading3 (24px) — oversized next to the
          // rest of the app's icon scale (17px in the sidebar nav, 15px in
          // the menu bar). 17px matches the sidebar.
          withDescriptionIconSize: 17,
        },
        Drawer: {
          colorBgMask: maskBg,
          // antd's Drawer header/body both use paddingLG (24px default) for
          // their horizontal padding — every .ifix-table-panel header/body
          // in the app (Product/Unit Details, Sale Info, etc.) uses 16px
          // (OverviewTab.tsx/UnitDetailPage.tsx), so side-by-side the
          // drawer's content sat 8px further in from the edge than a
          // panel's did. Match it.
          paddingLG: 16,
        },
        Dropdown: {
          // antd derives this internally as (controlHeight - fontSize *
          // lineHeight) / 2 to vertically center a menu item's text inside
          // controlHeight (36px in this app's grid) — (36 - 22) / 2 = 7px,
          // not a value this project set directly. Pinned to 8px (Spacing
          // 2) instead, per the project-wide move to trace every
          // padding/margin/gap back to the spacing scale.
          paddingBlock: 8,
        },
        Menu: {
          itemColor: seedTokens.colorIcon,
          itemHoverColor: seedTokens.colorIconHover,
          // itemActiveBg (mousedown/keyboard-highlighted state) defaults to
          // antd's own controlItemBgActive, an alpha overlay computed against
          // colorBgContainer — not the solid colorBgElevated our dropdowns
          // actually render on, so it came out effectively invisible. Pinned
          // to the same solid value as hover so both states read consistently.
          itemHoverBg: baseToken.colorFillSecondary,
          itemActiveBg: baseToken.colorFillSecondary,
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
          // colorFillTertiary looked right on paper (weaker than Secondary,
          // as antd's own fill scale intends) but this theme's solid-color
          // conversion (solidize() above) blends it against colorBgLayout,
          // not colorBgElevated — the surface it actually renders on here —
          // and the two happened to land on the exact same value, so the
          // "selected" highlight silently disappeared into the dropdown
          // background. colorFill (one step past Secondary/hover) keeps the
          // persistent selected state visibly stronger than the momentary
          // hover instead.
          optionSelectedBg: baseToken.colorFill,
          optionSelectedColor: baseToken.colorText,
          // The dropdown popup itself renders on colorBgElevated (antd's
          // own default, not overridden here) — optionActiveBg (hover) needs
          // to read as lighter than that surface, not the same fill used for
          // the (darker) input field's own background, or hovering an
          // option looks like a hole punched in the popup instead of a
          // highlight.
          optionActiveBg: baseToken.colorFillSecondary,
          colorBgContainer: 'transparent',
          colorBorder: baseToken.colorBorderSecondary,
          lineWidth: 1,
          // Select's own selector-box horizontal padding (antd default
          // 11px) isn't exposed as a component token — unlike Input/
          // InputNumber/DatePicker below, there's no paddingInline (or
          // equivalent) in its public ComponentToken to override here.
          // Fixed via a `.ant-select-selector` CSS rule in index.css instead.
        },
        Pagination: {
          itemActiveBg: baseToken.colorFillSecondary,
        },
        Input: {
          colorBgContainer: 'transparent',
          colorBorder: baseToken.colorBorderSecondary,
          lineWidth: 1,
          // Same 11px→12px fix as Select above.
          paddingInline: 12,
        },
        InputNumber: {
          colorBgContainer: 'transparent',
          colorBorder: baseToken.colorBorderSecondary,
          lineWidth: 1,
          paddingInline: 12,
        },
        DatePicker: {
          colorBgContainer: 'transparent',
          colorBorder: baseToken.colorBorderSecondary,
          lineWidth: 1,
          paddingInline: 12,
        },
        Checkbox: {
          // Same transparent-background convention as the Input family
          // above — antd's default paints the unchecked box with
          // colorBgContainer (a near-solid fill in this dark theme), which
          // reads as a filled square instead of an empty bordered box.
          // Transparent lets it show whatever surface it sits on (panel,
          // drawer, page) instead of a fixed shade that can clash.
          colorBgContainer: 'transparent',
        },
        Radio: {
          // Same reasoning as Checkbox above — the unchecked dot's
          // background should be transparent by default, not a solid fill.
          colorBgContainer: 'transparent',
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
          // colorFillTertiary, not colorFillSecondary — but this theme's
          // solidize() blends Tertiary against colorBgLayout, which happens
          // to land on the exact same value as colorBgElevated (the surface
          // the table body actually renders on), so the hover made rows
          // silently vanish instead of highlighting. colorFillSecondary is
          // the tier that's actually distinguishable from colorBgElevated.
          rowHoverBg: baseToken.colorFillSecondary,
          bodySortBg: baseToken.colorBgElevated,
          headerSortActiveBg: baseToken.colorBgElevated,
          headerSortHoverBg: baseToken.colorBgElevated,
          lineWidth: 1,
        },
        Button: {
          paddingInline: baseToken.paddingSM,
          // 1px to match Input/Select/InputNumber/DatePicker's own border
          // weight (App.tsx) instead of the global seed's 0.5px — a default
          // button sits right next to those fields often enough that the
          // thinner line read as an inconsistency.
          lineWidth: 1,
          // Transparent instead of a fill tint — the default/secondary
          // button no longer paints its own surface, so it always shows
          // whatever's behind it (page, panel, drawer) instead of a fixed
          // shade that could clash or double up with that backdrop.
          defaultBg: 'transparent',
          defaultColor: baseToken.colorTextSecondary,
          // Same colorFillTertiary/colorBgElevated collision as Table's
          // rowHoverBg and Select's optionSelectedBg above — a default
          // button's transparent bg reveals whatever panel is behind it
          // (usually colorBgElevated), so the hover fill needs to be a tier
          // that's actually distinguishable from that, not Tertiary.
          defaultHoverBg: baseToken.colorFillSecondary,
          defaultHoverColor: baseToken.colorText,
          defaultBorderColor: baseToken.colorBorder,
          defaultHoverBorderColor: baseToken.colorBorder,
          // Same colorFillTertiary/colorBgElevated collision again — antd's
          // type="text" (the borderless variant used for every icon-only
          // trigger: ChevronsUpDown, "...", MoreHorizontal) defaults its
          // hover to colorFillTertiary too. It happened to look fine
          // because every existing use of it sits on the sidebar's
          // transparent/colorBgLayout backdrop, where Tertiary is still
          // visibly lighter — but the same button dropped onto an elevated
          // panel or drawer would have the identical invisible-hover bug.
          textHoverBg: baseToken.colorFillSecondary,
          // antd gives every button variant its own drop shadow by default
          // (a colorPrimary-tinted line for primary, colorError-tinted for
          // danger, a neutral one for default) — all three are separate
          // Button-specific component tokens, not part of the shared seed
          // boxShadow this app already zeroes out elsewhere, so they need
          // their own override. Unconditional now (not just light mode):
          // no button in this app should carry a shadow.
          defaultShadow: 'none',
          primaryShadow: 'none',
          dangerShadow: 'none',
        },
        Upload: {
          // Same reasoning as Button above — 1px to match the input-family
          // border weight instead of the global seed's 0.5px.
          lineWidth: 1,
        },
      },
    }}>
      <AntApp>
        <AuthProvider>
          <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <DevToolsPanel />
            <InspectorOverlay />
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
