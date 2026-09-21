import type { ProductCategory, ProductType, ProductStatus, UnitGrade, UnitTax, UnitAvailability } from '../types/product'
import type { ProductOptionType } from '../types/productOption'
import { MOCK_PRODUCT_OPTIONS } from './mockProductOptions'

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
// mockProductOptions.ts and Settings > Product Options) rather than fixed
// lists — these readers return the values a merchant may currently pick.
// Disabled options are filtered out here; a SKU already holding a disabled
// value keeps it via optionsWithCurrent below.
export function enabledOptionValues(type: ProductOptionType): string[] {
  return MOCK_PRODUCT_OPTIONS.filter(o => o.type === type && o.enabled).map(o => o.value)
}

// RAM and Connection differ from Storage/Color: the doc fixes them as
// predefined values with free text explicitly disallowed, and they are not
// SuperAdmin-managed — so they stay hard-coded rather than becoming master
// data later.
export const RAM_OPTIONS = ['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB', '18GB', '24GB', '32GB', '48GB', '64GB']

export const CONNECTION_OPTIONS = ['Wi-Fi', 'Wi-Fi + Cellular', '4G LTE', '5G']

// A disabled/removed master-data option must keep rendering on SKUs that
// already use it, so a SKU's stored value is merged into the option list
// rather than being dropped (which would blank the field in the form).
export function optionsWithCurrent(options: string[], current?: string) {
  const all = current && !options.includes(current) ? [...options, current] : options
  return all.map(value => ({ value, label: value }))
}
