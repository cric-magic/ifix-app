import { useState } from 'react'
import { Button, Typography, message, theme } from 'antd'
import { Pencil } from 'lucide-react'
import { useCurrentUser } from '../../contexts/AuthContext'
import { useDevTools } from '../../contexts/DevToolsContext'
import { MOCK_MERCHANTS, previewContractNumber } from '../../constants/mockMerchants'
import { canEditMerchant } from '../../constants/roles'
import { MerchantStatusTag } from '../merchants/components/MerchantStatusTag'
import { EditMerchantModal } from '../merchants/components/EditMerchantModal'
import { SettingsCard, SettingsRow } from '../../components/SettingsCard'
import { getWorkspaceAvatarUrl } from '../../utils/avatar'
import ifixLogoDark from '../../assets/logo.png'
import ifixLogoLight from '../../assets/logo-light.png'

const CONTRACT_FORMAT_LABELS = {
  auto_running: 'Auto-running',
  random: 'Random (UUID)',
}

// The merchant-scoped counterpart to AccountGeneralPage (a user's own
// account) — a Merchant Owner/Admin/Branch Manager/Staff viewing their own
// workspace's merchant record. Deliberately laid out like that page
// (avatar + name header, then SettingsCard/SettingsRow sections) rather
// than reusing MerchantDetailPage's OverviewTab — this is a *settings*
// page about your own workspace, not a cross-merchant browsing view, so
// it should read like the other settings pages (Account, and this same
// page's own Platform fallback below), not like a detail-page panel. Bank
// accounts live on their own tab (WorkspaceBankAccountsPage) — see that
// file's header comment for why.
export function WorkspaceAccountPage() {
  const { token } = theme.useToken()
  const { themeVariant } = useDevTools()
  const actor = useCurrentUser()
  const [editOpen, setEditOpen] = useState(false)
  const [version, setVersion] = useState(0)
  void version

  // Two real logo files exist — a light mark for dark surfaces, a dark
  // mark for the Light theme's white surfaces — same pairing AppLayout's
  // sidebar identity uses, so this placeholder matches it in every theme.
  const ifixLogo = themeVariant === 'light' ? ifixLogoLight : ifixLogoDark

  // Super Admin has no merchantId — "their" workspace is the platform
  // itself (see AppLayout's sidebar identity), not a Merchant record, so
  // none of the merchant-shaped fields below apply here. Rather than
  // blocking the page outright, show the same header + SettingsCard shell
  // used below, sized to what's actually real today (just the platform
  // name) — ready to grow as platform-level settings get defined, instead
  // of a dead end.
  if (!actor.merchantId) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <img
            src={ifixLogo}
            alt=""
            style={{ width: 48, height: 48, borderRadius: 8, background: token.colorFillSecondary, flexShrink: 0, objectFit: 'cover' }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Typography.Text strong style={{ fontSize: 18, display: 'block' }} ellipsis>
              IFix
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>Platform</Typography.Text>
          </div>
        </div>

        <SettingsCard title="Platform">
          <SettingsRow label="Name">IFix</SettingsRow>
        </SettingsCard>
      </div>
    )
  }

  const merchant = MOCK_MERCHANTS.find(m => m.id === actor.merchantId)
  if (!merchant) return null

  const canEdit = canEditMerchant(actor, merchant)

  function refresh() {
    setVersion(v => v + 1)
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <img
          src={merchant.logoUrl ?? getWorkspaceAvatarUrl(merchant.id)}
          alt=""
          style={{ width: 48, height: 48, borderRadius: 8, background: token.colorFillSecondary, flexShrink: 0, objectFit: 'cover' }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Typography.Text strong style={{ fontSize: 18, display: 'block' }} ellipsis>
            {merchant.name}
          </Typography.Text>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>{merchant.legalName}</Typography.Text>
            <MerchantStatusTag status={merchant.status} />
          </div>
        </div>
        {canEdit && (
          <Button icon={<Pencil size={16} strokeWidth={2.25} />} onClick={() => setEditOpen(true)}>Edit</Button>
        )}
      </div>

      <SettingsCard title="Company">
        <SettingsRow label="Legal name">{merchant.legalName}</SettingsRow>
        <SettingsRow label="Address">{merchant.address}</SettingsRow>
        <SettingsRow label="Owner">{merchant.ownerName} ({merchant.ownerEmail})</SettingsRow>
      </SettingsCard>

      <SettingsCard title="Contract">
        <SettingsRow label="Format">{CONTRACT_FORMAT_LABELS[merchant.contractFormat]}</SettingsRow>
        <SettingsRow label="Prefix">{merchant.contractPrefix}</SettingsRow>
        <SettingsRow label="Next contract number">
          <span style={{ fontFamily: token.fontFamilyCode }}>{previewContractNumber(merchant)}</span>
        </SettingsRow>
      </SettingsCard>

      <EditMerchantModal
        open={editOpen}
        merchant={merchant}
        onClose={() => setEditOpen(false)}
        onUpdated={() => {
          setEditOpen(false)
          refresh()
          message.success('Workspace updated')
        }}
      />
    </div>
  )
}
