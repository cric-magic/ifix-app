import { useEffect } from 'react'
import { Drawer, Button, Space, Form, Input, message } from 'antd'
import { useAppWindowContainer } from '../../../contexts/AppWindowContext'
import type { Branch } from '../../../types/branch'
import { MOCK_BRANCHES } from '../../../constants/mockBranches'

interface Props {
  open: boolean
  branch: Branch | null
  onClose: () => void
  onUpdated: () => void
}

interface FormValues {
  name: string
  code: string
  address: string
  phone: string
  taxId: string
  taxBranchCode: string
}

export function EditBranchModal({ open, branch, onClose, onUpdated }: Props) {
  const [form] = Form.useForm<FormValues>()
  const appWindow = useAppWindowContainer()

  useEffect(() => {
    if (branch) {
      form.setFieldsValue({
        name: branch.name,
        code: branch.code,
        address: branch.address,
        phone: branch.phone,
        taxId: branch.taxId,
        taxBranchCode: branch.taxBranchCode,
      })
    }
  }, [branch, form])

  function handleSubmit(values: FormValues) {
    if (!branch) return
    const codeTaken = MOCK_BRANCHES.some(
      b => b.id !== branch.id && b.merchantId === branch.merchantId && b.code.toLowerCase() === values.code.toLowerCase(),
    )
    if (codeTaken) {
      message.error('Branch code must be unique across the merchant’s branches')
      return
    }
    branch.name = values.name
    branch.code = values.code
    branch.address = values.address
    branch.phone = values.phone
    branch.taxId = values.taxId
    branch.taxBranchCode = values.taxBranchCode
    onUpdated()
  }

  return (
    <Drawer
      open={open}
      title="Edit branch"
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
        <Form.Item label="Branch name" name="name" rules={[{ required: true, message: 'Required' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Branch code" name="code" tooltip="Must be unique across this merchant's branches" rules={[{ required: true, message: 'Required' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Address" name="address" tooltip="The purchase location printed on the contract" rules={[{ required: true, message: 'Required' }]}>
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item label="Phone number" name="phone" rules={[{ required: true, message: 'Required' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Tax ID" name="taxId" rules={[{ required: true, message: 'Required' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Tax branch code" name="taxBranchCode" rules={[{ required: true, message: 'Required' }]}>
          <Input />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
