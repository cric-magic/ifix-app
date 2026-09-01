import { App, Button, ConfigProvider, Dropdown, Table, Typography, theme } from 'antd'
import { Archive, ArchiveRestore, ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal, Store } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import type { Branch } from '../../../types/branch'
import { MOCK_USER_ACCOUNTS } from '../../../constants/mockUsers'
import { BranchStatusTag } from './BranchStatusTag'
import { TableEmptyState } from '../../../components/TableEmptyState'

interface Props {
  branches: Branch[]
  search: string
  canManage: (branch: Branch) => boolean
  onToggleArchive: (branch: Branch) => void
  // When set, renders an internal panel header (title + this action node) —
  // the detail-view convention (Merchant Detail's BranchesTab, matching
  // UnitsTab's "N Units" + Add Unit pattern). Omitted on the standalone
  // list route (BranchesPage), which instead renders its filters/button in
  // their own row above a header-less panel, per the list-view convention —
  // see CLAUDE.md's "Panel header actions: list views vs. detail views."
  headerAction?: React.ReactNode
}

function staffCount(branch: Branch): number {
  return MOCK_USER_ACCOUNTS.filter(u => u.merchantId === branch.merchantId && u.branch === branch.name).length
}

export function BranchTable({ branches, search, canManage, onToggleArchive, headerAction }: Props) {
  const { token } = theme.useToken()
  const { modal } = App.useApp()
  const navigate = useNavigate()

  const columns: ColumnsType<Branch> = [
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
    { title: 'Branch Code', dataIndex: 'code', key: 'code' },
    { title: 'Staff', key: 'staff', align: 'right', render: (_, b) => staffCount(b) },
    { title: 'Status', key: 'status', fixed: 'right', render: (_, b) => <BranchStatusTag status={b.status} /> },
    {
      title: '',
      key: 'actions',
      width: 56,
      fixed: 'right',
      align: 'right',
      render: (_, b) => {
        if (!canManage(b)) return null
        const isArchived = b.status === 'archived'
        return (
          <div onClick={e => e.stopPropagation()}>
            <Dropdown
              trigger={['click']}
              placement="bottomRight"
              menu={{
                items: [
                  {
                    key: 'archive',
                    danger: !isArchived,
                    icon: isArchived ? <ArchiveRestore size={15} strokeWidth={2.25} /> : <Archive size={15} strokeWidth={2.25} />,
                    label: isArchived ? 'Unarchive' : 'Archive',
                  },
                ],
                onClick: ({ key }) => {
                  if (key === 'archive') {
                    modal.confirm({
                      title: isArchived ? 'Unarchive this branch?' : 'Archive this branch?',
                      content: isArchived ? undefined : 'All staff and branch managers at this branch will be suspended.',
                      okText: isArchived ? 'Unarchive' : 'Archive',
                      okButtonProps: { danger: !isArchived },
                      onOk: () => onToggleArchive(b),
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
        {headerAction !== undefined && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 56,
            paddingLeft: 16,
            paddingRight: 8,
            boxShadow: `inset 0 -0.5px 0 0 ${token.colorBorderSecondary}`,
          }}>
            <Typography.Text strong style={{ fontSize: 15 }}>
              {branches.length} Branch{branches.length === 1 ? '' : 'es'}
            </Typography.Text>
            {/* paddingRight: 2 on top of the header row's own 8px — matches
                the button's own top/bottom centering gap (10px, the derived
                (56 - 36) / 2 remainder from centering a 36px-tall button in
                this 56px-tall row), so the button sits equidistant from all
                three edges instead of closer to the right one. */}
            <div style={{ paddingRight: 2 }}>{headerAction}</div>
          </div>
        )}
        <div style={{ padding: 16 }}>
          <div className="ifix-panel-table" style={{ margin: '0 -16px' }}>
            <Table
              rowKey="id"
              columns={columns}
              dataSource={branches}
              // Only when there's real data to scroll through — an empty
              // table still computes a fixed-column width slightly wider
              // than the container (the shadow reserved for
              // .ant-table-cell-fix-start/-end), which otherwise triggers a
              // pointless horizontal scrollbar with nothing to scroll to.
              scroll={branches.length > 0 ? { x: 'max-content' } : undefined}
              onRow={record => ({
                onClick: () => navigate(`/branches/${record.id}`),
                style: { cursor: 'pointer' },
              })}
              locale={{
                emptyText: search ? (
                  <TableEmptyState icon={<Store size={22} strokeWidth={2.25} />} title="No branches found" description="Try a different name or branch code." />
                ) : (
                  <TableEmptyState icon={<Store size={22} strokeWidth={2.25} />} title="No branches yet" description="Branches you create will show up here." />
                ),
              }}
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
