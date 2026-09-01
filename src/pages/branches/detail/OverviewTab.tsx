import { App, Button, Descriptions, Typography, theme } from 'antd'
import { Pencil, Archive, ArchiveRestore } from 'lucide-react'
import type { Branch } from '../../../types/branch'
import { BranchStatusTag } from '../components/BranchStatusTag'

interface Props {
  branch: Branch
  canEdit: boolean
  onEdit: () => void
  onToggleArchive: () => void
}

export function OverviewTab({ branch, canEdit, onEdit, onToggleArchive }: Props) {
  const { token } = theme.useToken()
  const { modal } = App.useApp()
  const isArchived = branch.status === 'archived'

  function handleToggleArchiveClick() {
    modal.confirm({
      title: isArchived ? 'Unarchive this branch?' : 'Archive this branch?',
      content: isArchived ? undefined : 'All staff and branch managers at this branch will be suspended.',
      okText: isArchived ? 'Unarchive' : 'Archive',
      okButtonProps: { danger: !isArchived },
      onOk: onToggleArchive,
    })
  }

  const items = [
    { key: 'address', label: 'Address', children: branch.address, span: 2 },
    { key: 'phone', label: 'Phone number', children: branch.phone },
    { key: 'code', label: 'Branch code', children: branch.code },
    { key: 'taxId', label: 'Tax ID', children: branch.taxId },
    { key: 'taxBranchCode', label: 'Tax branch code', children: branch.taxBranchCode },
  ]

  return (
    <div className="ifix-table-panel" style={{ marginBottom: 16 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        paddingLeft: 16,
        paddingRight: 8,
        boxShadow: `inset 0 -0.5px 0 0 ${token.colorBorderSecondary}`,
      }}>
        <Typography.Text strong style={{ fontSize: 15 }}>Branch Details</Typography.Text>
        {canEdit && (
          // paddingRight: 2 on top of the header row's own 8px — matches
          // the buttons' own top/bottom centering gap (10px, the derived
          // (56 - 36) / 2 remainder from centering a 36px-tall button in
          // this 56px-tall row), so the button group sits equidistant from
          // all three edges instead of closer to the right one.
          <div style={{ display: 'flex', gap: 8, paddingRight: 2 }}>
            <Button
              icon={isArchived ? <ArchiveRestore size={16} strokeWidth={2.25} /> : <Archive size={16} strokeWidth={2.25} />}
              onClick={handleToggleArchiveClick}
            >
              {isArchived ? 'Unarchive' : 'Archive'}
            </Button>
            <Button icon={<Pencil size={16} strokeWidth={2.25} />} onClick={onEdit}>Edit</Button>
          </div>
        )}
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Typography.Text strong style={{ fontSize: 20 }}>{branch.name}</Typography.Text>
          <BranchStatusTag status={branch.status} />
        </div>
        <Descriptions
          column={2}
          bordered={false}
          layout="horizontal"
          items={items}
          labelStyle={{ fontSize: 14 }}
          contentStyle={{ fontSize: 14 }}
        />
      </div>
    </div>
  )
}
