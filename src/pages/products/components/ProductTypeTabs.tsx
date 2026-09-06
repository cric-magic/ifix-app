import { ConfigProvider, Segmented } from 'antd'
import type { ProductType } from '../../../types/product'
import { TYPE_LABELS } from '../../../constants/products'

export type TypeFilter = 'all' | ProductType

interface Props {
  activeType: TypeFilter
  onChange: (type: TypeFilter) => void
}

export function ProductTypeTabs({ activeType, onChange }: Props) {
  const tabs: { key: TypeFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'new', label: TYPE_LABELS.new },
    { key: 'used', label: TYPE_LABELS.used },
  ]

  return (
    // Segmented's own real 1px border (index.css) adds its own width on top
    // of antd's internal item-height math instead of being absorbed into
    // it, which otherwise leaves this control 2px taller than the Button
    // it sits next to in the same row (ProductsPage) — a locally scoped
    // controlHeight compensates so the two stay pixel-matched without
    // touching the app's shared controlHeight (36) that Button itself uses.
    <ConfigProvider theme={{ token: { controlHeight: 34 } }}>
      <Segmented
        value={activeType}
        onChange={key => onChange(key as TypeFilter)}
        options={tabs.map(t => ({ value: t.key, label: t.label }))}
      />
    </ConfigProvider>
  )
}
