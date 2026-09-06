import { App, Button, Typography, theme } from 'antd'
import { Pencil, ShieldAlert, ShieldCheck } from 'lucide-react'
import type { Customer } from '../../../types/customer'
import { DotTag } from '../../../components/DotTag'
import { DetailDescriptions } from '../../../components/DetailDescriptions'
import { canManageCustomerBlacklist } from '../../../constants/roles'
import { useCurrentUser } from '../../../contexts/AuthContext'

interface Props {
  customer: Customer
  canEdit: boolean
  onEdit: () => void
  onChanged: () => void
}

// Same page-header pattern as Products' OverviewTab: title/tags on the
// left, actions on the right, no card chrome (see that file for why —
// antd dropped PageHeader from core in v5+, so this reproduces its layout
// by hand). Customers have no photo, so there's no thumbnail here.
export function OverviewTab({ customer, canEdit, onEdit, onChanged }: Props) {
  const { token } = theme.useToken()
  const { modal, message } = App.useApp()
  const actor = useCurrentUser()
  const canToggleBlacklist = canManageCustomerBlacklist(actor)

  function handleToggleBlacklist() {
    const willBlacklist = !customer.blacklisted
    modal.confirm({
      title: willBlacklist ? 'Blacklist this customer?' : 'Remove from blacklist?',
      content: willBlacklist
        ? 'New contracts for this customer will require approval and show a warning to whoever creates them.'
        : undefined,
      okText: willBlacklist ? 'Blacklist' : 'Remove',
      okButtonProps: { danger: willBlacklist },
      onOk: () => {
        customer.blacklisted = willBlacklist
        onChanged()
        message.success(willBlacklist ? `${customer.fullName} blacklisted` : `${customer.fullName} removed from blacklist`)
      },
    })
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', rowGap: 8, alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Typography.Title level={4} style={{ margin: 0 }}>{customer.fullName}</Typography.Title>
          {customer.blacklisted
            ? <DotTag dotColor={token.colorError}>Blacklisted</DotTag>
            : <DotTag dotColor={token.colorSuccess}>Good Standing</DotTag>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {canToggleBlacklist && (
            <Button
              danger={!customer.blacklisted}
              icon={customer.blacklisted ? <ShieldCheck size={16} strokeWidth={2.25} /> : <ShieldAlert size={16} strokeWidth={2.25} />}
              onClick={handleToggleBlacklist}
            >
              {customer.blacklisted ? 'Remove from Blacklist' : 'Blacklist'}
            </Button>
          )}
          {canEdit && (
            <Button icon={<Pencil size={16} strokeWidth={2.25} />} onClick={onEdit}>Edit</Button>
          )}
        </div>
      </div>

      <DetailDescriptions
        items={[
          { key: 'nationalId', label: 'National ID / Passport', children: customer.nationalId },
          { key: 'phone', label: 'Phone', children: customer.phone },
          { key: 'dob', label: 'Date of Birth', children: customer.dateOfBirth },
          { key: 'email', label: 'Email', children: customer.email || <span style={{ color: token.colorTextDisabled }}>—</span> },
          { key: 'idCardAddress', label: "ID Card's Address", children: customer.idCardAddress, span: 2 },
          { key: 'currentAddress', label: 'Current Address', children: customer.currentAddress, span: 2 },
          ...(customer.workplaceAddress ? [{ key: 'workplaceAddress', label: 'Workplace Address', children: customer.workplaceAddress, span: 2 }] : []),
        ]}
      />
    </div>
  )
}
