import { useEffect, useRef, useState } from 'react'
import { ConfigProvider, theme } from 'antd'
import JsBarcode from 'jsbarcode'
import QRCode from 'qrcode'
import type { BarcodeSettings } from '../types/merchant'
import type { Product, ProductUnit } from '../types/product'

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
// theme the app is in, so the whole thing renders inside antd's stock light
// theme and still reads every color off a token rather than a literal.
export function UnitLabel({ unit, product, settings, forPrint }: Props) {
  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
      <LabelBody unit={unit} product={product} settings={settings} forPrint={forPrint} />
    </ConfigProvider>
  )
}

function LabelBody({ unit, product, settings, forPrint }: Props) {
  const { token } = theme.useToken()
  const value = encodedValueFor(unit, settings)

  // Solid black rather than token.colorText (which is alpha-based) — a
  // scanner reads contrast, and the encoders below want a plain hex value.
  const ink = token.colorTextBase
  const paper = token.colorBgContainer

  const showBarcode = settings.codeTypes === 'barcode' || settings.codeTypes === 'both'
  const showQr = settings.codeTypes === 'qr' || settings.codeTypes === 'both'
  const both = settings.codeTypes === 'both'

  const price = unit.customPrice ?? product.salesPrice

  const lines: string[] = []
  if (settings.showProductName) lines.push(product.name)
  if (settings.showSkuCode) lines.push(product.sku)
  if (settings.showBranch) lines.push(unit.branch)

  return (
    <div
      style={{
        width: 264,
        padding: 12,
        background: paper,
        color: token.colorText,
        border: forPrint ? 'none' : `0.5px solid ${token.colorBorderSecondary}`,
        borderRadius: forPrint ? 0 : 6,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {showQr && <QrCode value={value} ink={ink} paper={paper} size={both ? 56 : 96} />}
        {showBarcode && (
          <Barcode value={value} ink={ink} paper={paper} height={both ? 40 : 48} compact={both} />
        )}
      </div>

      {/* Always printed as human-readable text, even when the codes encode
          the internal unit id instead — per the doc's own note. */}
      <div style={{ fontFamily: token.fontFamilyCode, fontSize: 12, lineHeight: 1.2, wordBreak: 'break-all' }}>
        {unit.serialNumber}
      </div>

      {(lines.length > 0 || settings.showSalesPrice) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {lines.map(line => (
            <div key={line} style={{ fontSize: 11, lineHeight: 1.3, color: token.colorTextSecondary }}>
              {line}
            </div>
          ))}
          {settings.showSalesPrice && (
            <div style={{ fontSize: 13, lineHeight: 1.3, fontWeight: 600 }}>
              ฿{price.toLocaleString()}
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
function Barcode({ value, ink, paper, height, compact }: {
  value: string
  ink: string
  paper: string
  height: number
  compact?: boolean
}) {
  const ref = useRef<SVGSVGElement>(null)

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

  return <svg ref={ref} style={{ flex: 1, minWidth: 0, maxWidth: '100%', height }} />
}

function QrCode({ value, ink, paper, size }: { value: string, ink: string, paper: string, size: number }) {
  const [src, setSrc] = useState<string>()

  useEffect(() => {
    let live = true
    QRCode.toDataURL(value, {
      margin: 0,
      // Rendered at 4x and scaled down so the modules stay crisp on a
      // printer, which runs at a far higher DPI than the preview.
      width: size * 4,
      color: { dark: ink, light: paper },
    }).then(url => { if (live) setSrc(url) })
    return () => { live = false }
  }, [value, ink, paper, size])

  if (!src) return <div style={{ width: size, height: size, flexShrink: 0 }} />
  return <img src={src} alt="" width={size} height={size} style={{ flexShrink: 0 }} />
}
