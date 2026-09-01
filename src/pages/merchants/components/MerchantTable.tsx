import { App, Avatar, Button, ConfigProvider, Dropdown, Table, theme } from 'antd'
import { Ban, RotateCcw, ChevronDown, MoreHorizontal, Building2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import type { Merchant } from '../../../types/merchant'
import { MOCK_USER_ACCOUNTS } from '../../../constants/mockUsers'
import { MOCK_BRANCHES } from '../../../constants/mockBranches'
import { merchantUserCount, merchantBranchCount } from '../../../constants/roles'
import { getWorkspaceAvatarUrl } from '../../../utils/avatar'
import { MerchantStatusTag } from './MerchantStatusTag'
import { TableEmptyState } from '../../../components/TableEmptyState'

interface Props {
  merchants: Merchant[]
  search: string
  onToggleSuspend: (merchant: Merchant) => void
}

export function MerchantTable({ merchants, search, onToggleSuspend }: Props) {
  const { token } = theme.useToken()
  const { modal } = App.useApp()
  const navigate = useNavigate()

  const columns: ColumnsType<Merchant> = [
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
      render: (name: string, m) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar shape="square" src={m.logoUrl ?? getWorkspaceAvatarUrl(m.id)} size={28} style={{ flexShrink: 0 }} />
          <span style={{ color: token.colorText }}>{name}</span>
        </div>
      ),
    },
    { title: 'Legal Name', dataIndex: 'legalName', key: 'legalName' },
    { title: 'Branches', key: 'branches', align: 'right', render: (_, m) => merchantBranchCount(m.id, MOCK_BRANCHES) },
    { title: 'Users', key: 'users', align: 'right', render: (_, m) => merchantUserCount(m.id, MOCK_USER_ACCOUNTS) },
    { title: 'Status', key: 'status', fixed: 'right', render: (_, m) => <MerchantStatusTag status={m.status} /> },
    {
      title: '',
      key: 'actions',
      width: 56,
      fixed: 'right',
      align: 'right',
      render: (_, m) => {
        const isSuspended = m.status === 'suspended'
        return (
          <div onClick={e => e.stopPropagation()}>
            <Dropdown
              trigger={['click']}
              placement="bottomRight"
              menu={{
                items: [
                  {
                    key: 'suspend',
                    danger: !isSuspended,
                    icon: isSuspended ? <RotateCcw size={15} strokeWidth={2.25} /> : <Ban size={15} strokeWidth={2.25} />,
                    label: isSuspended ? 'Reactivate' : 'Suspend',
                  },
                ],
                onClick: ({ key }) => {
                  if (key === 'suspend') {
                    modal.confirm({
                      title: isSuspended ? 'Reactivate this merchant?' : 'Suspend this merchant?',
                      content: isSuspended ? undefined : 'This merchant loses access to the platform until reactivated.',
                      okText: isSuspended ? 'Reactivate' : 'Suspend',
                      okButtonProps: { danger: !isSuspended },
                      onOk: () => onToggleSuspend(m),
                    })
                  }
                },
              }}
            >
              <Button type="text" size="small" icon={<MoreHorizontal size={15} strokeWidth={2.25} />} />
            </Dropdown>
          </div>
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
              dataSource={merchants}
              scroll={{ x: 'max-content' }}
              onRow={record => ({
                onClick: () => navigate(`/merchants/${record.id}`),
                style: { cursor: 'pointer' },
              })}
              locale={{
                emptyText: search ? (
                  <TableEmptyState icon={<Building2 size={22} strokeWidth={2.25} />} title="No merchants found" description="Try a different name or legal name." />
                ) : (
                  <TableEmptyState icon={<Building2 size={22} strokeWidth={2.25} />} title="No merchants yet" description="Merchants you create will show up here." />
                ),
              }}
              pagination={{
                pageSize: 10,
                size: 'small',
                showSizeChanger: false,
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
