import { useState } from 'react'
import { Card } from 'antd'
import type { Dayjs } from 'dayjs'
import { MOCK_INSTALLMENTS } from '../../constants/mockData'
import { canEditInstallment, canViewBranchFilter } from '../../constants/roles'
import { useAuth } from '../../contexts/AuthContext'
import type { StatusFilter } from '../../types/installment'
import { PageHeader } from '../../components/PageHeader'
import { SummaryCards } from './components/SummaryCards'
import { InstallmentFilters } from './components/InstallmentFilters'
import { StatusTabs } from './components/StatusTabs'
import { InstallmentTable } from './components/InstallmentTable'

export function InstallmentListPage() {
  const { user } = useAuth()
  const isAdmin = canViewBranchFilter(user)

  const [searchText, setSearchText] = useState('')
  const [activeTab, setActiveTab] = useState<StatusFilter>('all')
  const [selectedBranch, setSelectedBranch] = useState<string | undefined>()
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null)

  // Scope to branch for retail users
  const scopedRecords = isAdmin
    ? MOCK_INSTALLMENTS
    : MOCK_INSTALLMENTS.filter(r => r.branch === user.branch)

  // Apply filters
  const filtered = scopedRecords.filter(r => {
    const q = searchText.toLowerCase()
    const matchesSearch =
      !q ||
      r.invoiceNumber.toLowerCase().includes(q) ||
      r.contractNumber.toLowerCase().includes(q) ||
      r.customerName.toLowerCase().includes(q)

    const matchesBranch = !selectedBranch || r.branch === selectedBranch

    const matchesDate =
      !dateRange ||
      (r.endDate >= dateRange[0].format('YYYY-MM-DD') &&
        r.endDate <= dateRange[1].format('YYYY-MM-DD'))

    const matchesTab = activeTab === 'all' || r.paymentStatus === activeTab

    return matchesSearch && matchesBranch && matchesDate && matchesTab
  })

  return (
    <div>
      <PageHeader title="Installment Overview" subtitle="Track payment status across all contracts" />

      <SummaryCards records={filtered} />

      <Card styles={{ body: { padding: 0 } }}>
        <div style={{ padding: '16px 16px 0' }}>
          <InstallmentFilters
            isAdmin={isAdmin}
            onSearch={setSearchText}
            onBranchChange={setSelectedBranch}
            onDateRangeChange={setDateRange}
          />
          <StatusTabs activeTab={activeTab} allRecords={scopedRecords} onChange={setActiveTab} />
        </div>
        <InstallmentTable
          records={filtered}
          canEdit={record => canEditInstallment(user, record)}
        />
      </Card>
    </div>
  )
}
