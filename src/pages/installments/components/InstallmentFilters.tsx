import { Input, DatePicker, Space } from 'antd'
import { Select } from '../../../components/AppSelect'
import type { Dayjs } from 'dayjs'
import { BRANCHES } from '../../../constants/mockData'

const { RangePicker } = DatePicker

interface Props {
  isAdmin: boolean
  onSearch: (value: string) => void
  onBranchChange: (branch: string | undefined) => void
  onDateRangeChange: (range: [Dayjs, Dayjs] | null) => void
}

export function InstallmentFilters({ isAdmin, onSearch, onBranchChange, onDateRangeChange }: Props) {
  return (
    <Space wrap>
      <Input.Search
        placeholder="Search invoice / contract / customer"
        allowClear
        style={{ width: 300 }}
        onSearch={onSearch}
        onChange={e => { if (!e.target.value) onSearch('') }}
      />
      {isAdmin && (
        <Select
          placeholder="All branches"
          allowClear
          style={{ width: 160 }}
          options={BRANCHES.map(b => ({ value: b, label: b }))}
          onChange={onBranchChange}
        />
      )}
      {isAdmin && (
        <RangePicker
          placeholder={['Due from', 'Due to']}
          onChange={range => onDateRangeChange(range as [Dayjs, Dayjs] | null)}
        />
      )}
    </Space>
  )
}
