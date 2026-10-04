import type { ProductType } from '../../../types/product'
import { TYPE_LABELS } from '../../../constants/products'
import { DotTag } from '../../../components/DotTag'
import { useTones } from '../../../components/tones'
import { CONDITION_TONES } from './conditionTones'

// A SKU's condition — New, Opened or Used — as a tinted tag in its
// condition's tone, matching the Catalog's condition tabs.
export function ProductConditionTag({ type }: { type: ProductType }) {
  const tone = useTones()[CONDITION_TONES[type]]
  return (
    <DotTag dotColor={tone.dot} textColor={tone.color}>
      {TYPE_LABELS[type]}
    </DotTag>
  )
}
