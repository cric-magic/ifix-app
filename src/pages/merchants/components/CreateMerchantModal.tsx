import { Drawer, Button, Space, Form, Input } from 'antd'
import { Select } from '../../../components/AppSelect'
import { useAppWindowContainer } from '../../../contexts/AppWindowContext'
import type { AuthUser } from '../../../types/installment'
import type { ContractFormat, Merchant } from '../../../types/merchant'
import { generateMerchantId } from '../../../constants/mockMerchants'

interface Props {
  open: boolean
  actor: AuthUser
  onClose: () => void
  onCreated: (merchant: Merchant) => void
}

interface FormValues {
  name: string
  legalName: string
  address: string
  ownerName: string
  ownerEmail: string
  contractFormat: ContractFormat
  contractPrefix: string
}

const CONTRACT_FORMAT_OPTIONS = [
  { value: 'auto_running', label: 'Auto-running (yyyyMMdd-xxxxxx, resets monthly)' },
  { value: 'random', label: 'Random (non-traceable UUID)' },
]

// Creating a merchant provisions an empty workspace — no branches, users
// (beyond the owner), or data yet, per the doc. The owner account itself
// isn't provisioned here (no real invite/email flow in this prototype) —
// ownerUserId stays null until a matching UserAccount is created for them,
// same as the other two seeded non-IFix merchants in mockMerchants.ts.
export function CreateMerchantModal({ open, actor, onClose, onCreated }: Props) {
  const [form] = Form.useForm<FormValues>()
  const appWindow = useAppWindowContainer()

  function handleSubmit(values: FormValues) {
    const merchant: Merchant = {
      id: generateMerchantId(),
      name: values.name,
      legalName: values.legalName,
      address: values.address,
      status: 'active',
      contractFormat: values.contractFormat,
      contractPrefix: values.contractPrefix,
      bankAccounts: [],
      ownerName: values.ownerName,
      ownerEmail: values.ownerEmail,
      ownerUserId: null,
      createdBy: actor.id,
      createdAt: new Date().toISOString(),
      suspendedBy: null,
      suspendedAt: null,
    }
    form.resetFields()
    onCreated(merchant)
  }

  return (
    <Drawer
      open={open}
      title="Create merchant"
      onClose={onClose}
      destroyOnHidden
      width={420}
      getContainer={appWindow ?? undefined}
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={() => form.submit()}>Create</Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
        <Form.Item label="Merchant name" name="name" rules={[{ required: true, message: 'Required' }]}>
          <Input placeholder="e.g. TechFix Repair Co." />
        </Form.Item>
        <Form.Item
          label="Legal name"
          name="legalName"
          tooltip="Used in the contract"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Input placeholder="e.g. TechFix Repair Co., Ltd." />
        </Form.Item>
        <Form.Item label="Address" name="address" rules={[{ required: true, message: 'Required' }]}>
          <Input.TextArea rows={2} placeholder="Registered business address" />
        </Form.Item>
        <Form.Item label="Owner name" name="ownerName" rules={[{ required: true, message: 'Required' }]}>
          <Input placeholder="e.g. Pim Chaiyasit" />
        </Form.Item>
        <Form.Item
          label="Owner email"
          name="ownerEmail"
          rules={[{ required: true, message: 'Required' }, { type: 'email', message: 'Enter a valid email' }]}
        >
          <Input placeholder="owner@company.com" />
        </Form.Item>
        <Form.Item
          label="Contract format"
          name="contractFormat"
          initialValue="auto_running"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Select options={CONTRACT_FORMAT_OPTIONS} />
        </Form.Item>
        <Form.Item
          label="Contract prefix"
          name="contractPrefix"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Input placeholder="e.g. TFX" maxLength={6} />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
