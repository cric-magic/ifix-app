import { useState } from 'react'
import { Button, Table, Typography, message, theme } from 'antd'
import { UserPlus, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import type { Branch } from '../../../types/branch'
import type { UserAccount } from '../../../types/user'
import { MOCK_USER_ACCOUNTS } from '../../../constants/mockUsers'
import { ROLE_LABELS } from '../../../constants/roles'
import { UserStatusTag } from '../../users/components/UserStatusTag'
import { TableEmptyState } from '../../../components/TableEmptyState'
import { AssignUserModal } from './AssignUserModal'

interface Props {
  branch: Branch
  canManage: boolean
}

export function AssignedUsersTab({ branch, canManage }: Props) {
  const { token } = theme.useToken()
  const navigate = useNavigate()
  const [assignOpen, setAssignOpen] = useState(false)
  const [version, setVersion] = useState(0)
  void version

  const assigned = MOCK_USER_ACCOUNTS.filter(u => u.merchantId === branch.merchantId && u.branch === branch.name)

  function refresh() {
    setVersion(v => v + 1)
  }

  const columns: ColumnsType<UserAccount> = [
    {
      title: <span style={{ color: token.colorText }}>Name</span>,
      dataIndex: 'name',
      key: 'name',
      render: (name: string, u) => (
        <a onClick={() => navigate(`/settings/members/${u.id}`)} style={{ color: token.colorText }}>{name}</a>
      ),
    },
    {
      title: <span style={{ color: token.colorTextSecondary }}>Staff ID</span>,
      dataIndex: 'staffId',
      key: 'staffId',
      render: (staffId: string) => <span style={{ color: token.colorTextSecondary }}>{staffId}</span>,
    },
    {
      title: <span style={{ color: token.colorTextSecondary }}>Role</span>,
      key: 'role',
      render: (_, u) => <span style={{ color: token.colorTextSecondary }}>{ROLE_LABELS[u.role]}</span>,
    },
    {
      title: <span style={{ color: token.colorTextSecondary }}>Status</span>,
      key: 'status',
      render: (_, u) => <UserStatusTag status={u.status} />,
    },
  ]

  return (
    <div className="ifix-table-panel">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        paddingLeft: 16,
        paddingRight: canManage ? 8 : 16,
        boxShadow: `inset 0 -0.5px 0 0 ${token.colorBorderSecondary}`,
      }}>
        <Typography.Text strong style={{ fontSize: 15 }}>
          {assigned.length} Assigned User{assigned.length === 1 ? '' : 's'}
        </Typography.Text>
        {canManage && (
          // paddingRight: 2 on top of the header row's own 8px — matches
          // the button's own top/bottom centering gap (10px, the derived
          // (56 - 36) / 2 remainder from centering a 36px-tall button in
          // this 56px-tall row), so the button sits equidistant from all
          // three edges instead of closer to the right one.
          <div style={{ paddingRight: 2 }}>
            <Button icon={<UserPlus size={16} strokeWidth={2.25} />} onClick={() => setAssignOpen(true)}>
              Assign User
            </Button>
          </div>
        )}
      </div>

      <div style={{ padding: 16 }}>
        <div className="ifix-panel-table" style={{ margin: '0 -16px' }}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={assigned}
            size="small"
            pagination={false}
            locale={{
              emptyText: (
                <TableEmptyState
                  icon={<Users size={22} strokeWidth={2.25} />}
                  title="No staff assigned yet"
                  description={canManage ? 'Assign Branch Managers or Staff to this branch.' : 'Staff assigned to this branch will show up here.'}
                />
              ),
            }}
          />
        </div>
      </div>

      <AssignUserModal
        open={assignOpen}
        branch={branch}
        onClose={() => setAssignOpen(false)}
        onAssigned={account => {
          setAssignOpen(false)
          refresh()
          message.success(`${account.name} assigned to ${branch.name}`)
        }}
      />
    </div>
  )
}
