import type { ProductCategory, ProductType, ProductStatus, UnitGrade, UnitTax, UnitAvailability } from '../types/product'

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
