import { App, ConfigProvider, Table, Button, Dropdown, theme } from 'antd'
import { Pencil, Ban, RotateCcw, KeyRound, ChevronLeft, ChevronRight, ChevronDown, MoreHorizontal } from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'
import type { AuthUser } from '../../../types/installment'
import type { UserAccount } from '../../../types/user'
import { ROLE_LABELS, canManageTargetUser } from '../../../constants/roles'
import { UserStatusTag } from './UserStatusTag'
import { mockCreatedContracts, mockMonthlyCollection } from '../mockStats'

const formatter = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 })

interface Props {
  actor: AuthUser
  accounts: UserAccount[]
  onEdit: (account: UserAccount) => void
  onToggleSuspend: (account: UserAccount) => void
  onForceReset: (account: UserAccount) => void
}

export function UserTable({ actor, accounts, onEdit, onToggleSuspend, onForceReset }: Props) {
  const { token } = theme.useToken()
  const { modal } = App.useApp()

  const columns: ColumnsType<UserAccount> = [
    {
      title: <span style={{ color: token.colorText }}>Name</span>,
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      sorter: (a, b) => a.name.localeCompare(b.name),
      showSorterTooltip: false,
      sortIcon: ({ sortOrder }) => (
        <ChevronDown
          size={13}
          strokeWidth={2.25}
          style={{
            transform: sortOrder === 'ascend' ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            color: sortOrder ? token.colorText : token.colorTextQuaternary,
          }}
        />
      ),
      render: (name: string) => <span style={{ color: token.colorText }}>{name}</span>,
    },
    { title: 'Staff ID', dataIndex: 'staffId', key: 'staffId' },
    { title: 'Role', key: 'role', render: (_, r) => ROLE_LABELS[r.role] },
    { title: 'Branch', key: 'branch', render: (_, r) => r.branch ?? <span style={{ color: token.colorTextDisabled }}>—</span> },
    { title: 'Status', key: 'status', fixed: 'right', render: (_, r) => <UserStatusTag status={r.status} /> },
    {
      title: 'Created Contracts',
      key: 'createdContracts',
      align: 'right',
      render: (_, r) => mockCreatedContracts(r.id),
    },
    {
      title: 'MTD Collection',
      key: 'mtdCollection',
      align: 'right',
      render: (_, r) => formatter.format(mockMonthlyCollection(r.id)),
    },
    {
      title: '',
      key: 'actions',
      width: 56,
      fixed: 'right',
      align: 'right',
      render: (_, r) => {
        if (!canManageTargetUser(actor, r)) return null
        const isSuspended = r.status === 'suspended'
        return (
          <Dropdown
            trigger={['click']}
            placement="bottomRight"
            menu={{
              items: [
                { key: 'edit', icon: <Pencil size={15} strokeWidth={2.25} />, label: 'Edit' },
                { key: 'reset', icon: <KeyRound size={15} strokeWidth={2.25} />, label: 'Reset password' },
                { type: 'divider' },
                {
                  key: 'suspend',
                  danger: !isSuspended,
                  icon: isSuspended ? <RotateCcw size={15} strokeWidth={2.25} /> : <Ban size={15} strokeWidth={2.25} />,
                  label: isSuspended ? 'Reactivate' : 'Suspend',
                },
              ],
              onClick: ({ key }) => {
                if (key === 'edit') onEdit(r)
                if (key === 'reset') onForceReset(r)
                if (key === 'suspend') {
                  modal.confirm({
                    title: isSuspended ? 'Reactivate this user?' : 'Suspend this user?',
                    okText: isSuspended ? 'Reactivate' : 'Suspend',
                    okButtonProps: { danger: !isSuspended },
                    onOk: () => onToggleSuspend(r),
                  })
                }
              },
            }}
          >
            <Button type="text" size="small" icon={<MoreHorizontal size={15} strokeWidth={2.25} />} />
          </Dropdown>
        )
      },
    },
  ]

  return (
    <ConfigProvider theme={{
      components: {
        Table: {
          colorText: token.colorTextTertiary,
          headerColor: token.colorTextTertiary,
        },
      },
    }}>
      <div className="ifix-table-panel">
        <div style={{ padding: 16 }}>
          <div className="ifix-panel-table" style={{ margin: '0 -16px' }}>
            <Table
              rowKey="id"
              columns={columns}
              dataSource={accounts}
              scroll={{ x: 'max-content' }}
              pagination={{
                pageSize: 10,
                size: 'small',
                showSizeChanger: false,
                prevIcon: <ChevronLeft size={14} strokeWidth={2.25} />,
                nextIcon: <ChevronRight size={14} strokeWidth={2.25} />,
                showTotal: (total, range) => (
                  <span style={{ color: token.colorTextTertiary }}>
                    {range[0]}–{range[1]} of {total}
                  </span>
                ),
              }}
            />
          </div>
        </div>
      </div>
    </ConfigProvider>
  )
}
