import { theme } from 'antd'
import type { ProductStatus } from '../../../types/product'
import { STATUS_LABELS } from '../../../constants/products'
import { DotTag } from '../../../components/DotTag'
import { useTones } from '../../../components/tones'

// A SKU's status as a tinted tag, like a unit's availability: Available in
// the success tone; Unavailable neutral with faded text — it's switched off.
export function ProductStatusTag({ status }: { status: ProductStatus }) {
  const { token } = theme.useToken()
  const tones = useTones()
  const tone = status === 'available' ? tones.success : tones.neutral
  return (
    <DotTag
      dotColor={tone.dot}
      textColor={status === 'available' ? tone.color : token.colorTextTertiary}
    >
      {STATUS_LABELS[status]}
    </DotTag>
  )
}
