import { App, Avatar, Button, ConfigProvider, Dropdown, Table, theme } from 'antd'
import { Ban, RotateCcw, ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal, Building2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import type { Merchant } from '../../../types/merchant'
import { MOCK_USER_ACCOUNTS } from '../../../constants/mockUsers'
import { MOCK_BRANCHES } from '../../../constants/mockBranches'
import { merchantUserCount, merchantBranchCount } from '../../../constants/roles'
import { getWorkspaceAvatarUrl } from '../../../utils/avatar'
import { MerchantStatusTag } from './MerchantStatusTag'
import { TableEmptyState } from '../../../components/TableEmptyState'
import { JUMP_PREV_ICON, JUMP_NEXT_ICON, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, PAGE_SIZE_CHANGER, MOBILE_PAGINATION } from '../../../constants/paginationIcons'
import { useIsMobile } from '../../../components/useIsMobile'
import { MobileTableRow } from '../../../components/MobileTableRow'
import { MOBILE_TABLE_PROPS, mobileColumns, tablePanelPadding } from '../../../components/mobileTable'
import { useActionSheet } from '../../../components/useActionSheet'
import { rowActionMenu, type RowAction } from '../../../components/rowActions'

interface Props {
  merchants: Merchant[]
  search: string
  onToggleSuspend: (merchant: Merchant) => void
}

export function MerchantTable({ merchants, search, onToggleSuspend }: Props) {
  const { token } = theme.useToken()
  const actionSheet = useActionSheet()
  const isMobile = useIsMobile()
  const { modal } = App.useApp()
  const navigate = useNavigate()

  // A row's actions — the desktop "…" menu and the mobile action sheet
  // (its "…", on every row with actions, at every size).
  function rowActions(m: Merchant): RowAction[] {
    const isSuspended = m.status === 'suspended'
    return [{
      key: 'suspend',
      danger: !isSuspended,
      icon: isSuspended ? <RotateCcw size={16} strokeWidth={2.25} /> : <Ban size={16} strokeWidth={2.25} />,
      label: isSuspended ? 'Reactivate' : 'Suspend',
      onClick: () => modal.confirm({
        title: isSuspended ? 'Reactivate this merchant?' : 'Suspend this merchant?',
        content: isSuspended ? undefined : 'This merchant loses access to the platform until reactivated.',
        okText: isSuspended ? 'Reactivate' : 'Suspend',
        okButtonProps: { danger: !isSuspended },
        onOk: () => onToggleSuspend(m),
      }),
    }]
  }

  function actionsMenu(m: Merchant) {
    const actions = rowActions(m)
    if (actions.length === 0) return null
    return (
      <div onClick={e => e.stopPropagation()}>
        <Dropdown trigger={['click']} placement="bottomRight" menu={rowActionMenu(actions)}>
          <Button type="text" size="small" icon={<MoreHorizontal size={16} strokeWidth={2.25} />} />
        </Dropdown>
      </div>
    )
  }

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
      render: (_, m) => actionsMenu(m),
    },
  ]

  // Mobile: logo, name and status on top; legal name below, with branch
  // and user counts.
  const mobileRows = mobileColumns<Merchant>(m => (
    <MobileTableRow
      leading={<Avatar shape="square" src={m.logoUrl ?? getWorkspaceAvatarUrl(m.id)} size={44} />}
      primary={m.name}
      trailing={<MerchantStatusTag status={m.status} />}
      secondary={m.legalName}
      trailingSecondary={`${merchantBranchCount(m.id, MOCK_BRANCHES)} branches · ${merchantUserCount(m.id, MOCK_USER_ACCOUNTS)} users`}
      onMore={rowActions(m).length ? () => actionSheet.open(m.name, rowActions(m)) : undefined}
    />
  ))

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
        <div style={{ padding: tablePanelPadding(isMobile) }}>
          <div className="ifix-panel-table" style={{ margin: '0 -16px' }}>
            <Table
              rowKey="id"
              columns={isMobile ? mobileRows : columns}
              {...(isMobile ? MOBILE_TABLE_PROPS : {})}
              dataSource={merchants}
              scroll={(isMobile ? { y: '100%' } : { x: 'max-content', y: '100%' })}
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
                defaultPageSize: DEFAULT_PAGE_SIZE,
                size: 'small',
                showSizeChanger: PAGE_SIZE_CHANGER,
                pageSizeOptions: PAGE_SIZE_OPTIONS,
                prevIcon: <ChevronLeft size={14} strokeWidth={2.25} />,
                nextIcon: <ChevronRight size={14} strokeWidth={2.25} />,
                jumpPrevIcon: JUMP_PREV_ICON,
                jumpNextIcon: JUMP_NEXT_ICON,
                showTotal: (total, range) => (
                  <span style={{ color: token.colorTextTertiary }}>
                    {range[0]}–{range[1]} of {total}
                  </span>
                ),
                ...(isMobile ? MOBILE_PAGINATION : {}),
              }}
            />
          </div>
        </div>
      </div>
      {actionSheet.sheet}
    </ConfigProvider>
  )
}
