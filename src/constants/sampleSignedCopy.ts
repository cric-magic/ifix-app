import { theme } from 'antd'
import type { SignedContract } from '../types/contract'

// Stock light tokens — this stands in for a photo of a paper sheet, so it
// uses the paper palette (see paperTheme.ts) whatever the app's theme.
const PAPER = theme.getDesignToken({ algorithm: theme.defaultAlgorithm })

// A stand-in "scan" for seeded contracts that are already past signing, so
// their Signed copy view has something to show. Drawn as an SVG page — a
// title, grey text lines, and a signature stroke — and labelled as sample
// data on the page itself so it can't be mistaken for a real document.
function samplePage(contractNumber: string): string {
  const lines = Array.from({ length: 22 }, (_, i) => {
    const y = 190 + i * 30
    const width = i % 5 === 4 ? 300 : 500 - (i % 3) * 40
    return `<rect x="56" y="${y}" width="${width}" height="8" rx="4" fill="${PAPER.colorFillSecondary}"/>`
  }).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 612 1008" width="612" height="1008">
<rect width="612" height="1008" fill="${PAPER.colorBgContainer}"/>
<text x="56" y="96" font-family="sans-serif" font-size="22" font-weight="600" fill="${PAPER.colorText}">Hire Purchase Agreement</text>
<text x="56" y="128" font-family="sans-serif" font-size="14" fill="${PAPER.colorTextSecondary}">${contractNumber}</text>
${lines}
<path d="M 360 900 C 380 860, 400 940, 420 890 S 460 860, 480 900 S 520 930, 548 880" fill="none" stroke="${PAPER.colorText}" stroke-width="2.5" stroke-linecap="round"/>
<line x1="340" y1="924" x2="556" y2="924" stroke="${PAPER.colorTextTertiary}" stroke-width="1"/>
<text x="340" y="944" font-family="sans-serif" font-size="11" fill="${PAPER.colorTextTertiary}">Customer signature</text>
<text x="56" y="980" font-family="sans-serif" font-size="11" fill="${PAPER.colorTextTertiary}">Sample signed copy — prototype seed data</text>
</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export function sampleSignedContract(contractNumber: string, uploadedBy: string, uploadedAt: string): SignedContract {
  return {
    files: [{ name: `${contractNumber}-signed.svg`, type: 'image/svg+xml', dataUrl: samplePage(contractNumber) }],
    uploadedBy,
    uploadedAt,
  }
}
