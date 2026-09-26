import { useState } from 'react'
import { Alert, message } from 'antd'
import { useCurrentUser } from '../../contexts/AuthContext'
import { MOCK_MERCHANTS } from '../../constants/mockMerchants'
import { MOCK_CONTRACT_TEMPLATES, createStarterTemplates } from '../../constants/mockContractTemplates'
import { canViewMerchantList, canManageMerchants } from '../../constants/roles'
import type { Merchant } from '../../types/merchant'
import { MerchantTable } from './components/MerchantTable'
import { CreateMerchantModal } from './components/CreateMerchantModal'
import { ListToolbar } from '../../components/ListToolbar'
import { ListSearch } from '../../components/ListSearch'

export function MerchantsPage() {
  const user = useCurrentUser()
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
    <div className="ifix-fill-page">
      <ListToolbar
        search={<ListSearch value={search} onChange={setSearch} placeholder="Search by name or legal name" mobilePlaceholder="Search merchants" />}
        action={canManageMerchants(user) ? { label: 'Create Merchant', onClick: () => setCreateOpen(true) } : undefined}
      />

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
          // Per the Contract Template doc, creating a merchant also
          // provisions their two default templates (Fixed Rate + Free Rate)
          // so their first contract has something to select.
          MOCK_CONTRACT_TEMPLATES.push(...createStarterTemplates(merchant.id, user.id))
          refresh()
          message.success(`${merchant.name} created`)
        }}
      />
    </div>
  )
}
