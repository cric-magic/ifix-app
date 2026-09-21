import { useEffect } from 'react'
import { Drawer, Button, Space, Form, Input } from 'antd'
import { Select } from '../../../components/AppSelect'
import { useAppWindowContainer } from '../../../contexts/AppWindowContext'
import type { AuthUser } from '../../../types/installment'
import type { UserAccount, UserRole } from '../../../types/user'
import type { ProductCategory } from '../../../types/product'
import { CATEGORY_LABELS } from '../../../constants/products'
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
  permittedCategories?: ProductCategory[]
}

const BRANCH_ROLES: UserRole[] = ['branch_manager', 'staff']

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }))

export function EditUserModal({ open, actor, account, onClose, onUpdated }: Props) {
  const [form] = Form.useForm<FormValues>()
  const role = Form.useWatch('role', form)
  const roleOptions = assignableRoles(actor).map(r => ({ value: r, label: ROLE_LABELS[r] }))
  const appWindow = useAppWindowContainer()

  useEffect(() => {
    if (account) {
      form.setFieldsValue({
        name: account.name,
        staffId: account.staffId,
        phone: account.phone,
        role: account.role,
        branch: account.branch,
        permittedCategories: account.permittedCategories,
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
    // Clearing the selection restores full catalog visibility, and a role
    // change away from Staff drops the restriction entirely.
    account.permittedCategories = values.role === 'staff' && values.permittedCategories?.length
      ? values.permittedCategories
      : undefined
    onUpdated()
  }

  return (
    <Drawer
      open={open}
      title="Edit user"
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
        {role === 'staff' && (
          <Form.Item
            label="Product Categories"
            name="permittedCategories"
            help="Leave empty to allow every category"
          >
            <Select
              mode="multiple"
              allowClear
              placeholder="All categories"
              options={CATEGORY_OPTIONS}
            />
          </Form.Item>
        )}
      </Form>
    </Drawer>
  )
}
