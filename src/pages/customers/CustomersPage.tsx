import { useState } from 'react'
import { Alert, message } from 'antd'
import { useCurrentUser } from '../../contexts/AuthContext'
import { ListToolbar } from '../../components/ListToolbar'
import { ListSearch } from '../../components/ListSearch'
import { MOCK_CUSTOMERS } from '../../constants/mockCustomers'
import { MOCK_CONTRACTS } from '../../constants/mockContracts'
import { canViewCustomers, canManageCustomers, scopedCustomerList } from '../../constants/roles'
import type { Customer } from '../../types/customer'
import { CustomerTable } from './components/CustomerTable'
import { CustomerModal } from './components/CustomerModal'

// Real Customers list, replacing the "coming soon" placeholder — per the
// Customer doc's Phase 2 "List Customer" feature (name, ID number, active
// contracts, blacklist status). Phase 1 only ever touched customers
// inline during contract creation; this is the standalone module that was
// deferred at the time the Contracts module was rewritten.
export function CustomersPage() {
  const user = useCurrentUser()
  const [version, setVersion] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [search, setSearch] = useState('')
  void version // trigger re-render on mutation

  if (!canViewCustomers(user)) {
    return (
      <Alert
        type="info"
        message="Not applicable"
        description="Customers are scoped to a merchant workspace. Super Admin operates at the platform level."
        showIcon
      />
    )
  }

  const scoped = scopedCustomerList(user, MOCK_CUSTOMERS)
  const query = search.trim().toLowerCase()
  const filtered = query
    ? scoped.filter(c =>
        c.fullName.toLowerCase().includes(query) ||
        c.nationalId.toLowerCase().includes(query) ||
        c.phone.toLowerCase().includes(query),
      )
    : scoped

  function refresh() {
    setVersion(v => v + 1)
  }

  return (
    <div className="ifix-fill-page">
      <ListToolbar
        search={<ListSearch value={search} onChange={setSearch} placeholder="Search by name, National ID, or phone" mobilePlaceholder="Search customers" />}
        action={canManageCustomers(user) ? { label: 'Add Customer', onClick: () => setCreateOpen(true) } : undefined}
      />

      <CustomerTable customers={filtered} contracts={MOCK_CONTRACTS} search={search} />

      <CustomerModal
        open={createOpen}
        customer={null}
        onClose={() => setCreateOpen(false)}
        onSaved={(customer: Customer) => {
          setCreateOpen(false)
          MOCK_CUSTOMERS.push(customer)
          refresh()
          message.success(`${customer.fullName} added`)
        }}
      />
    </div>
  )
}
