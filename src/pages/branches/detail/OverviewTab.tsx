import { Button } from 'antd'
import { Pencil, Archive, ArchiveRestore } from 'lucide-react'
import type { Branch } from '../../../types/branch'
import { DetailDescriptions } from '../../../components/DetailDescriptions'
import { DetailHeader } from '../../../components/DetailHeader'
import { BranchStatusTag } from '../components/BranchStatusTag'

interface Props {
  branch: Branch
  canEdit: boolean
  onEdit: () => void
  // Asks for confirmation itself (BranchDetailPage) — the mobile action bar
  // calls the same thing.
  onToggleArchive: () => void
}

// Branches have no photo, so there's no thumbnail in the header. On mobile
// the actions move to the page's bottom bar (see BranchDetailPage).
export function OverviewTab({ branch, canEdit, onEdit, onToggleArchive }: Props) {
  const isArchived = branch.status === 'archived'

  // Short facts first, the address (full width; stacked on mobile) last —
  // the same order at every width.
  const items = [
    { key: 'phone', label: 'Phone number', children: branch.phone },
    { key: 'code', label: 'Branch code', children: branch.code },
    { key: 'taxId', label: 'Tax ID', children: branch.taxId },
    { key: 'taxBranchCode', label: 'Tax branch code', children: branch.taxBranchCode },
    { key: 'address', label: 'Address', children: branch.address, span: 2, className: 'ifix-descriptions-stacked' },
  ]

  return (
    <div style={{ marginBottom: 24 }}>
      <DetailHeader
        title={branch.name}
        tags={<BranchStatusTag status={branch.status} />}
        actions={canEdit && (
          <>
            <Button
              icon={isArchived ? <ArchiveRestore size={16} strokeWidth={2.25} /> : <Archive size={16} strokeWidth={2.25} />}
              onClick={onToggleArchive}
            >
              {isArchived ? 'Unarchive' : 'Archive'}
            </Button>
            <Button icon={<Pencil size={16} strokeWidth={2.25} />} onClick={onEdit}>Edit</Button>
          </>
        )}
      />

      <DetailDescriptions items={items} />
    </div>
  )
}
