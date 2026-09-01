import { App, Button, Descriptions, Image, Typography, theme } from 'antd'
import { Pencil, Ban, RotateCcw } from 'lucide-react'
import type { Merchant } from '../../../types/merchant'
import { previewContractNumber } from '../../../constants/mockMerchants'
import { getWorkspaceAvatarUrl } from '../../../utils/avatar'
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

  const items = [
    { key: 'legalName', label: 'Legal name', children: merchant.legalName, span: 2 },
    { key: 'address', label: 'Address', children: merchant.address, span: 2 },
    { key: 'owner', label: 'Owner', children: `${merchant.ownerName} (${merchant.ownerEmail})`, span: 2 },
    { key: 'contractFormat', label: 'Contract format', children: CONTRACT_FORMAT_LABELS[merchant.contractFormat] },
    { key: 'contractPrefix', label: 'Contract prefix', children: merchant.contractPrefix },
    {
      key: 'nextContract',
      label: 'Next contract number',
      children: <span style={{ fontFamily: token.fontFamilyCode }}>{previewContractNumber(merchant)}</span>,
      span: 2,
    },
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
        <Typography.Text strong style={{ fontSize: 15 }}>Merchant Details</Typography.Text>
        {/* paddingRight: 2 on top of the header row's own 8px — matches the
            buttons' own top/bottom centering gap (10px, the derived
            (56 - 36) / 2 remainder from centering a 36px-tall button in
            this 56px-tall row), so the button group sits equidistant from
            all three edges instead of closer to the right one. */}
        <div style={{ display: 'flex', gap: 8, paddingRight: 2 }}>
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

      <div style={{ display: 'flex', gap: 24, padding: 16 }}>
        <div style={{ width: 96, flexShrink: 0 }}>
          <Image
            src={merchant.logoUrl ?? getWorkspaceAvatarUrl(merchant.id)}
            alt={merchant.name}
            width={96}
            height={96}
            preview={!!merchant.logoUrl}
            style={{
              objectFit: 'cover',
              borderRadius: 8,
              border: `0.5px solid ${token.colorBorderSecondary}`,
              background: token.colorFillSecondary,
            }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Typography.Text strong style={{ fontSize: 20 }}>{merchant.name}</Typography.Text>
            <MerchantStatusTag status={merchant.status} />
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
    </div>
  )
}
