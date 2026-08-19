import { Segmented, Tag } from 'antd'
import type { InstallmentRecord, StatusFilter } from '../../../types/installment'

interface Props {
  activeTab: StatusFilter
  allRecords: InstallmentRecord[]
  onChange: (tab: StatusFilter) => void
}

const TAB_COLOR: Record<StatusFilter, string> = {
  all: 'default',
  due: 'orange',
  overdue: 'red',
  paid: 'green',
  future: 'default',
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
    <Segmented
      value={activeTab}
      onChange={key => onChange(key as StatusFilter)}
      options={tabs.map(t => ({
        value: t.key,
        label: (
          <span>
            {t.label}{' '}
            <Tag color={TAB_COLOR[t.key]} style={{ margin: 0 }}>
              {count(t.key)}
            </Tag>
          </span>
        ),
      }))}
    />
  )
}
