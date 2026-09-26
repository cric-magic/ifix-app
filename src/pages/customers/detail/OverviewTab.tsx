import { Button, theme } from 'antd'
import { Pencil, ShieldAlert, ShieldCheck } from 'lucide-react'
import type { Customer } from '../../../types/customer'
import { DotTag } from '../../../components/DotTag'
import { DetailDescriptions } from '../../../components/DetailDescriptions'
import { DetailHeader } from '../../../components/DetailHeader'

interface Props {
  customer: Customer
  canEdit: boolean
  canToggleBlacklist: boolean
  onEdit: () => void
  // Asks for confirmation itself (CustomerDetailPage) — the mobile action
  // bar calls the same thing.
  onToggleBlacklist: () => void
}

// Customers have no photo, so there's no thumbnail in the header. On mobile
// the actions move to the page's bottom bar (see CustomerDetailPage).
export function OverviewTab({ customer, canEdit, canToggleBlacklist, onEdit, onToggleBlacklist }: Props) {
  const { token } = theme.useToken()

  return (
    <div style={{ marginBottom: 24 }}>
      <DetailHeader
        title={customer.fullName}
        tags={customer.blacklisted
          ? <DotTag dotColor={token.colorError}>Blacklisted</DotTag>
          : <DotTag dotColor={token.colorSuccess}>Good Standing</DotTag>}
        actions={(canToggleBlacklist || canEdit) && (
          <>
            {canToggleBlacklist && (
              <Button
                danger={!customer.blacklisted}
                icon={customer.blacklisted ? <ShieldCheck size={16} strokeWidth={2.25} /> : <ShieldAlert size={16} strokeWidth={2.25} />}
                onClick={onToggleBlacklist}
              >
                {customer.blacklisted ? 'Remove from Blacklist' : 'Blacklist'}
              </Button>
            )}
            {canEdit && (
              <Button icon={<Pencil size={16} strokeWidth={2.25} />} onClick={onEdit}>Edit</Button>
            )}
          </>
        )}
      />

      <DetailDescriptions
        items={[
          { key: 'nationalId', label: 'National ID / Passport', children: customer.nationalId },
          { key: 'phone', label: 'Phone', children: customer.phone },
          { key: 'dob', label: 'Date of Birth', children: customer.dateOfBirth },
          { key: 'email', label: 'Email', children: customer.email || <span style={{ color: token.colorTextDisabled }}>—</span> },
          { key: 'idCardAddress', label: "ID Card's Address", children: customer.idCardAddress, span: 2, className: 'ifix-descriptions-stacked' },
          { key: 'currentAddress', label: 'Current Address', children: customer.currentAddress, span: 2, className: 'ifix-descriptions-stacked' },
          ...(customer.workplaceAddress ? [{ key: 'workplaceAddress', label: 'Workplace Address', children: customer.workplaceAddress, span: 2, className: 'ifix-descriptions-stacked' }] : []),
        ]}
      />
    </div>
  )
}
