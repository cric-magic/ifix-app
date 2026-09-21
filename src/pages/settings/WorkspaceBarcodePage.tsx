import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Button, Typography, message } from 'antd'
import { Pencil } from 'lucide-react'
import { useCurrentUser } from '../../contexts/AuthContext'
import { MOCK_MERCHANTS } from '../../constants/mockMerchants'
import { MOCK_PRODUCTS } from '../../constants/mockProducts'
import { MOCK_PRODUCT_UNITS } from '../../constants/mockProductUnits'
import { canConfigureBarcodeSettings, scopedAllUnits } from '../../constants/roles'
import { SettingsCard, SettingsRow } from '../../components/SettingsCard'
import { UnitLabel } from '../../components/UnitLabel'
import { BarcodeSettingsModal } from './components/BarcodeSettingsModal'

const CODE_TYPE_LABELS = {
  both: 'Barcode and QR Code',
  barcode: 'Barcode only',
  qr: 'QR Code only',
}

const ENCODED_LABELS = {
  serialNumber: 'Serial Number',
  unitId: 'Internal Unit ID',
}

// Merchant-level label composition, per the Product doc: what a printed
// unit label contains is decided once for the workspace rather than chosen
// at each print, so it sits with the other Workspace Settings tabs.
export function WorkspaceBarcodePage() {
  const actor = useCurrentUser()
  const [editOpen, setEditOpen] = useState(false)
  const [version, setVersion] = useState(0)
  void version

  // Same reasoning as Bank Accounts: Super Admin has no merchant of their
  // own for this to configure, and AppLayout hides the tab from them —
  // redirect rather than dead-end anyone who reaches the URL directly.
  if (!actor.merchantId) {
    return <Navigate to="/settings/account" replace />
  }

  const merchant = MOCK_MERCHANTS.find(m => m.id === actor.merchantId)
  if (!merchant) return null

  const settings = merchant.barcodeSettings
  const canEdit = canConfigureBarcodeSettings(actor)

  // Previewed against a real unit so the composition is shown with the
  // merchant's own data rather than placeholder text.
  const sampleUnit = scopedAllUnits(actor, MOCK_PRODUCT_UNITS, MOCK_PRODUCTS)[0]
  const sampleProduct = sampleUnit ? MOCK_PRODUCTS.find(p => p.id === sampleUnit.productId) : undefined

  const fields = [
    settings.showProductName && 'Product name',
    settings.showSkuCode && 'SKU code',
    settings.showBranch && 'Branch',
    settings.showSalesPrice && 'Sales price',
  ].filter(Boolean) as string[]

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <SettingsCard title="Barcode">
        <SettingsRow label="Code types">{CODE_TYPE_LABELS[settings.codeTypes]}</SettingsRow>
        <SettingsRow label="Encoded value">{ENCODED_LABELS[settings.encodedValue]}</SettingsRow>
        <SettingsRow label="Label fields">
          Serial Number{fields.length > 0 ? `, ${fields.join(', ')}` : ''}
        </SettingsRow>
        {canEdit && (
          <Button style={{ marginTop: 16 }} icon={<Pencil size={16} strokeWidth={2.25} />} onClick={() => setEditOpen(true)}>
            Edit
          </Button>
        )}
      </SettingsCard>

      {sampleUnit && sampleProduct && (
        <SettingsCard title="Preview">
          <Typography.Text type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>
            How a label prints for {sampleUnit.serialNumber}.
          </Typography.Text>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <UnitLabel unit={sampleUnit} product={sampleProduct} settings={settings} />
          </div>
        </SettingsCard>
      )}

      <BarcodeSettingsModal
        open={editOpen}
        merchant={merchant}
        onClose={() => setEditOpen(false)}
        onSaved={() => {
          setEditOpen(false)
          setVersion(v => v + 1)
          message.success('Barcode settings updated')
        }}
      />
    </div>
  )
}
