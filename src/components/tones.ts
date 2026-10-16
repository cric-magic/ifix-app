import { theme } from 'antd'
import type { GlobalToken } from 'antd'
import { toHex8 } from '../utils/colorTokenLookup'

// The tone tokens — the named colours every status badge is drawn from.
// A badge never names an antd colour itself: it names a status, the status
// map (constants/statusBadges.ts) gives it a tone, and the tone gives it
// two colours:
//   dot  — the tone's source token at full strength
//   fill — that same colour at 16% opacity, as an 8-digit hex, so it still
//          sits on whatever surface is behind it (a panel, a hovered row)
// The text stays the regular secondary text colour on every tone (tertiary
// for a muted badge): this theme's green and amber are bright, so even
// their darkest text shades measured about 3:1 on their own faint fill —
// too faint to read at tag size.
//
//   primary — brand blue: in progress, the total (All)
//   success — done / good
//   warning — waiting on someone
//   error   — failed, blocked, overdue
//   neutral — not started, closed, or a plain label with no status
//   purple  — done but not "good" (Sold); antd's purple preset, since
//             colorInfo is the same blue as colorPrimary here
//   cyan, lime, magenta — a SKU's condition (New, Opened, Used): kinds,
//             not statuses, so hues the statuses don't use
export type Tone = 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'purple' | 'cyan' | 'lime' | 'magenta'

export const TONE_FILL_ALPHA = 0.16

// Each tone's source token, in order — also what /design-docs lists.
export const TONE_SOURCES: { tone: Tone; token: keyof GlobalToken }[] = [
  { tone: 'primary', token: 'colorPrimary' },
  { tone: 'success', token: 'colorSuccess' },
  { tone: 'warning', token: 'colorWarning' },
  { tone: 'error', token: 'colorError' },
  { tone: 'neutral', token: 'colorTextTertiary' },
  { tone: 'purple', token: 'purple6' },
  { tone: 'cyan', token: 'cyan6' },
  { tone: 'lime', token: 'lime6' },
  { tone: 'magenta', token: 'magenta6' },
]

export interface ToneColors {
  dot: string
  fill: string
}

export function toneColors(token: GlobalToken, tone: Tone): ToneColors {
  const dot = token[TONE_SOURCES.find(s => s.tone === tone)!.token] as string
  return { dot, fill: toHex8(dot, TONE_FILL_ALPHA) }
}

export function useTones(): Record<Tone, ToneColors> {
  const { token } = theme.useToken()
  return Object.fromEntries(TONE_SOURCES.map(({ tone }) => [tone, toneColors(token, tone)])) as Record<Tone, ToneColors>
}
