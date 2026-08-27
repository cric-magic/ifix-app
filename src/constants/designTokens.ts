// Shared source of truth for the values the InspectorOverlay (src/components/
// InspectorOverlay.tsx) names things against — kept separate from
// DesignDocsPage.tsx so the inspector can import it without pulling in that
// page's rendering code, but the actual scale/names below MUST stay identical
// to what's documented there (and in CLAUDE.md's "Spacing" table / the
// Colors section) — the whole point is that a value the inspector reports
// reads the same as the docs.

// The spacing scale (CLAUDE.md's "## Spacing" table, mirrored on
// /design-docs). Gaps are deliberate (nothing between 16 and 24, or 24 and
// 32) — a value that falls between two of these rounds down to the tighter
// one rather than introducing a new size.
export const SPACING_SCALE = [
  { name: '0', px: 0 },
  { name: 'px', px: 1 },
  { name: '0.5', px: 2 },
  { name: '1', px: 4 },
  { name: '1.5', px: 6 },
  { name: '2', px: 8 },
  { name: '3', px: 12 },
  { name: '4', px: 16 },
  { name: '6', px: 24 },
  { name: '8', px: 32 },
  { name: '12', px: 48 },
  { name: '16', px: 64 },
  { name: '24', px: 96 },
  { name: '32', px: 128 },
  { name: '64', px: 256 },
  { name: '96', px: 384 },
]

export function findSpacingName(px: number): string | null {
  return SPACING_SCALE.find(s => s.px === px)?.name ?? null
}

// The radius scale (CLAUDE.md's "## Radius" table, mirrored on
// /design-docs). XS/SM/Base/LG are antd's own default borderRadius tokens
// (unchanged by this app's theme) — XL and Pill are this project's own
// additions on top of them, for surfaces antd's own scale doesn't reach
// (window chrome, drawers, big cards; fully-round tags/thumbs).
export const RADIUS_SCALE = [
  { name: 'XS', px: 2 },
  { name: 'SM', px: 4 },
  { name: 'Base', px: 6 },
  { name: 'LG', px: 8 },
  { name: 'XL', px: 12 },
  { name: 'Pill', px: 999 },
]

export function findRadiusName(px: number): string | null {
  return RADIUS_SCALE.find(s => s.px === px)?.name ?? null
}

// The 5 semantic colors each expand into a full state ramp antd generates
// internally (hover/active/bg/border/text variants) — a component's actual
// computed color very often resolves to one of these, not the bare base
// color, e.g. a primary Button's :hover background is colorPrimaryHover,
// not colorPrimary. These aren't shown as their own swatches on
// /design-docs (that page curates just the 5 base colors + the structural
// scale below), but they're still real, non-hardcoded tokens antd derived
// from the same seed — the inspector needs the full ramp so it doesn't
// falsely report "no token match" for a color that's actually correctly
// theme-linked, just via a derived state token instead of the base one.
const SEMANTIC_COLORS = ['Primary', 'Success', 'Warning', 'Error', 'Info'] as const
const SEMANTIC_STATE_SUFFIXES = ['Bg', 'BgHover', 'Border', 'BorderHover', 'Hover', 'Active', 'TextHover', 'Text', 'TextActive']

// Named color tokens, in the same names as /design-docs's Colors section
// (DesignDocsPage.tsx) for the base structural set — `iconColors` is
// `useIconColors()`'s return value (token.colorIcon/colorIconHover resolved
// per-variant), not the raw ICON_COLOR_* constants, since the light variant
// seeds different values.
export function getNamedColorTokens(
  token: Record<string, unknown>,
  iconColors: { secondary: string; primary: string },
): { name: string; value: string }[] {
  const pick = (name: string) => ({ name, value: String(token[name] ?? '') })
  const entries = [
    pick('colorPrimary'),
    pick('colorSuccess'),
    pick('colorWarning'),
    pick('colorError'),
    pick('colorInfo'),
    pick('colorText'),
    pick('colorTextSecondary'),
    pick('colorTextTertiary'),
    pick('colorTextQuaternary'),
    pick('colorTextDisabled'),
    // The forced light-on-color text for solid/primary buttons and tags
    // (e.g. white text on the primary Button/Tag background) — not part of
    // the docs' Text scale (that's colorText/Secondary/Tertiary/Quaternary/
    // Disabled), but still a real, named AliasToken.
    pick('colorTextLightSolid'),
    pick('colorBgLayout'),
    pick('colorBgContainer'),
    pick('colorBgElevated'),
    pick('colorFill'),
    pick('colorFillSecondary'),
    pick('colorFillTertiary'),
    pick('colorFillQuaternary'),
    pick('colorBorder'),
    pick('colorBorderSecondary'),
    { name: 'colorIcon', value: iconColors.secondary },
    { name: 'colorIconHover', value: iconColors.primary },
  ]
  for (const color of SEMANTIC_COLORS) {
    for (const suffix of SEMANTIC_STATE_SUFFIXES) {
      entries.push(pick(`color${color}${suffix}`))
    }
  }
  return entries
}

// antd's three shadow tiers. boxShadow/boxShadowSecondary are real
// per-variant seed tokens in App.tsx's VARIANT_SEEDS (flat surfaces vs.
// floating overlays, respectively) — no separate CSS-var bridge needed,
// unlike colorIcon/colorIconHover, since these live directly on the token
// object already.
export function getNamedShadowTokens(token: Record<string, unknown>): { name: string; value: string }[] {
  return [
    { name: 'boxShadow', value: String(token.boxShadow ?? '') },
    { name: 'boxShadowSecondary', value: String(token.boxShadowSecondary ?? '') },
    { name: 'boxShadowTertiary', value: String(token.boxShadowTertiary ?? '') },
  ]
}
