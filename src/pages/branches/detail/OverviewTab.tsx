import { App, Button, Typography } from 'antd'
import { Pencil, Archive, ArchiveRestore } from 'lucide-react'
import type { Branch } from '../../../types/branch'
import { DetailDescriptions } from '../../../components/DetailDescriptions'
import { BranchStatusTag } from '../components/BranchStatusTag'

interface Props {
  branch: Branch
  canEdit: boolean
  onEdit: () => void
  onToggleArchive: () => void
}

// Same page-header pattern as Products' OverviewTab: title/tags on the
// left, actions on the right, no card chrome (see that file for why —
// antd dropped PageHeader from core in v5+, so this reproduces its layout
// by hand). Branches have no photo, so there's no thumbnail here.
export function OverviewTab({ branch, canEdit, onEdit, onToggleArchive }: Props) {
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
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', rowGap: 8, alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Typography.Title level={4} style={{ margin: 0 }}>{branch.name}</Typography.Title>
          <BranchStatusTag status={branch.status} />
        </div>
        {canEdit && (
          <div style={{ display: 'flex', gap: 8 }}>
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

      <DetailDescriptions items={items} />
    </div>
  )
}
