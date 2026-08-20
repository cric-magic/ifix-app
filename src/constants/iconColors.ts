import { theme } from 'antd'

// Solid equivalents of the alpha-based text tokens, for icon glyphs only.
// Lucide icons are stroked paths with crossing/overlapping segments (e.g. Package, Building2);
// at their intersections a semi-transparent stroke double-renders and shows a visible seam.
// Text doesn't have this problem, so only icon colors use these — text keeps the token alpha.
//
// These are also the seed values for token.colorIcon/colorIconHover (see
// App.tsx), which every theme variant currently reuses as-is — but that seed
// is still the single source of truth. Components should read colors via
// useIconColors() below (which pulls token.colorIcon/colorIconHover through
// theme.useToken(), so it stays correct if a future variant ever diverges)
// rather than importing these two constants directly.
export const ICON_COLOR_SECONDARY = '#A6A6A6' // solid equivalent of rgba(255,255,255,0.65)
export const ICON_COLOR_PRIMARY = '#E0E0E0'   // solid equivalent of rgba(255,255,255,0.88)

export function useIconColors() {
  const { token } = theme.useToken()
  return { secondary: token.colorIcon, primary: token.colorIconHover }
}
