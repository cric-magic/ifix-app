import { useEffect } from 'react'
import { Drawer, Button, Space, Form, InputNumber, Switch } from 'antd'
import { useAppWindowContainer } from '../../../contexts/AppWindowContext'
import type { Merchant } from '../../../types/merchant'

interface Props {
  open: boolean
  merchant: Merchant
  onClose: () => void
  onSaved: () => void
}

interface FormValues {
  collectionFeeEnabled: boolean
  collectionFeeAmount: number
}

// Merchant-wide Collection Fee toggle/amount — per the Penalty doc, gated
// to Admin/Owner (see canManageCollectionFeeSettings), a wider actor set
// than canEditMerchant's Owner-only bar, which is why this is its own
// small drawer rather than folded into EditMerchantModal's form.
export function CollectionFeeSettingsModal({ open, merchant, onClose, onSaved }: Props) {
  const [form] = Form.useForm<FormValues>()
  const appWindow = useAppWindowContainer()
  const enabled = Form.useWatch('collectionFeeEnabled', form)

  useEffect(() => {
    form.setFieldsValue({
      collectionFeeEnabled: merchant.collectionFeeEnabled,
      collectionFeeAmount: merchant.collectionFeeAmount,
    })
  }, [merchant, open, form])

  function handleSubmit(values: FormValues) {
    merchant.collectionFeeEnabled = values.collectionFeeEnabled
    merchant.collectionFeeAmount = values.collectionFeeAmount
    onSaved()
  }

  return (
    <Drawer
      open={open}
      title="Collection Fee settings"
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
        <Form.Item label="Enable Collection Fee" name="collectionFeeEnabled" valuePropName="checked">
          <Switch />
        </Form.Item>
        {enabled && (
          <Form.Item label="Default Amount (฿)" name="collectionFeeAmount" rules={[{ required: true, message: 'Required' }]}>
            <InputNumber style={{ width: '100%' }} min={0} step={50} addonBefore="฿" />
          </Form.Item>
        )}
      </Form>
    </Drawer>
  )
}
