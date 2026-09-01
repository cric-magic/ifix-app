import { Drawer, Button, Space, Form } from 'antd'
import { Select } from '../../../components/AppSelect'
import { useAppWindowContainer } from '../../../contexts/AppWindowContext'
import type { Branch } from '../../../types/branch'
import type { UserAccount } from '../../../types/user'
import { MOCK_USER_ACCOUNTS } from '../../../constants/mockUsers'
import { ROLE_LABELS } from '../../../constants/roles'

interface Props {
  open: boolean
  branch: Branch
  onClose: () => void
  onAssigned: (account: UserAccount) => void
}

interface FormValues {
  userId: string
}

// Only Branch Manager/Staff carry a `branch` field at all (same
// BRANCH_ROLES set as CreateUserModal/EditUserModal) — assigning here just
// sets it to this branch's name, which is also how someone gets
// *un*-assigned from wherever they were before (a user only ever has one
// branch at a time, so picking a new one here replaces the old one — no
// separate "unassign" action needed).
const BRANCH_ROLES: UserAccount['role'][] = ['branch_manager', 'staff']

export function AssignUserModal({ open, branch, onClose, onAssigned }: Props) {
  const [form] = Form.useForm<FormValues>()
  const appWindow = useAppWindowContainer()

  // Same merchant, a role that actually carries a branch, not already
  // assigned here, and not suspended — assigning a suspended account to a
  // branch isn't a real action anyone would take.
  const candidates = MOCK_USER_ACCOUNTS.filter(u =>
    u.merchantId === branch.merchantId &&
    BRANCH_ROLES.includes(u.role) &&
    u.branch !== branch.name &&
    u.status !== 'suspended',
  )
  const userOptions = candidates.map(u => ({
    value: u.id,
    label: `${u.name} — ${ROLE_LABELS[u.role]}${u.branch ? ` (currently ${u.branch})` : ''}`,
  }))

  function handleSubmit(values: FormValues) {
    const account = candidates.find(u => u.id === values.userId)
    if (!account) return
    account.branch = branch.name
    form.resetFields()
    onAssigned(account)
  }

  return (
    <Drawer
      open={open}
      title="Assign user"
      onClose={onClose}
      destroyOnHidden
      width={420}
      getContainer={appWindow ?? undefined}
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={() => form.submit()}>Assign</Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
        <Form.Item label="User" name="userId" rules={[{ required: true, message: 'Required' }]}>
          <Select placeholder="Select a Branch Manager or Staff member" options={userOptions} />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
