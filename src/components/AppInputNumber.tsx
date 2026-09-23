import { InputNumber as AntdInputNumber } from 'antd'
import type { InputNumberProps } from 'antd'
import { ChevronDown, ChevronUp } from 'lucide-react'

// antd's stepper arrows are its own icon set (UpOutlined/DownOutlined), and
// unlike DatePicker's suffix there's no ConfigProvider slot to swap them
// globally — so, like AppSelect's arrow, they're set here once and every
// InputNumber imports this instead of antd's. The handles are half the
// field's height, hence 12px rather than the usual 14–16.
export function InputNumber(props: InputNumberProps) {
  return (
    <AntdInputNumber
      controls={{
        upIcon: <ChevronUp size={12} strokeWidth={2.25} />,
        downIcon: <ChevronDown size={12} strokeWidth={2.25} />,
      }}
      {...props}
    />
  )
}
