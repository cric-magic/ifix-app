import { Segmented, Tag } from 'antd'
import type { Product, ProductType } from '../../../types/product'
import { TYPE_LABELS } from '../../../constants/products'

export type TypeFilter = 'all' | ProductType

interface Props {
  activeType: TypeFilter
  allProducts: Product[]
  onChange: (type: TypeFilter) => void
}

export function ProductTypeTabs({ activeType, allProducts, onChange }: Props) {
  const count = (type: TypeFilter) =>
    type === 'all' ? allProducts.length : allProducts.filter(p => p.type === type).length

  const tabs: { key: TypeFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'new', label: TYPE_LABELS.new },
    { key: 'used', label: TYPE_LABELS.used },
  ]

  return (
    <Segmented
      value={activeType}
      onChange={key => onChange(key as TypeFilter)}
      options={tabs.map(t => ({
        value: t.key,
        label: (
          <span>
            {t.label}{' '}
            <Tag style={{ margin: 0 }}>{count(t.key)}</Tag>
          </span>
        ),
      }))}
    />
  )
}
