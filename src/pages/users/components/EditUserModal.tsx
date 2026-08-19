import { useEffect } from 'react'
import { Drawer, Button, Space, Form, Input } from 'antd'
import { Select } from '../../../components/AppSelect'
import type { AuthUser } from '../../../types/installment'
import type { UserAccount, UserRole } from '../../../types/user'
import { assignableRoles, ROLE_LABELS } from '../../../constants/roles'
import { BRANCHES } from '../../../constants/mockData'

interface Props {
  open: boolean
  actor: AuthUser
  account: UserAccount | null
  onClose: () => void
  onUpdated: () => void
}

interface FormValues {
  name: string
  staffId: string
  phone: string
  role: UserRole
  branch?: string
}

const BRANCH_ROLES: UserRole[] = ['branch_manager', 'staff']

export function EditUserModal({ open, actor, account, onClose, onUpdated }: Props) {
  const [form] = Form.useForm<FormValues>()
  const role = Form.useWatch('role', form)
  const roleOptions = assignableRoles(actor).map(r => ({ value: r, label: ROLE_LABELS[r] }))

  useEffect(() => {
    if (account) {
      form.setFieldsValue({
        name: account.name,
        staffId: account.staffId,
        phone: account.phone,
        role: account.role,
        branch: account.branch,
      })
    }
  }, [account, form])

  function handleSubmit(values: FormValues) {
    if (!account) return
    account.name = values.name
    account.staffId = values.staffId
    account.phone = values.phone
    account.role = values.role
    account.branch = BRANCH_ROLES.includes(values.role) ? values.branch : undefined
    onUpdated()
  }

  return (
    <Drawer
      open={open}
      title="Edit user"
      onClose={onClose}
      destroyOnHidden
      width={420}
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={() => form.submit()}>Save</Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
        <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Required' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Staff ID" name="staffId" rules={[{ required: true, message: 'Required' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Phone" name="phone" rules={[{ required: true, message: 'Required' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Role" name="role" rules={[{ required: true, message: 'Required' }]}>
          <Select options={roleOptions} />
        </Form.Item>
        {role && BRANCH_ROLES.includes(role) && (
          <Form.Item label="Branch" name="branch" rules={[{ required: true, message: 'Required' }]}>
            <Select options={BRANCHES.map(b => ({ value: b, label: b }))} />
          </Form.Item>
        )}
      </Form>
    </Drawer>
  )
}
