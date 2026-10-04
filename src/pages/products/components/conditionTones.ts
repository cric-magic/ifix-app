import type { ProductType } from '../../../types/product'
import type { Tone } from '../../../components/tones'

// Each SKU condition's tone (components/tones.ts), shared by the Catalog's
// condition tabs (ProductTypeTabs) and the condition tag (ProductConditionTag):
// New cyan, Opened lime, Used magenta — hues the unit statuses (green, amber,
// purple) don't use, since a condition is a kind of product, not a status.
export const CONDITION_TONES: Record<ProductType, Tone> = {
  new: 'cyan',
  opened: 'lime',
  used: 'magenta',
}
