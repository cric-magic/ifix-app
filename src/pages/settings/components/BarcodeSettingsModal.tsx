import { useEffect } from 'react'
import { Drawer, Button, Space, Form, Radio, Checkbox } from 'antd'
import { useAppWindowContainer } from '../../../contexts/AppWindowContext'
import type { BarcodeSettings, Merchant } from '../../../types/merchant'

interface Props {
  open: boolean
  merchant: Merchant
  onClose: () => void
  onSaved: () => void
}

// Merchant-wide label composition. Every field here applies to every label
// printed in the workspace — there is deliberately no per-print override
// (see PrintUnitLabelModal).
export function BarcodeSettingsModal({ open, merchant, onClose, onSaved }: Props) {
  const [form] = Form.useForm<BarcodeSettings>()
  const appWindow = useAppWindowContainer()

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
      width={420}
      getContainer={appWindow ?? undefined}
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={() => form.submit()}>Save</Button>
        </Space>
      }
    >
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

        <Form.Item label="Label fields" extra="Serial Number is always printed.">
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
    </Drawer>
  )
}
