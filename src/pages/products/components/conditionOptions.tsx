import type { ReactNode } from 'react'
import { Typography } from 'antd'
import type { ProductType } from '../../../types/product'
import { TYPE_DESCRIPTIONS, TYPE_LABELS } from '../../../constants/products'

// The Condition picker's options. Each says what it means in the open list
// — Opened especially, which is easy to confuse with Used — while the
// closed field shows just the label.
export const CONDITION_OPTIONS = (Object.keys(TYPE_LABELS) as ProductType[])
  .map(value => ({ value, label: TYPE_LABELS[value] }))

export function renderConditionOption(option: { value?: string | number | null; label?: ReactNode }): ReactNode {
  return (
    <div>
      <div>{option.label}</div>
      <Typography.Text type="secondary" style={{ fontSize: 12, whiteSpace: 'normal' }}>
        {TYPE_DESCRIPTIONS[option.value as ProductType]}
      </Typography.Text>
    </div>
  )
}
