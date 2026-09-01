import { Drawer, Button, Space, Form, Input, message } from 'antd'
import { useAppWindowContainer } from '../../../contexts/AppWindowContext'
import type { AuthUser } from '../../../types/installment'
import type { Branch } from '../../../types/branch'
import { MOCK_BRANCHES, generateBranchId } from '../../../constants/mockBranches'

interface Props {
  open: boolean
  actor: AuthUser
  // Which merchant this branch belongs to — the actor's own merchant, or
  // (for Super Admin creating from Merchant Detail) whichever merchant is
  // currently being viewed. Passed explicitly rather than always reading
  // actor.merchantId since Super Admin has none of their own.
  merchantId: string
  onClose: () => void
  onCreated: (branch: Branch) => void
}

interface FormValues {
  name: string
  code: string
  address: string
  phone: string
  taxId: string
  taxBranchCode: string
}

// A new branch starts with an empty inventory and no assigned users, per
// the doc — bank account setup happens after creation (Edit), same
// deferred-until-edit pattern as Merchant's logo/LINE QR.
export function CreateBranchModal({ open, actor, merchantId, onClose, onCreated }: Props) {
  const [form] = Form.useForm<FormValues>()
  const appWindow = useAppWindowContainer()

  function handleSubmit(values: FormValues) {
    const codeTaken = MOCK_BRANCHES.some(b => b.merchantId === merchantId && b.code.toLowerCase() === values.code.toLowerCase())
    if (codeTaken) {
      message.error('Branch code must be unique across the merchant’s branches')
      return
    }
    const branch: Branch = {
      id: generateBranchId(),
      merchantId,
      name: values.name,
      code: values.code,
      address: values.address,
      phone: values.phone,
      status: 'active',
      taxId: values.taxId,
      taxBranchCode: values.taxBranchCode,
      createdBy: actor.id,
      createdAt: new Date().toISOString(),
      archivedBy: null,
      archivedAt: null,
    }
    form.resetFields()
    onCreated(branch)
  }

  return (
    <Drawer
      open={open}
      title="Create branch"
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
        <Form.Item label="Branch name" name="name" rules={[{ required: true, message: 'Required' }]}>
          <Input placeholder="e.g. Chiang Mai" />
        </Form.Item>
        <Form.Item
          label="Branch code"
          name="code"
          tooltip="Must be unique across this merchant's branches"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Input placeholder="e.g. CNX-01" />
        </Form.Item>
        <Form.Item
          label="Address"
          name="address"
          tooltip="The purchase location printed on the contract"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Input.TextArea rows={2} placeholder="Branch address" />
        </Form.Item>
        <Form.Item label="Phone number" name="phone" rules={[{ required: true, message: 'Required' }]}>
          <Input placeholder="e.g. 053-000-0000" />
        </Form.Item>
        <Form.Item label="Tax ID" name="taxId" rules={[{ required: true, message: 'Required' }]}>
          <Input placeholder="e.g. 0105558123456" />
        </Form.Item>
        <Form.Item label="Tax branch code" name="taxBranchCode" rules={[{ required: true, message: 'Required' }]}>
          <Input placeholder="e.g. 00001" />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
