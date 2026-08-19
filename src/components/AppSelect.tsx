import { Select as AntdSelect } from 'antd'
import type { SelectProps } from 'antd'
import { ChevronDown } from 'lucide-react'

export function Select<ValueType = unknown>(props: SelectProps<ValueType>) {
  return <AntdSelect suffixIcon={<ChevronDown size={14} strokeWidth={2.25} />} {...props} />
}
