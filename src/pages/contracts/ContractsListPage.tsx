import { useState } from 'react'
import { Alert, Button } from 'antd'
import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCurrentUser } from '../../contexts/AuthContext'
import { MOCK_CONTRACTS } from '../../constants/mockContracts'
import { MOCK_PRODUCTS } from '../../constants/mockProducts'
import { canCreateContract, canViewBranchFilter, canViewContracts, scopedContractList } from '../../constants/roles'
import { ContractTable } from './components/ContractTable'
import { ContractFilters, type ContractStatusFilter } from './components/ContractFilters'

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
      c.device.imei.toLowerCase().includes(query)
    const matchesStatus = status === 'all' || c.status === status
    const matchesBranch = !branch || c.branch === branch
    return matchesSearch && matchesStatus && matchesBranch
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 8, overflowX: 'auto', overflowY: 'clip' }}>
        <ContractFilters
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={setStatus}
          showBranchFilter={isAdmin}
          branch={branch}
          onBranchChange={setBranch}
        />
        {canCreateContract(user) && (
          <Button type="primary" icon={<Plus size={15} strokeWidth={2.25} />} onClick={() => navigate('/contracts/new')}>
            Create Contract
          </Button>
        )}
      </div>

      <ContractTable
        contracts={filtered}
        products={MOCK_PRODUCTS}
        showBranchColumns={isAdmin}
        search={search}
      />
    </div>
  )
}
