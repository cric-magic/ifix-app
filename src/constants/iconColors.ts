// Solid equivalents of the alpha-based text tokens, for icon glyphs only.
// Lucide icons are stroked paths with crossing/overlapping segments (e.g. Package, Building2);
// at their intersections a semi-transparent stroke double-renders and shows a visible seam.
// Text doesn't have this problem, so only icon colors use these — text keeps the token alpha.
export const ICON_COLOR_SECONDARY = '#A6A6A6' // solid equivalent of rgba(255,255,255,0.65)
export const ICON_COLOR_PRIMARY = '#E0E0E0'   // solid equivalent of rgba(255,255,255,0.88)
