import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

// A4 in points, jsPDF's default unit for the 'a4' format.
const A4_WIDTH_PT = 595.28
const A4_HEIGHT_PT = 841.89

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

export async function downloadContractPdf(element: HTMLElement, fileName: string): Promise<void> {
  const canvas = await withInlinedImages(element, () => html2canvas(element, {
    // 2x so the text survives the trip through a raster at print size.
    scale: 2,
    useCORS: true,
    // html2canvas paints transparent as black; the page is white paper.
    backgroundColor: '#ffffff',
    logging: false,
  }))

  const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' })

  // Fit the capture to the page width, then walk down it one page-height at
  // a time — a contract runs past a single sheet and has to break across
  // pages rather than being squashed onto one.
  const scale = A4_WIDTH_PT / canvas.width
  const scaledHeight = canvas.height * scale
  const pageCount = Math.max(1, Math.ceil(scaledHeight / A4_HEIGHT_PT))

  for (let page = 0; page < pageCount; page++) {
    if (page > 0) pdf.addPage()
    // Each page shows the same image shifted up by one page height, with
    // the page's own clipping doing the cropping.
    pdf.addImage(
      canvas.toDataURL('image/png'),
      'PNG',
      0,
      -page * A4_HEIGHT_PT,
      A4_WIDTH_PT,
      scaledHeight,
      undefined,
      'FAST',
    )
  }

  pdf.save(fileName)
}
