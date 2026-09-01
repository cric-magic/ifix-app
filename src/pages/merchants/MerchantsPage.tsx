import { useState } from 'react'
import { Alert, Button, Input, message } from 'antd'
import { Plus, Search } from 'lucide-react'
import { useCurrentUser } from '../../contexts/AuthContext'
import { useIconColors } from '../../constants/iconColors'
import { MOCK_MERCHANTS } from '../../constants/mockMerchants'
import { canViewMerchantList, canManageMerchants } from '../../constants/roles'
import type { Merchant } from '../../types/merchant'
import { MerchantTable } from './components/MerchantTable'
import { CreateMerchantModal } from './components/CreateMerchantModal'

export function MerchantsPage() {
  const user = useCurrentUser()
  const iconColors = useIconColors()
  const [version, setVersion] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [search, setSearch] = useState('')

  if (!canViewMerchantList(user)) {
    return (
      <Alert
        type="error"
        message="Access Denied"
        description="Merchants is only accessible to Super Admin."
        showIcon
      />
    )
  }

  const query = search.trim().toLowerCase()
  const merchants = query
    ? MOCK_MERCHANTS.filter(m =>
        m.name.toLowerCase().includes(query) ||
        m.legalName.toLowerCase().includes(query),
      )
    : MOCK_MERCHANTS
  void version // trigger re-render on mutation

  function refresh() {
    setVersion(v => v + 1)
  }

  function handleToggleSuspend(merchant: Merchant) {
    if (merchant.status === 'suspended') {
      merchant.status = 'active'
      merchant.suspendedBy = null
      merchant.suspendedAt = null
      message.success(`${merchant.name} reactivated`)
    } else {
      merchant.status = 'suspended'
      merchant.suspendedBy = user.id
      merchant.suspendedAt = new Date().toISOString()
      message.success(`${merchant.name} suspended`)
    }
    refresh()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 8 }}>
        <Input
          placeholder="Search by name or legal name"
          prefix={<Search size={15} strokeWidth={2.25} color={iconColors.secondary} />}
          allowClear
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        {canManageMerchants(user) && (
          <Button type="primary" icon={<Plus size={15} strokeWidth={2.25} />} onClick={() => setCreateOpen(true)}>
            Create Merchant
          </Button>
        )}
      </div>

      <MerchantTable
        merchants={merchants}
        search={search}
        onToggleSuspend={handleToggleSuspend}
      />

      <CreateMerchantModal
        open={createOpen}
        actor={user}
        onClose={() => setCreateOpen(false)}
        onCreated={merchant => {
          setCreateOpen(false)
          MOCK_MERCHANTS.push(merchant)
          refresh()
          message.success(`${merchant.name} created`)
        }}
      />
    </div>
  )
}
