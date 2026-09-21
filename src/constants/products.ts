import type { ProductCategory, ProductType, ProductStatus, UnitGrade, UnitTax, UnitAvailability } from '../types/product'
import type { ProductAttributeType } from '../types/productAttribute'
import { MOCK_PRODUCT_ATTRIBUTES } from './mockProductAttributes'

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  smartphone: 'Smartphone',
  tablet: 'Tablet',
  accessory: 'Accessory',
  laptop: 'Laptop',
  other: 'Other',
}

export const TYPE_LABELS: Record<ProductType, string> = {
  new: 'New',
  used: 'Used',
}

export const STATUS_LABELS: Record<ProductStatus, string> = {
  available: 'Available',
  unavailable: 'Unavailable',
}

export const GRADE_LABELS: Record<UnitGrade, string> = {
  A: 'Grade A',
  B: 'Grade B',
  C: 'Grade C',
  D: 'Grade D',
}

export const TAX_LABELS: Record<UnitTax, string> = {
  vat: 'VAT',
  non_vat: 'Non-VAT',
}

export const AVAILABILITY_LABELS: Record<UnitAvailability, string> = {
  available: 'Available',
  reserved: 'Reserved',
  sold: 'Sold',
}

// Storage and Color are master data owned by Super Admin (see
// mockProductAttributes.ts and Products > Attributes) rather than fixed
// lists — these readers return the values a merchant may currently pick.
// Disabled options are filtered out here; a SKU already holding a disabled
// value keeps it via optionsWithCurrent below.
export function enabledAttributeValues(type: ProductAttributeType): string[] {
  return MOCK_PRODUCT_ATTRIBUTES.filter(o => o.type === type && o.enabled).map(o => o.value)
}

// RAM and Connection differ from Storage/Color: the doc fixes them as
// predefined values with free text explicitly disallowed, and only Storage
// and Color are named as SuperAdmin-managed — so these stay hard-coded for
// now. They're still listed on the Attributes screen, read-only, so that
// screen answers "what attributes exist" rather than only "what's editable".
export const RAM_OPTIONS = ['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB', '18GB', '24GB', '32GB', '48GB', '64GB']

export const CONNECTION_OPTIONS = ['Wi-Fi', 'Wi-Fi + Cellular', '4G LTE', '5G']

export type AttributeTypeKey = ProductAttributeType | 'ram' | 'connection'

export interface AttributeTypeMeta {
  key: AttributeTypeKey
  label: string
  // Singular, for button and dialog copy ("Add color").
  noun: string
  // Managed types are SuperAdmin master data and can be added to or
  // disabled; fixed ones are hard-coded lists shown for reference only.
  managed: boolean
  // Which Product field carries this attribute, for usage counts.
  field: 'color' | 'storage' | 'ram' | 'connection'
}

export const ATTRIBUTE_TYPES: AttributeTypeMeta[] = [
  { key: 'color', label: 'Color', noun: 'color', managed: true, field: 'color' },
  { key: 'storage', label: 'Storage', noun: 'storage', managed: true, field: 'storage' },
  { key: 'ram', label: 'RAM', noun: 'RAM', managed: false, field: 'ram' },
  { key: 'connection', label: 'Connection', noun: 'connection', managed: false, field: 'connection' },
]

export function attributeType(key: string): AttributeTypeMeta | undefined {
  return ATTRIBUTE_TYPES.find(t => t.key === key)
}

// One shape for both kinds of attribute so the screens don't branch on every
// row: managed values carry their real id and enabled flag, fixed ones are
// synthesised as always-enabled entries with no id to act on.
export interface AttributeValueRow {
  id: string | null
  value: string
  enabled: boolean
}

export function attributeValues(meta: AttributeTypeMeta): AttributeValueRow[] {
  if (meta.managed) {
    return MOCK_PRODUCT_ATTRIBUTES
      .filter(a => a.type === meta.key)
      .map(a => ({ id: a.id, value: a.value, enabled: a.enabled }))
  }
  const fixed = meta.key === 'ram' ? RAM_OPTIONS : CONNECTION_OPTIONS
  return fixed.map(value => ({ id: null, value, enabled: true }))
}

// A disabled/removed master-data option must keep rendering on SKUs that
// already use it, so a SKU's stored value is merged into the option list
// rather than being dropped (which would blank the field in the form).
export function optionsWithCurrent(options: string[], current?: string) {
  const all = current && !options.includes(current) ? [...options, current] : options
  return all.map(value => ({ value, label: value }))
}
