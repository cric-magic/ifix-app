import { useState } from 'react'
import { Alert } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useCurrentUser } from '../../contexts/AuthContext'
import { MOCK_CONTRACTS } from '../../constants/mockContracts'
import { MOCK_PRODUCTS } from '../../constants/mockProducts'
import { canCreateContract, canViewBranchFilter, canViewContracts, scopedContractList } from '../../constants/roles'
import { ContractTable } from './components/ContractTable'
import { ContractSearch, type ContractStatusFilter } from './components/ContractFilters'
import { contractFilterFields } from './components/contractFilterFields'
import { ListToolbar } from '../../components/ListToolbar'

// Real Contracts list, replacing the old "coming soon" placeholder — per
// the Contract doc's "List Contract" section: search by contract number/
// customer/phone/IMEI, filter/tab by status, and (Merchant Admin/Owner
// only) an additional branch filter + net position column. Staff and
// Branch Manager are scoped to their own branch via scopedContractList.
export function ContractsListPage() {
  const user = useCurrentUser()
  const navigate = useNavigate()
  const isAdmin = canViewBranchFilter(user)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ContractStatusFilter>('all')
  const [branch, setBranch] = useState<string | undefined>()

  if (!canViewContracts(user)) {
    return (
      <Alert
        type="info"
        message="Not applicable"
        description="Contracts are scoped to a merchant workspace. Super Admin operates at the platform level."
        showIcon
      />
    )
  }

  const scoped = scopedContractList(user, MOCK_CONTRACTS)

  const query = search.trim().toLowerCase()
  const filtered = scoped.filter(c => {
    const matchesSearch = !query ||
      c.contractNumber.toLowerCase().includes(query) ||
      c.customer.fullName.toLowerCase().includes(query) ||
      c.customer.phone.toLowerCase().includes(query) ||
      c.device.serialNumber.toLowerCase().includes(query) ||
      !!c.device.imei1?.toLowerCase().includes(query) ||
      !!c.device.imei2?.toLowerCase().includes(query)
    const matchesStatus = status === 'all' || c.status === status
    const matchesBranch = !branch || c.branch === branch
    return matchesSearch && matchesStatus && matchesBranch
  })

  return (
    <div className="ifix-fill-page">
      <ListToolbar
        search={<ContractSearch value={search} onChange={setSearch} />}
        filters={contractFilterFields({
          status,
          onStatusChange: setStatus,
          showBranchFilter: isAdmin,
          branch,
          onBranchChange: setBranch,
        })}
        activeFilterCount={(status !== 'all' ? 1 : 0) + (branch ? 1 : 0)}
        onClearFilters={() => { setStatus('all'); setBranch(undefined) }}
        action={canCreateContract(user) ? { label: 'Create Contract', onClick: () => navigate('/contracts/new') } : undefined}
      />

      <ContractTable
        contracts={filtered}
        products={MOCK_PRODUCTS}
        showBranchColumns={isAdmin}
        search={search}
      />
    </div>
  )
}
