import { Drawer, Button, Space, Form, Input } from 'antd'
import { Select } from '../../../components/AppSelect'
import { useAppWindowContainer } from '../../../contexts/AppWindowContext'
import type { AuthUser } from '../../../types/installment'
import type { UserAccount, UserRole } from '../../../types/user'
import { assignableRoles, ROLE_LABELS } from '../../../constants/roles'
import { MOCK_USER_ACCOUNTS, generateTempPassword, MERCHANT_ID } from '../../../constants/mockUsers'
import { MOCK_MERCHANTS } from '../../../constants/mockMerchants'
import { BRANCHES } from '../../../constants/mockData'

interface Props {
  open: boolean
  actor: AuthUser
  onClose: () => void
  onCreated: (account: UserAccount, tempPassword: string) => void
}

interface FormValues {
  name: string
  staffId: string
  email: string
  phone: string
  role: UserRole
  branch?: string
  merchantId?: string
}

const BRANCH_ROLES: UserRole[] = ['branch_manager', 'staff']

export function CreateUserModal({ open, actor, onClose, onCreated }: Props) {
  const [form] = Form.useForm<FormValues>()
  const role = Form.useWatch('role', form)
  const roleOptions = assignableRoles(actor).map(r => ({ value: r, label: ROLE_LABELS[r] }))
  // Real merchant list now that Merchants exists (used to be a stand-in
  // single-option picker before that page was built). Suspended merchants
  // are excluded — Super Admin shouldn't be able to invite a new user into
  // a workspace that's currently deactivated.
  const merchantOptions = MOCK_MERCHANTS
    .filter(m => m.status === 'active')
    .map(m => ({ value: m.id, label: m.name }))
  const appWindow = useAppWindowContainer()

  function handleSubmit(values: FormValues) {
    const tempPassword = generateTempPassword()
    const account: UserAccount = {
      id: `user-${Date.now()}`,
      name: values.name,
      staffId: values.staffId,
      email: values.email,
      password: tempPassword,
      phone: values.phone,
      role: values.role,
      merchantId: actor.role === 'super_admin' ? values.merchantId : actor.merchantId,
      branch: BRANCH_ROLES.includes(values.role) ? values.branch : undefined,
      status: 'created',
      isTemporaryPassword: true,
      createdBy: actor.id,
      createdAt: new Date().toISOString(),
      activatedAt: null,
      suspendedBy: null,
      suspendedAt: null,
      resetToken: null,
      resetTokenExpiresAt: null,
    }
    MOCK_USER_ACCOUNTS.push(account)
    form.resetFields()
    onCreated(account, tempPassword)
  }

  return (
    <Drawer
      open={open}
      title="Create user"
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
        <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Required' }]}>
          <Input placeholder="e.g. Somchai Jaidee" />
        </Form.Item>
        <Form.Item label="Staff ID" name="staffId" rules={[{ required: true, message: 'Required' }]}>
          <Input placeholder="e.g. ST-004" />
        </Form.Item>
        <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Required' }, { type: 'email', message: 'Enter a valid email' }]}>
          <Input placeholder="name@company.com" />
        </Form.Item>
        <Form.Item label="Phone" name="phone" rules={[{ required: true, message: 'Required' }]}>
          <Input placeholder="e.g. 081-000-0000" />
        </Form.Item>
        <Form.Item label="Role" name="role" rules={[{ required: true, message: 'Required' }]}>
          <Select placeholder="Select role" options={roleOptions} />
        </Form.Item>
        {actor.role === 'super_admin' && (
          <Form.Item label="Merchant" name="merchantId" initialValue={MERCHANT_ID} rules={[{ required: true, message: 'Required' }]}>
            <Select placeholder="Select merchant" options={merchantOptions} />
          </Form.Item>
        )}
        {role && BRANCH_ROLES.includes(role) && (
          <Form.Item label="Branch" name="branch" rules={[{ required: true, message: 'Required' }]}>
            <Select placeholder="Select branch" options={BRANCHES.map(b => ({ value: b, label: b }))} />
          </Form.Item>
        )}
      </Form>
    </Drawer>
  )
}
