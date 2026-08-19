import { theme } from 'antd'
import type { UnitAvailability } from '../../../types/product'
import { AVAILABILITY_LABELS } from '../../../constants/products'
import { DotTag } from '../../../components/DotTag'

export function UnitAvailabilityTag({ availability }: { availability: UnitAvailability }) {
  const { token } = theme.useToken()
  const dotColor = {
    available: token.colorSuccess,
    reserved: token.colorWarning,
    sold: token.colorTextTertiary,
  }[availability]
  return <DotTag dotColor={dotColor}>{AVAILABILITY_LABELS[availability]}</DotTag>
}
