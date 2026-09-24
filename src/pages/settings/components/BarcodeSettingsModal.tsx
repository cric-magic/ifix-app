import { useEffect } from 'react'
import { Drawer, Button, Space, Form, Radio, Checkbox, Typography, theme } from 'antd'
import { useAppWindowContainer } from '../../../contexts/AppWindowContext'
import { useDevTools } from '../../../contexts/DevToolsContext'
import { UnitLabelPreview } from '../../../components/UnitLabel'
import type { BarcodeSettings, Merchant } from '../../../types/merchant'
import type { Product, ProductUnit } from '../../../types/product'

interface Props {
  open: boolean
  merchant: Merchant
  // The unit the page's own Preview card shows, so the live preview here
  // prints the same label the page does.
  sampleUnit?: ProductUnit
  sampleProduct?: Product
  onClose: () => void
  onSaved: () => void
}

// Merchant-wide label composition. Every field here applies to every label
// printed in the workspace — there is deliberately no per-print override
// (see PrintUnitLabelModal).
//
// Laid out like the contract template editor: full width, the form on the
// left and a live preview on the right, each scrolling on its own, stacking
// below the app's md breakpoint.
export function BarcodeSettingsModal({ open, merchant, sampleUnit, sampleProduct, onClose, onSaved }: Props) {
  const [form] = Form.useForm<BarcodeSettings>()
  const { token } = theme.useToken()
  const appWindow = useAppWindowContainer()
  const { windowSize } = useDevTools()
  const sideBySide = windowSize.width > 768
  // Every field, as it stands right now — the preview redraws on each change.
  const watched = Form.useWatch([], form) as Partial<BarcodeSettings> | undefined
  const previewSettings: BarcodeSettings = { ...merchant.barcodeSettings, ...watched }

  useEffect(() => {
    form.setFieldsValue({ ...merchant.barcodeSettings })
  }, [merchant, open, form])

  function handleSubmit(values: BarcodeSettings) {
    merchant.barcodeSettings = { ...values }
    onSaved()
  }

  return (
    <Drawer
      open={open}
      title="Barcode settings"
      onClose={onClose}
      destroyOnHidden
      // Full width, same as the contract template editor — index.css docks a
      // right-placed drawer 8px in from the right, so subtracting both
      // insets leaves the same 8px gap on each side.
      width={sideBySide ? 'calc(100% - 16px)' : 420}
      getContainer={appWindow ?? undefined}
      // The body itself doesn't scroll — each column below does.
      styles={{ body: sideBySide ? { padding: 0, overflow: 'hidden' } : undefined }}
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={() => form.submit()}>Save</Button>
        </Space>
      }
    >
      <div style={sideBySide ? { display: 'flex', height: '100%' } : undefined}>
        <div style={sideBySide ? { flex: '0 0 380px', minWidth: 0, overflowY: 'auto', height: '100%', padding: 16 } : undefined}>
          <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
            <Form.Item
              label="Code types"
              name="codeTypes"
              extra="Printing both gives a scanner two chances to read the same unit."
            >
              <Radio.Group
                options={[
                  { value: 'both', label: 'Barcode and QR Code' },
                  { value: 'barcode', label: 'Barcode only' },
                  { value: 'qr', label: 'QR Code only' },
                ]}
                style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              />
            </Form.Item>

            <Form.Item
              label="Encoded value"
              name="encodedValue"
              extra="Both code types encode the same value. The Serial Number is printed as text either way."
            >
              <Radio.Group
                options={[
                  { value: 'serialNumber', label: 'Serial Number' },
                  { value: 'unitId', label: 'Internal Unit ID' },
                ]}
                style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              />
            </Form.Item>

            <Form.Item label="Label fields" extra="Serial Number is always printed." style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Form.Item name="showProductName" valuePropName="checked" noStyle>
                  <Checkbox>Product name</Checkbox>
                </Form.Item>
                <Form.Item name="showSkuCode" valuePropName="checked" noStyle>
                  <Checkbox>SKU code</Checkbox>
                </Form.Item>
                <Form.Item name="showBranch" valuePropName="checked" noStyle>
                  <Checkbox>Branch</Checkbox>
                </Form.Item>
                <Form.Item name="showSalesPrice" valuePropName="checked" noStyle>
                  <Checkbox>Sales price</Checkbox>
                </Form.Item>
              </div>
            </Form.Item>
          </Form>
        </div>

        {sampleUnit && sampleProduct && (
          <div style={sideBySide
            ? {
              flex: '1 1 auto',
              minWidth: 0,
              overflowY: 'auto',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              borderLeft: `0.5px solid ${token.colorBorderSecondary}`,
            }
            : { marginTop: 24 }}
          >
            <div style={{ flex: '1 1 auto', minHeight: 0 }}>
              <UnitLabelPreview unit={sampleUnit} product={sampleProduct} settings={previewSettings} fill={sideBySide} />
            </div>
            {sideBySide && (
              <Typography.Text
                type="secondary"
                style={{ display: 'block', padding: '8px 16px', fontSize: token.fontSizeSM, borderTop: `0.5px solid ${token.colorBorderSecondary}` }}
              >
                Previewing {sampleUnit.serialNumber}
              </Typography.Text>
            )}
          </div>
        )}
      </div>
    </Drawer>
  )
}
