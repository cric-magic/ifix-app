import { theme } from 'antd'

// A status colour's faint fill: its dot colour at 16% over transparent, so
// the tint sits right on whatever surface is behind it — a panel, a hovered
// row, either theme. Every status tag (DotTag) and every count pill
// (CountTabs) is filled this way, so a colour reads the same everywhere.
export function tintOf(color: string): string {
  return `color-mix(in srgb, ${color} 16%, transparent)`
}

// A status colour, as a faint fill (tintOf) and a full-strength dot. Shared by the Units list's status
// tab counts (CountTabs) and its availability tags (UnitAvailabilityTag), so
// a status reads in the same colour in both places:
//   primary — the total (All), the brand blue
//   success — Available
//   warning — Reserved
//   purple  — Sold: done, but not a warning (antd's purple preset palette,
//             since colorInfo is the same blue as colorPrimary here)
//   cyan, lime, magenta — a SKU's condition (New, Opened, Used): kinds,
//             not statuses, so hues the statuses don't use.
// The colour lives in the fill and the dot; the text stays the regular
// secondary text colour, the same as every DotTag. Coloured text was tried
// first: this theme's green and amber are bright, so even their darkest
// text shades measured about 3:1 on their own faint fill — too faint to
// read at tag size.
export type Tone = 'primary' | 'success' | 'warning' | 'purple' | 'cyan' | 'lime' | 'magenta' | 'neutral'

export interface ToneColors {
  background: string
  color: string
  dot: string
}

export function useTones(): Record<Tone, ToneColors> {
  const { token } = theme.useToken()
  return {
    primary: { background: tintOf(token.colorPrimary), color: token.colorTextSecondary, dot: token.colorPrimary },
    success: { background: tintOf(token.colorSuccess), color: token.colorTextSecondary, dot: token.colorSuccess },
    warning: { background: tintOf(token.colorWarning), color: token.colorTextSecondary, dot: token.colorWarning },
    purple: { background: tintOf(token.purple6), color: token.colorTextSecondary, dot: token.purple6 },
    cyan: { background: tintOf(token.cyan6), color: token.colorTextSecondary, dot: token.cyan6 },
    lime: { background: tintOf(token.lime6), color: token.colorTextSecondary, dot: token.lime6 },
    magenta: { background: tintOf(token.magenta6), color: token.colorTextSecondary, dot: token.magenta6 },
    neutral: { background: tintOf(token.colorTextTertiary), color: token.colorTextSecondary, dot: token.colorTextTertiary },
  }
}
