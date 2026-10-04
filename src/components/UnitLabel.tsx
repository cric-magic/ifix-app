import { useEffect, useLayoutEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { ConfigProvider, Typography, theme } from 'antd'
import { PAPER_THEME } from '../constants/paperTheme'
import JsBarcode from 'jsbarcode'
import QRCode from 'qrcode'
import type { BarcodeSettings } from '../types/merchant'
import type { Product, ProductUnit } from '../types/product'
import { LABEL_SIZES, PRINTER_DOT_MM, PX_PER_MM } from '../constants/labelSizes'

interface Props {
  unit: ProductUnit
  product: Product
  settings: BarcodeSettings
  // Set on the copy that actually goes to the printer (see
  // PrintUnitLabelModal); drops the screen-only chrome. The print
  // positioning itself lives on the wrapper that copy is portalled into,
  // not here — inline styles would win over the @media print rules.
  forPrint?: boolean
}

// What the codes carry. The doc: "Merchant-level Barcode Settings determine
// whether Serial Number or Internal Unit ID is encoded" and "When both code
// types are shown, Barcode and QR Code must encode the same selected
// identifier" — so this is resolved once and shared by both renderers.
export function encodedValueFor(unit: ProductUnit, settings: BarcodeSettings): string {
  return settings.encodedValue === 'unitId' ? unit.unitNumber : unit.serialNumber
}

// A physical label is always printed dark-on-white regardless of which
// theme the app is in, so it renders under PAPER_THEME. That resets the
// app's own per-variant seeds, which a bare algorithm switch inherits — in
// the dark variants the label's "white" was the app's near-black
// colorBgContainer.
export function UnitLabel({ unit, product, settings, forPrint }: Props) {
  return (
    <ConfigProvider theme={PAPER_THEME}>
      <LabelBody unit={unit} product={product} settings={settings} forPrint={forPrint} />
    </ConfigProvider>
  )
}

// The on-screen preview of a label: the label on a light grey canvas, the
// same "desk" the contract preview sits on (PAPER_THEME's colorBgLayout), so
// a white label reads as paper in every app variant rather than as another
// white panel. Used wherever a label is shown before printing — the Barcode
// settings page, its edit drawer, and the Print Label drawer.
//
// The label is laid out at its real size in mm, so it's shown enlarged here
// (up to 2×, less if the canvas is narrower) — true size is a 4cm sticker.
// When the chosen fields don't fit the sticker, a note under it says so;
// `fitHint` is what to do about it, for whoever is looking (an admin
// editing the settings, or Staff printing).
//
// `fill` makes the canvas take its container's full height with the label
// centred, square-cornered — for the edit drawer, where the canvas is the
// whole preview column (as ContractDocument's is in the contract editor)
// rather than a rounded box inside a card.
export function UnitLabelPreview({ unit, product, settings, fill, fitHint }: Omit<Props, 'forPrint'> & { fill?: boolean; fitHint?: string }) {
  const [fit, setFit] = useState<LabelFit>({ textFits: true, barcodeFits: true })
  return (
    <ConfigProvider theme={PAPER_THEME}>
      <PreviewCanvas fill={fill} labelWidthMm={LABEL_SIZES[settings.labelSize].width}>
        <LabelBody unit={unit} product={product} settings={settings} onFitChange={setFit} />
      </PreviewCanvas>
      {!fit.barcodeFits && (
        // Not a field to turn off: the value itself is too long for bars a
        // scanner can read at this width. A QR Code holds it at any length.
        <Typography.Text type="warning" style={{ display: 'block', fontSize: 13, marginTop: 8 }}>
          This value is too long for a scannable barcode on a {LABEL_SIZES[settings.labelSize].label} sticker, so the barcode is left off. Use QR Code only, or a shorter value.
        </Typography.Text>
      )}
      {!fit.textFits && (
        <Typography.Text type="warning" style={{ display: 'block', fontSize: 13, marginTop: 8 }}>
          Not everything fits on a {LABEL_SIZES[settings.labelSize].label} sticker inside its safe margin, so some of it is cut off.
          {fitHint ? ` ${fitHint}` : ''}
        </Typography.Text>
      )}
    </ConfigProvider>
  )
}

// Text sizes, in three steps down the sticker's hierarchy. Scanning comes
// first on this sticker, so the text is kept as small as a 203 dpi thermal
// printer (about 2.8 dots per point) still prints legibly, and every bit of
// height it gives up goes to the barcode. 4.5pt is the floor: its strokes
// are about one dot, and below it letters break up. The name and price,
// what people read first, stay a step larger and bold.
const TEXT_PRIMARY = '5.5pt'
const TEXT_SECONDARY = '5pt'
// The barcode's value and the reference details — fine print, read up close.
const TEXT_FINE = '4.5pt'
const TEXT_LINE_HEIGHT = 1.1

// The sticker's safe margin, on every side: nothing prints within it, so a
// die-cut that lands a little off still never clips text or a code. The
// codes' own quiet zones (the blank a scanner needs around them) are
// inside the safe area, on top of this — so they survive the cut too.
const SAFE_MARGIN_MM = 2

// A QR Code's quiet zone, in its own modules — the standard's four. Drawn
// as part of the QR image (white on the white sticker), so the clear space
// goes wherever the code does.
const QR_QUIET_ZONE_MODULES = 4
const QR_MODULE_DOTS = 2

// How much larger than true size the preview shows the label, at most.
const PREVIEW_ZOOM = 2

function PreviewCanvas({ fill, labelWidthMm, children }: { fill?: boolean; labelWidthMm: number; children: React.ReactNode }) {
  const { token } = theme.useToken()
  const ref = useRef<HTMLDivElement>(null)
  const [available, setAvailable] = useState<number | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(entries => setAvailable(entries[0].contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const labelPx = labelWidthMm * PX_PER_MM
  const zoom = available ? Math.min(PREVIEW_ZOOM, available / labelPx) : PREVIEW_ZOOM

  return (
    <div ref={ref} style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: fill ? 'center' : undefined,
      minHeight: fill ? '100%' : undefined,
      padding: 24,
      borderRadius: fill ? 0 : token.borderRadiusLG,
      background: token.colorBgLayout,
    }}>
      <div style={{ zoom }}>{children}</div>
    </div>
  )
}

// What doesn't fit the sticker: text (fixable by turning a field off or a
// bigger sticker), or the barcode itself (a value too long to scan at this
// width).
interface LabelFit {
  textFits: boolean
  barcodeFits: boolean
}

function LabelBody({ unit, product, settings, forPrint, onFitChange }: Props & { onFitChange?: Dispatch<SetStateAction<LabelFit>> }) {
  const { token } = theme.useToken()
  const value = encodedValueFor(unit, settings)
  const size = LABEL_SIZES[settings.labelSize]
  const boxRef = useRef<HTMLDivElement>(null)

  // Solid black rather than token.colorText (which is alpha-based) — a
  // scanner reads contrast, and the encoders below want a plain hex value.
  const ink = token.colorTextBase
  const paper = token.colorBgContainer

  const showBarcode = settings.codeTypes === 'barcode' || settings.codeTypes === 'both'
  const showQr = settings.codeTypes === 'qr' || settings.codeTypes === 'both'

  const price = unit.customPrice ?? product.salesPrice

  // Laid out by what people look for on a shelf or a box, top to bottom:
  // what it is (name, with the price opposite), which variant (storage,
  // color, grade), then the Barcode on its own row, then the QR Code on the
  // next with the reference details (serial, SKU, branch) beside it.
  //
  // All text is one size, solid ink, with only the name and price in bold:
  // a thermal printer can't print grey — it dithers it into speckle,
  // unreadable at this size — so the order on the sticker and those two
  // bold values carry the hierarchy.
  const showName = settings.showProductName
  const showPrice = settings.showSalesPrice
  const variant = [
    settings.showStorage && product.storage,
    settings.showColor && product.color,
    settings.showGrade && unit.grade && `Grade ${unit.grade}`,
  ].filter((v): v is string => !!v)
  // The Serial Number is always printed as text (per the doc). Under the
  // barcode, as its human-readable line, when that's what it encodes;
  // otherwise here, with the other reference details.
  const serialUnderBarcode = showBarcode && value === unit.serialNumber
  // One per line: beside a 10mm QR Code there's height for three, and a
  // line of its own keeps each from being cut short.
  const reference = [
    !serialUnderBarcode && unit.serialNumber,
    settings.showSkuCode && product.sku,
    settings.showBranch && unit.branch,
  ].filter((v): v is string => !!v)

  const oneLine = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 } as const

  // Whether everything fits the sticker with nothing cut off. Every row is
  // one fixed-height line, so the height holds whatever's switched on; a
  // value too long for its line ends in "…" instead — so both count: the
  // box overflowing (it's fixed at the sticker's size and clips), and any
  // one-line row truncating (marked data-one-line). Re-checked after every
  // render.
  useLayoutEffect(() => {
    const box = boxRef.current
    if (!box || !onFitChange) return
    const truncated = [...box.querySelectorAll<HTMLElement>('[data-one-line]')]
      .some(el => el.scrollWidth > el.clientWidth + 1)
    const barcodeFits = !box.querySelector('[data-too-long]')
    const textFits = box.scrollHeight <= box.clientHeight + 1 && !truncated
    // Only on a change — a fresh object every render would loop.
    onFitChange(prev => (prev.textFits === textFits && prev.barcodeFits === barcodeFits ? prev : { textFits, barcodeFits }))
  })

  return (
    <div
      ref={boxRef}
      style={{
        // The sticker at its real size (mm), so the print matches the roll.
        width: `${size.width}mm`,
        height: `${size.height}mm`,
        padding: `${SAFE_MARGIN_MM}mm`,
        boxSizing: 'border-box',
        overflow: 'hidden',
        background: paper,
        color: ink,
        border: forPrint ? 'none' : `0.5px solid ${token.colorBorderSecondary}`,
        // Square-cornered like the contract sheet: it's a piece of paper, not
        // a card. The shadow is screen only — it lifts the label off the
        // preview canvas (the project's second elevation, from the paper
        // theme); the printed label is the sticker itself, so no shadow.
        boxShadow: forPrint ? 'none' : token.boxShadowSecondary,
        // The groups — what it is, the Barcode, the QR Code row — spread
        // top to bottom: the first against the top edge, the last against
        // the bottom. Whatever height the chosen fields leave over is shared
        // between them as extra clear space around the codes, rather than
        // pooling under the last line. The 1mm gap is the least they'll
        // ever sit apart.
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '1mm',
      }}
    >
      {(showName || showPrice || variant.length > 0) && (
        // The top group: what it is, then which variant.
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6mm', flexShrink: 0 }}>
          {/* What it is — the name, and the price opposite it. */}
          {(showName || showPrice) && (
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1.5mm', flexShrink: 0 }}>
              {showName && (
                <span data-one-line style={{ ...oneLine, fontSize: TEXT_PRIMARY, lineHeight: TEXT_LINE_HEIGHT, fontWeight: 700 }}>{product.name}</span>
              )}
              {showPrice && (
                <span style={{ fontSize: TEXT_PRIMARY, lineHeight: TEXT_LINE_HEIGHT, fontWeight: 700, flexShrink: 0 }}>฿{price.toLocaleString()}</span>
              )}
            </div>
          )}

          {/* Which variant — storage, color and grade. */}
          {variant.length > 0 && (
            <div data-one-line style={{ ...oneLine, fontSize: TEXT_SECONDARY, lineHeight: TEXT_LINE_HEIGHT, flexShrink: 0 }}>
              {variant.join(' · ')}
            </div>
          )}
        </div>
      )}

      {/* The Barcode on a row of its own, full width, with its value printed
          under it — the usual retail price-tag layout (POSPOS's among them).
          Nothing else shares the row, so its quiet zones stay clear. */}
      {/* Its bars take whatever height the rest leaves — taller bars read
          from more angles — from BARCODE_MIN_HEIGHT_MM (below it the fit
          check warns) up to BARCODE_MAX_HEIGHT_MM. */}
      {showBarcode && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5mm', flex: '1 1 0', minHeight: 0 }}>
          <div style={{ display: 'flex', flex: '1 1 0', alignSelf: 'stretch', minHeight: `${BARCODE_MIN_HEIGHT_MM}mm`, maxHeight: `${BARCODE_MAX_HEIGHT_MM}mm` }}>
            <Barcode value={value} ink={ink} paper={paper} labelWidthMm={size.width} />
          </div>
          <div data-one-line style={{ ...oneLine, maxWidth: '100%', fontFamily: token.fontFamilyCode, fontSize: TEXT_FINE, lineHeight: TEXT_LINE_HEIGHT }}>
            {value}
          </div>
        </div>
      )}

      {/* The QR Code on the next row, with the reference details beside it
          — never beside the barcode. Without a QR Code they're the last row.
          The serial is here when the codes encode the internal unit id. */}
      {(showQr || reference.length > 0) && (
        // The QR image carries its own quiet zone, so it sits right at the
        // safe margin and needs only the usual gap from the text.
        <div style={{ display: 'flex', alignItems: 'center', gap: '1mm', flexShrink: 0 }}>
          {showQr && <QrCode value={value} ink={ink} paper={paper} moduleDots={QR_MODULE_DOTS} />}
          {reference.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3mm', minWidth: 0 }}>
              {reference.map((line, i) => (
                <div key={i} data-one-line style={{ ...oneLine, fontFamily: i === 0 && !serialUnderBarcode ? token.fontFamilyCode : undefined, fontSize: TEXT_FINE, lineHeight: TEXT_LINE_HEIGHT }}>
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Code 128, per the doc ("use Code 128 for the standard Barcode") — it's the
// only common linear symbology that encodes the full alphanumeric character
// set a serial number or an internal id can contain.
//
// Sized for the scanner, not stretched to fit: each module (the narrowest
// bar) is a whole number of printer dots, as wide as the row allows up to
// three (0.375mm), with a quiet zone of ten modules either side (Code 128's
// minimum) left blank. A longer value gets narrower modules, never a
// squeezed image — and once even one-dot modules don't fit, the barcode is
// left off the sticker and marked (data-too-long) so the fit check warns,
// rather than printing bars that run into the safe margin with no quiet
// zone — which a scanner can't rely on and a cut can clip.
const BARCODE_QUIET_ZONE_MODULES = 10
// Bar height: at least 5mm, the least a handheld scanner reliably reads
// across, and no more than 12mm, past which extra height adds nothing.
const BARCODE_MIN_HEIGHT_MM = 5
const BARCODE_MAX_HEIGHT_MM = 12
const BARCODE_MAX_DOTS = 3

function Barcode({ value, ink, paper, labelWidthMm }: {
  value: string
  ink: string
  paper: string
  labelWidthMm: number
}) {
  const ref = useRef<SVGSVGElement>(null)
  const modules = useMemo(() => barcodeModules(value), [value])
  const maxWidthMm = labelWidthMm - 2 * SAFE_MARGIN_MM
  const fitDots = Math.floor(maxWidthMm / ((modules + 2 * BARCODE_QUIET_ZONE_MODULES) * PRINTER_DOT_MM))
  const dots = Math.max(1, Math.min(BARCODE_MAX_DOTS, fitDots))
  const moduleMm = dots * PRINTER_DOT_MM
  // Centred on the sticker, but starting on a whole printer dot from its
  // left edge — so every bar edge lands between dots and each bar prints
  // at exactly its width. Centred freely, a 2-dot bar can straddle three
  // dots and print a dot too wide or narrow, enough to fail a scan.
  const barsMm = modules * moduleMm
  const leftMm = Math.round((labelWidthMm - barsMm) / 2 / PRINTER_DOT_MM) * PRINTER_DOT_MM

  useEffect(() => {
    if (!ref.current) return
    JsBarcode(ref.current, value, {
      format: 'CODE128',
      // The value is printed as its own text line under the bars, in the
      // label's type, rather than the symbology's caption.
      displayValue: false,
      margin: 0,
      width: 1,
      height: 1,
      lineColor: ink,
      background: paper,
    })
    // One unit per module, scaled to the module width set below.
    ref.current.setAttribute('preserveAspectRatio', 'none')
  }, [value, ink, paper])

  if (fitDots < 1) return <span data-too-long />

  return (
    <svg
      ref={ref}
      style={{
        width: `${barsMm}mm`,
        height: '100%',
        // Measured from the sticker's edge, so less the side padding the
        // row already starts at. The quiet zones are the blank either side.
        marginLeft: `${leftMm - SAFE_MARGIN_MM}mm`,
        alignSelf: 'flex-start',
        flexShrink: 0,
        shapeRendering: 'crispEdges',
        // Chrome clips an SVG to its box rounded to whole CSS pixels, which
        // at these sub-pixel mm widths trimmed the final bar of the stop
        // pattern — enough to fail a scan. The bars stay where they're
        // drawn; only the clip goes.
        overflow: 'visible',
      }}
    />
  )
}

// How many modules wide a value's Code 128 symbol is, start to stop.
function barcodeModules(value: string): number {
  const encoded: { encodings?: { data: string }[] } = {}
  JsBarcode(encoded, value, { format: 'CODE128' })
  return (encoded.encodings ?? []).reduce((sum, e) => sum + e.data.length, 0)
}

// Each QR module is a whole number of printer dots, like the barcode's bars
// — two (0.25mm), which leaves a 30mm-tall sticker room for the barcode's
// full height — so every module prints square and the same size. Drawn as vector squares, not a
// bitmap: an image gets resampled on its way to the printer and its edges
// smear into grey a thermal head can't print. It sits on the dot grid too:
// at the safe margin on the left, and on the bottom row, whose bottom edge
// is the safe margin.
function QrCode({ value, ink, paper, moduleDots }: { value: string, ink: string, paper: string, moduleDots: number }) {
  const path = useMemo(() => qrPath(value), [value])
  const sizeMm = (path.size + 2 * QR_QUIET_ZONE_MODULES) * moduleDots * PRINTER_DOT_MM
  const box = path.size + 2 * QR_QUIET_ZONE_MODULES

  return (
    <svg
      viewBox={`${-QR_QUIET_ZONE_MODULES} ${-QR_QUIET_ZONE_MODULES} ${box} ${box}`}
      // Not clipped to its pixel-rounded box — see Barcode.
      style={{ width: `${sizeMm}mm`, height: `${sizeMm}mm`, flexShrink: 0, background: paper, overflow: 'visible' }}
      shapeRendering="crispEdges"
    >
      <path d={path.d} fill={ink} />
    </svg>
  )
}

// A QR symbol as one SVG path, one unit square per dark module — merged
// into horizontal runs, so a row of modules is a single rectangle.
function qrPath(value: string): { size: number; d: string } {
  const { size, data } = QRCode.create(value).modules
  let d = ''
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!data[y * size + x]) continue
      let run = 1
      while (x + run < size && data[y * size + x + run]) run++
      d += `M${x} ${y}h${run}v1h${-run}z`
      x += run - 1
    }
  }
  return { size, d }
}
