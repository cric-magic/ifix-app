import { Tabs, Badge } from 'antd'
import type { InstallmentRecord, StatusFilter } from '../../../types/installment'

interface Props {
  activeTab: StatusFilter
  allRecords: InstallmentRecord[]
  onChange: (tab: StatusFilter) => void
}

export function StatusTabs({ activeTab, allRecords, onChange }: Props) {
  const count = (status: StatusFilter) =>
    status === 'all' ? allRecords.length : allRecords.filter(r => r.paymentStatus === status).length

  const tabs: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'due', label: 'Due' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'paid', label: 'Paid' },
  ]

  return (
    <Tabs
      activeKey={activeTab}
      onChange={key => onChange(key as StatusFilter)}
      style={{ marginBottom: 0 }}
      items={tabs.map(t => ({
        key: t.key,
        label: (
          <span>
            {t.label}{' '}
            <Badge
              count={count(t.key)}
              showZero
              style={{
                backgroundColor: t.key === 'overdue' ? '#ff4d4f' : t.key === 'due' ? '#fa8c16' : '#d9d9d9',
                color: t.key === 'all' || t.key === 'paid' ? '#595959' : undefined,
              }}
            />
          </span>
        ),
      }))}
    />
  )
}
