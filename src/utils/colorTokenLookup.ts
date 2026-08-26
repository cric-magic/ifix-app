// Matches a live computed color (always `rgb()`/`rgba()` from
// getComputedStyle) back to the antd token that produced it, so the
// InspectorOverlay can name a color the same way /design-docs does instead
// of just printing a raw value. Token values in this app are only ever hex
// or rgb()/rgba() (see App.tsx's own parseColor) — no named CSS colors — so
// a small parser covers every real case without needing a DOM round-trip.
function parseColor(value: string): [number, number, number, number] | null {
  const v = value.trim()
  if (v.startsWith('#')) {
    const hex = v.slice(1)
    if (hex.length === 3) {
      const [r, g, b] = hex.split('').map(c => parseInt(c + c, 16))
      return [r, g, b, 1]
    }
    if (hex.length === 6 || hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1
      return [r, g, b, a]
    }
    return null
  }
  const match = v.match(/^rgba?\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\s*\)$/)
  if (!match) return null
  const [, r, g, b, a] = match
  return [Number(r), Number(g), Number(b), a !== undefined ? Number(a) : 1]
}

function colorsEqual(a: string, b: string): boolean {
  const pa = parseColor(a)
  const pb = parseColor(b)
  if (!pa || !pb) return a === b
  return pa[0] === pb[0] && pa[1] === pb[1] && pa[2] === pb[2] && Math.abs(pa[3] - pb[3]) < 0.01
}

export function isTransparentColor(value: string): boolean {
  const p = parseColor(value)
  return value === 'transparent' || (p !== null && p[3] === 0)
}

// Shared with DesignDocsPage.tsx's Colors section, so the InspectorOverlay
// popover prints a value in the exact same form the docs do. Solid tokens
// resolve to `rgb(r, g, b)` (App.tsx's blendOverlay output) or already to a
// literal hex — normalize both to hex. Actually-translucent values (rgba
// with alpha < 1) pass through unchanged, since flattening those to hex
// would silently drop the alpha.
export function toHex(value: string): string {
  const match = value.match(/^rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)$/)
  if (!match) return value
  const [, r, g, b, a] = match
  if (a !== undefined && Number(a) < 1) return value
  const toByte = (n: string) => Number(n).toString(16).padStart(2, '0')
  return `#${toByte(r)}${toByte(g)}${toByte(b)}`
}

// Linear scan over ~20 named tokens — only ever called on click (once per
// pin, a handful of times per popover render), not per animation frame, so
// there's no need for a Map-based index.
export function buildColorTokenLookup(entries: { name: string; value: string }[]) {
  return (cssValue: string): string | null => {
    if (!cssValue || isTransparentColor(cssValue)) return null
    for (const { name, value } of entries) {
      if (value && colorsEqual(cssValue, value)) return name
    }
    return null
  }
}
