import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ConfigProvider, Typography, theme } from 'antd'
import { PAPER_THEME } from '../constants/paperTheme'
import JsBarcode from 'jsbarcode'
import QRCode from 'qrcode'
import type { BarcodeSettings } from '../types/merchant'
import type { Product, ProductUnit } from '../types/product'
import { LABEL_SIZES, PX_PER_MM } from '../constants/labelSizes'

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
  return settings.encodedValue === 'unitId' ? unit.id : unit.serialNumber
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
  const [fits, setFits] = useState(true)
  return (
    <ConfigProvider theme={PAPER_THEME}>
      <PreviewCanvas fill={fill} labelWidthMm={LABEL_SIZES[settings.labelSize].width}>
        <LabelBody unit={unit} product={product} settings={settings} onFitChange={setFits} />
      </PreviewCanvas>
      {!fits && (
        <Typography.Text type="warning" style={{ display: 'block', fontSize: 13, marginTop: 8 }}>
          Some text doesn't fit on a {LABEL_SIZES[settings.labelSize].label} sticker and is cut off.
          {fitHint ? ` ${fitHint}` : ''}
        </Typography.Text>
      )}
    </ConfigProvider>
  )
}

// Every line of text on the sticker: 6.5pt, readable on a thermal print,
// and small enough that each line fits a 40mm sticker's width.
const TEXT_SIZE = '6.5pt'
const TEXT_LINE_HEIGHT = 1.15

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

function LabelBody({ unit, product, settings, forPrint, onFitChange }: Props & { onFitChange?: (fits: boolean) => void }) {
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
  const both = settings.codeTypes === 'both'

  const price = unit.customPrice ?? product.salesPrice

  // Laid out by what people look for on a shelf or a box, top to bottom:
  // what it is (name, with the price opposite), which variant (storage,
  // color, grade), then the codes for the scanner, then the reference
  // details (serial, SKU, branch) small at the bottom.
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
  const reference = [
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
    onFitChange(box.scrollHeight <= box.clientHeight + 1 && !truncated)
  })

  return (
    <div
      ref={boxRef}
      style={{
        // The sticker at its real size (mm), so the print matches the roll.
        width: `${size.width}mm`,
        height: `${size.height}mm`,
        padding: '1.5mm 2mm',
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
        // Three groups — what it is, the codes, the reference details —
        // spread top to bottom: the first against the top edge, the last
        // against the bottom, the codes between. Whatever height the chosen
        // fields leave over is shared between the groups rather than
        // pooling under the last line, and the serial always prints in
        // the same place. The 1mm gap is the least they'll ever sit apart.
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
                <span data-one-line style={{ ...oneLine, fontSize: TEXT_SIZE, lineHeight: TEXT_LINE_HEIGHT, fontWeight: 700 }}>{product.name}</span>
              )}
              {showPrice && (
                <span style={{ fontSize: TEXT_SIZE, lineHeight: TEXT_LINE_HEIGHT, fontWeight: 700, flexShrink: 0 }}>฿{price.toLocaleString()}</span>
              )}
            </div>
          )}

          {/* Which variant — storage, color and grade. */}
          {variant.length > 0 && (
            <div data-one-line style={{ ...oneLine, fontSize: TEXT_SIZE, lineHeight: TEXT_LINE_HEIGHT, flexShrink: 0 }}>
              {variant.join(' · ')}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5mm', flexShrink: 0 }}>
        {/* 10mm either way — with every field on, the five text lines leave
            no more height than that at 40 × 30. */}
        {showQr && <QrCode value={value} ink={ink} paper={paper} sizeMm={10} />}
        {showBarcode && (
          <Barcode value={value} ink={ink} paper={paper} heightMm={both ? 8 : 9} compact={both} />
        )}
      </div>

      {/* Reference details, smallest. The serial is always printed as
          text, even when the codes encode the internal unit id instead —
          per the doc's own note. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3mm', flexShrink: 0 }}>
        <div data-one-line style={{ ...oneLine, fontFamily: token.fontFamilyCode, fontSize: TEXT_SIZE, lineHeight: TEXT_LINE_HEIGHT }}>
          {unit.serialNumber}
        </div>
        {reference.length > 0 && (
          <div data-one-line style={{ ...oneLine, fontSize: TEXT_SIZE, lineHeight: TEXT_LINE_HEIGHT }}>{reference.join(' · ')}</div>
        )}
      </div>
    </div>
  )
}

// Code 128, per the doc ("use Code 128 for the standard Barcode") — it's the
// only common linear symbology that encodes the full alphanumeric character
// set a serial number or an internal id can contain.
function Barcode({ value, ink, paper, heightMm, compact }: {
  value: string
  ink: string
  paper: string
  heightMm: number
  compact?: boolean
}) {
  const ref = useRef<SVGSVGElement>(null)
  const height = heightMm * PX_PER_MM

  useEffect(() => {
    if (!ref.current) return
    JsBarcode(ref.current, value, {
      format: 'CODE128',
      // The value is already printed as text below the codes, so the
      // symbology's own caption would just duplicate it.
      displayValue: false,
      margin: 0,
      height,
      width: compact ? 1 : 1.4,
      lineColor: ink,
      background: paper,
    })
  }, [value, ink, paper, height, compact])

  return <svg ref={ref} style={{ flex: 1, minWidth: 0, maxWidth: '100%', height: `${heightMm}mm` }} />
}

function QrCode({ value, ink, paper, sizeMm }: { value: string, ink: string, paper: string, sizeMm: number }) {
  const [src, setSrc] = useState<string>()

  useEffect(() => {
    let live = true
    QRCode.toDataURL(value, {
      margin: 0,
      // Rendered well above its printed size so the modules stay crisp on a
      // thermal printer (203–300 dpi) and in the enlarged preview.
      width: Math.round(sizeMm * PX_PER_MM * 4),
      color: { dark: ink, light: paper },
    }).then(url => { if (live) setSrc(url) })
    return () => { live = false }
  }, [value, ink, paper, sizeMm])

  const style = { width: `${sizeMm}mm`, height: `${sizeMm}mm`, flexShrink: 0 }
  if (!src) return <div style={style} />
  return <img src={src} alt="" style={style} />
}
