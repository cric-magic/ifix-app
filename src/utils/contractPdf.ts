import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

// Legal (8.5 x 14in) in points — the sheet the contract is laid out for
// (see PAGE_WIDTH/PAGE_HEIGHT in ContractDocument.tsx).
const PAGE_WIDTH_PT = 612
const PAGE_HEIGHT_PT = 1008

// Renders the contract page to a real PDF file rather than leaning on the
// browser's own print-to-PDF, so Download produces a file directly.
//
// The page is rasterised rather than typeset: the document is Thai/English
// with a QR code, a barcode-style layout and CSS the PDF text APIs can't
// reproduce, and getting that wrong silently (missing glyphs, reflowed
// tables) is worse than an image. The trade-off is that the text isn't
// selectable — a real typeset export would need the layout rebuilt against
// jsPDF's own primitives plus an embedded Thai font.
// html2canvas can't rasterise an image it didn't load itself under CORS —
// the merchant logo is a cross-origin SVG (the generated DiceBear avatar),
// and it came out as an empty box. Fetching each image and swapping in a
// data URI for the duration of the capture fixes that; anything that fails
// to fetch is simply left alone and omitted, as before.
async function withInlinedImages<T>(root: HTMLElement, run: () => Promise<T>): Promise<T> {
  const images = [...root.querySelectorAll('img')].filter(img => !img.src.startsWith('data:'))
  const restore: (() => void)[] = []

  await Promise.all(images.map(async img => {
    try {
      const blob = await fetch(img.src, { mode: 'cors' }).then(r => r.blob())
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
      const original = img.getAttribute('src') ?? ''
      img.setAttribute('src', dataUrl)
      restore.push(() => img.setAttribute('src', original))
      await img.decode().catch(() => undefined)
    } catch {
      // Leave this one as it is; the capture drops it rather than failing.
    }
  }))

  try {
    return await run()
  } finally {
    restore.forEach(fn => fn())
  }
}

// One PDF page per sheet: ContractDocument has already laid the contract out
// into whole Legal pages (header, content, footer), so each is captured and
// placed as it is — the PDF matches the preview and the print page for page.
export async function downloadContractPdf(pages: HTMLElement[], fileName: string): Promise<void> {
  if (pages.length === 0) throw new Error('No contract pages to export')
  const pdf = new jsPDF({ unit: 'pt', format: 'legal', orientation: 'portrait' })

  for (const [i, page] of pages.entries()) {
    const canvas = await withInlinedImages(page, () => html2canvas(page, {
      // 2x so the text survives the trip through a raster at print size.
      scale: 2,
      useCORS: true,
      // html2canvas paints transparent as black; the page is white paper.
      backgroundColor: '#ffffff',
      logging: false,
    }))
    if (i > 0) pdf.addPage()
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, PAGE_WIDTH_PT, PAGE_HEIGHT_PT, undefined, 'FAST')
  }

  pdf.save(fileName)
}
