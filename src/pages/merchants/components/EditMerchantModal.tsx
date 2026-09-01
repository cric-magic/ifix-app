import { useEffect } from 'react'
import { Drawer, Button, Space, Form, Input } from 'antd'
import { Select } from '../../../components/AppSelect'
import { PhotoUpload } from '../../../components/PhotoUpload'
import { useAppWindowContainer } from '../../../contexts/AppWindowContext'
import type { ContractFormat, Merchant } from '../../../types/merchant'

interface Props {
  open: boolean
  merchant: Merchant | null
  onClose: () => void
  onUpdated: () => void
}

interface FormValues {
  name: string
  legalName: string
  address: string
  contractFormat: ContractFormat
  contractPrefix: string
  logo?: string[]
  lineQr?: string[]
}

const CONTRACT_FORMAT_OPTIONS = [
  { value: 'auto_running', label: 'Auto-running (yyyyMMdd-xxxxxx, resets monthly)' },
  { value: 'random', label: 'Random (non-traceable UUID)' },
]

export function EditMerchantModal({ open, merchant, onClose, onUpdated }: Props) {
  const [form] = Form.useForm<FormValues>()
  const appWindow = useAppWindowContainer()

  useEffect(() => {
    if (merchant) {
      form.setFieldsValue({
        name: merchant.name,
        legalName: merchant.legalName,
        address: merchant.address,
        contractFormat: merchant.contractFormat,
        contractPrefix: merchant.contractPrefix,
        logo: merchant.logoUrl ? [merchant.logoUrl] : [],
        lineQr: merchant.lineQrUrl ? [merchant.lineQrUrl] : [],
      })
    }
  }, [merchant, form])

  function handleSubmit(values: FormValues) {
    if (!merchant) return
    merchant.name = values.name
    merchant.legalName = values.legalName
    merchant.address = values.address
    merchant.contractFormat = values.contractFormat
    merchant.contractPrefix = values.contractPrefix
    merchant.logoUrl = values.logo?.[0]
    merchant.lineQrUrl = values.lineQr?.[0]
    onUpdated()
  }

  return (
    <Drawer
      open={open}
      title="Edit merchant"
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
        <Form.Item label="Logo" name="logo">
          <PhotoUpload maxCount={1} />
        </Form.Item>
        <Form.Item label="Merchant name" name="name" rules={[{ required: true, message: 'Required' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Legal name" name="legalName" tooltip="Used in the contract" rules={[{ required: true, message: 'Required' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Address" name="address" rules={[{ required: true, message: 'Required' }]}>
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item label="Contract format" name="contractFormat" rules={[{ required: true, message: 'Required' }]}>
          <Select options={CONTRACT_FORMAT_OPTIONS} />
        </Form.Item>
        <Form.Item label="Contract prefix" name="contractPrefix" rules={[{ required: true, message: 'Required' }]}>
          <Input maxLength={6} />
        </Form.Item>
        <Form.Item label="LINE QR code" name="lineQr">
          <PhotoUpload maxCount={1} />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
