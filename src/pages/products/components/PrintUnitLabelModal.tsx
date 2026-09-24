import { createPortal } from 'react-dom'
import { Drawer, Button, Space, Typography, theme } from 'antd'
import { Printer } from 'lucide-react'
import { useAppWindowContainer } from '../../../contexts/AppWindowContext'
import { MOCK_MERCHANTS } from '../../../constants/mockMerchants'
import type { Product, ProductUnit } from '../../../types/product'
import { UnitLabel, UnitLabelPreview, encodedValueFor } from '../../../components/UnitLabel'

interface Props {
  open: boolean
  unit: ProductUnit
  product: Product | null
  merchantId: string | undefined
  onClose: () => void
}

const ENCODED_LABELS = {
  serialNumber: 'Serial Number',
  unitId: 'Internal Unit ID',
}

// Printing is a preview + a print, not a form: per the doc, "Label display
// fields are configured in Merchant Settings rather than selected for each
// print," so there is nothing to choose here. The composition is shown
// anyway so whoever is printing can see what will come out, and the summary
// below names where to change it.
export function PrintUnitLabelModal({ open, unit, product, merchantId, onClose }: Props) {
  const { token } = theme.useToken()
  const appWindow = useAppWindowContainer()
  const merchant = MOCK_MERCHANTS.find(m => m.id === merchantId)

  if (!merchant || !product) return null
  const settings = merchant.barcodeSettings

  return (
    <Drawer
      open={open}
      title="Print label"
      onClose={onClose}
      destroyOnHidden
      width={420}
      getContainer={appWindow ?? undefined}
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" icon={<Printer size={16} strokeWidth={2.25} />} onClick={() => window.print()}>
            Print
          </Button>
        </Space>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <UnitLabelPreview unit={unit} product={product} settings={settings} />
      </div>

      {/* The copy that actually prints. Portalled to <body> so it sits
          outside this drawer's own transform — see .ifix-print-label in
          index.css. Hidden on screen; the preview above is what's seen. */}
      {createPortal(
        <div className="ifix-print-label">
          <UnitLabel unit={unit} product={product} settings={settings} forPrint />
        </div>,
        document.body,
      )}

      <Typography.Text type="secondary" style={{ fontSize: 13 }}>
        {settings.codeTypes === 'both'
          ? 'Barcode and QR Code'
          : settings.codeTypes === 'qr' ? 'QR Code only' : 'Barcode only'}
        {' · '}
        encodes {ENCODED_LABELS[settings.encodedValue]}
      </Typography.Text>
      <div style={{ marginTop: 4, fontFamily: token.fontFamilyCode, fontSize: 12, color: token.colorTextTertiary, wordBreak: 'break-all' }}>
        {encodedValueFor(unit, settings)}
      </div>
      <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginTop: 16, marginBottom: 0 }}>
        Label composition is set for the whole workspace in Settings → Barcode.
      </Typography.Paragraph>
    </Drawer>
  )
}
