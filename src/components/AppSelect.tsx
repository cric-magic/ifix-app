import { Select as AntdSelect } from 'antd'
import type { SelectProps } from 'antd'
import { ChevronDown } from 'lucide-react'

// Multiple/tags mode marks each chosen option with a check icon, so the
// selected-row fill is redundant there and piles up once several rows are
// selected — it's dropped for those popups in index.css. antd puts no
// multiple-specific class on the popup (it's portaled, so it doesn't
// inherit from the field either), hence tagging it here. Single-select
// popups keep the fill: it's the only selection cue that mode has.
export function Select<ValueType = unknown>({ classNames, ...props }: SelectProps<ValueType>) {
  const isMultiple = props.mode === 'multiple' || props.mode === 'tags'
  return (
    <AntdSelect
      suffixIcon={<ChevronDown size={14} strokeWidth={2.25} />}
      classNames={{
        ...classNames,
        popup: {
          ...classNames?.popup,
          root: [classNames?.popup?.root, isMultiple && 'ifix-select-multiple-popup']
            .filter(Boolean)
            .join(' ') || undefined,
        },
      }}
      {...props}
    />
  )
}
