import { Button, Image, theme } from 'antd'
import { Pencil, Ban, RotateCcw } from 'lucide-react'
import type { Merchant } from '../../../types/merchant'
import { previewContractNumber } from '../../../constants/mockMerchants'
import { getWorkspaceAvatarUrl } from '../../../utils/avatar'
import { DetailDescriptions } from '../../../components/DetailDescriptions'
import { DetailHeader } from '../../../components/DetailHeader'
import { MerchantStatusTag } from '../components/MerchantStatusTag'

const CONTRACT_FORMAT_LABELS = {
  auto_running: 'Auto-running',
  random: 'Random (UUID)',
}

interface Props {
  merchant: Merchant
  canEdit: boolean
  onEdit: () => void
  // Only Super Admin can deactivate/reactivate a merchant — undefined here
  // means "not shown." Asks for confirmation itself (MerchantDetailPage) —
  // the mobile action bar calls the same thing.
  onToggleSuspend?: () => void
}

// The logo shrinks to the same 40px thumbnail as Product's photo, beside the
// name instead of a larger block to its left. On mobile the actions move to
// the page's bottom bar (see MerchantDetailPage).
export function OverviewTab({ merchant, canEdit, onEdit, onToggleSuspend }: Props) {
  const { token } = theme.useToken()
  const isSuspended = merchant.status === 'suspended'

  // Grouped so each two-column row holds one kind of thing — who (owner
  // and email), numbering (format and prefix) — with the company name above
  // and the long values below at full width; the same order at every width.
  // Owner and email are separate fields: together they wrapped on a phone.
  const items = [
    { key: 'legalName', label: 'Legal name', children: merchant.legalName, span: 2 },
    { key: 'owner', label: 'Owner', children: merchant.ownerName },
    { key: 'ownerEmail', label: 'Owner email', children: merchant.ownerEmail },
    { key: 'contractFormat', label: 'Contract format', children: CONTRACT_FORMAT_LABELS[merchant.contractFormat] },
    { key: 'contractPrefix', label: 'Contract prefix', children: merchant.contractPrefix },
    {
      key: 'nextContract',
      label: 'Next contract number',
      // Body font, like contract numbers everywhere else — the code font
      // set it visibly larger than the values around it.
      children: previewContractNumber(merchant),
      span: 2,
      // A random (UUID) number is ~40 characters: never fits beside its
      // label on a phone, so it stacks there like the address.
      ...(merchant.contractFormat === 'random' ? { className: 'ifix-descriptions-stacked' } : {}),
    },
    { key: 'address', label: 'Address', children: merchant.address, span: 2, className: 'ifix-descriptions-stacked' },
  ]

  return (
    <div style={{ marginBottom: 24 }}>
      <DetailHeader
        leading={(
          <Image
            src={merchant.logoUrl ?? getWorkspaceAvatarUrl(merchant.id)}
            alt={merchant.name}
            width={40}
            height={40}
            preview={!!merchant.logoUrl}
            style={{
              objectFit: 'cover',
              borderRadius: token.borderRadiusSM,
              border: `0.5px solid ${token.colorBorderSecondary}`,
              background: token.colorFillSecondary,
            }}
          />
        )}
        title={merchant.name}
        tags={<MerchantStatusTag status={merchant.status} />}
        actions={(onToggleSuspend || canEdit) && (
          <>
            {onToggleSuspend && (
              <Button
                danger={!isSuspended}
                icon={isSuspended ? <RotateCcw size={16} strokeWidth={2.25} /> : <Ban size={16} strokeWidth={2.25} />}
                onClick={onToggleSuspend}
              >
                {isSuspended ? 'Reactivate' : 'Suspend'}
              </Button>
            )}
            {canEdit && (
              <Button icon={<Pencil size={16} strokeWidth={2.25} />} onClick={onEdit}>Edit</Button>
            )}
          </>
        )}
      />

      <DetailDescriptions items={items} />
    </div>
  )
}
