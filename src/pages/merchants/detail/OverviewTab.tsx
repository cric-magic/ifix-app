import { App, Button, Image, Typography, theme } from 'antd'
import { Pencil, Ban, RotateCcw } from 'lucide-react'
import type { Merchant } from '../../../types/merchant'
import { previewContractNumber } from '../../../constants/mockMerchants'
import { getWorkspaceAvatarUrl } from '../../../utils/avatar'
import { DetailDescriptions } from '../../../components/DetailDescriptions'
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
  // means "not shown," used for the Workspace Settings > General context
  // where a Merchant Owner edits their own merchant but never suspends it.
  onToggleSuspend?: () => void
}

// Same page-header pattern as Products' OverviewTab: title/tags on the
// left, actions on the right, no card chrome — see that file for why (antd
// dropped PageHeader from core in v5+, so this reproduces its layout by
// hand). The logo shrinks to the same 40px thumbnail as Product's photo,
// beside the name instead of a larger block to its left.
export function OverviewTab({ merchant, canEdit, onEdit, onToggleSuspend }: Props) {
  const { token } = theme.useToken()
  const { modal } = App.useApp()
  const isSuspended = merchant.status === 'suspended'

  function handleToggleSuspendClick() {
    if (!onToggleSuspend) return
    modal.confirm({
      title: isSuspended ? 'Reactivate this merchant?' : 'Suspend this merchant?',
      content: isSuspended ? undefined : 'This merchant loses access to the platform until reactivated.',
      okText: isSuspended ? 'Reactivate' : 'Suspend',
      okButtonProps: { danger: !isSuspended },
      onOk: onToggleSuspend,
    })
  }

  // Only `address` spans both columns — a full street address is the one
  // value here long enough to justify it. legalName/owner/nextContract
  // used to span 2 as well, back when this panel was a narrower flex
  // layout next to a larger logo image; now that it runs the full page
  // width (see the page-header rewrite), forcing those short, single-line
  // values full-width just left them stranded alone on a row while
  // shorter fields like Contract format/prefix paired up normally.
  const items = [
    { key: 'legalName', label: 'Legal name', children: merchant.legalName },
    { key: 'address', label: 'Address', children: merchant.address, span: 2 },
    { key: 'owner', label: 'Owner', children: `${merchant.ownerName} (${merchant.ownerEmail})` },
    { key: 'contractFormat', label: 'Contract format', children: CONTRACT_FORMAT_LABELS[merchant.contractFormat] },
    { key: 'contractPrefix', label: 'Contract prefix', children: merchant.contractPrefix },
    {
      key: 'nextContract',
      label: 'Next contract number',
      children: <span style={{ fontFamily: token.fontFamilyCode }}>{previewContractNumber(merchant)}</span>,
    },
  ]

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', rowGap: 8, alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', rowGap: 8, alignItems: 'center', gap: 12 }}>
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
          <Typography.Title level={4} style={{ margin: 0 }}>{merchant.name}</Typography.Title>
          <MerchantStatusTag status={merchant.status} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {onToggleSuspend && (
            <Button
              icon={isSuspended ? <RotateCcw size={16} strokeWidth={2.25} /> : <Ban size={16} strokeWidth={2.25} />}
              onClick={handleToggleSuspendClick}
            >
              {isSuspended ? 'Reactivate' : 'Suspend'}
            </Button>
          )}
          {canEdit && (
            <Button icon={<Pencil size={16} strokeWidth={2.25} />} onClick={onEdit}>Edit</Button>
          )}
        </div>
      </div>

      <DetailDescriptions items={items} />
    </div>
  )
}
