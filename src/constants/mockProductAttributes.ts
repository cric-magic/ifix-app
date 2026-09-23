import type { ProductAttribute } from '../types/productAttribute'

// Seeded from the values the existing mock SKUs already use, plus the common
// capacities/finishes a merchant would expect to find. Super Admin edits this
// list from Products > Attributes; merchants only ever read it.
export const MOCK_PRODUCT_ATTRIBUTES: ProductAttribute[] = [
  { id: 'opt-storage-1', type: 'storage', value: '64GB', enabled: true, createdAt: '2024-01-01T09:00:00.000Z' },
  { id: 'opt-storage-2', type: 'storage', value: '128GB', enabled: true, createdAt: '2024-01-01T09:00:00.000Z' },
  { id: 'opt-storage-3', type: 'storage', value: '256GB', enabled: true, createdAt: '2024-01-01T09:00:00.000Z' },
  { id: 'opt-storage-4', type: 'storage', value: '512GB', enabled: true, createdAt: '2024-01-01T09:00:00.000Z' },
  { id: 'opt-storage-5', type: 'storage', value: '1TB', enabled: true, createdAt: '2024-01-01T09:00:00.000Z' },
  { id: 'opt-storage-6', type: 'storage', value: '2TB', enabled: true, createdAt: '2024-01-01T09:00:00.000Z' },
  { id: 'opt-color-1', type: 'color', value: 'Space Black', enabled: true, createdAt: '2024-01-01T09:00:00.000Z' },
  { id: 'opt-color-2', type: 'color', value: 'Midnight', enabled: true, createdAt: '2024-01-01T09:00:00.000Z' },
  { id: 'opt-color-3', type: 'color', value: 'Starlight', enabled: true, createdAt: '2024-01-01T09:00:00.000Z' },
  { id: 'opt-color-4', type: 'color', value: 'Silver', enabled: true, createdAt: '2024-01-01T09:00:00.000Z' },
  { id: 'opt-color-5', type: 'color', value: 'Graphite', enabled: true, createdAt: '2024-01-01T09:00:00.000Z' },
  { id: 'opt-color-6', type: 'color', value: 'Phantom Black', enabled: true, createdAt: '2024-01-01T09:00:00.000Z' },
  { id: 'opt-color-7', type: 'color', value: 'Cream', enabled: true, createdAt: '2024-01-01T09:00:00.000Z' },
  { id: 'opt-color-8', type: 'color', value: 'Blue', enabled: true, createdAt: '2024-01-01T09:00:00.000Z' },
  { id: 'opt-color-9', type: 'color', value: 'Purple', enabled: true, createdAt: '2024-01-01T09:00:00.000Z' },
  { id: 'opt-color-10', type: 'color', value: 'Green', enabled: true, createdAt: '2024-01-01T09:00:00.000Z' },
  { id: 'opt-color-11', type: 'color', value: 'White', enabled: true, createdAt: '2024-01-01T09:00:00.000Z' },
  // The current lineup's finishes (see LINEUP in mockCatalogProducts.ts).
  { id: 'opt-color-12', type: 'color', value: 'Black', enabled: true, createdAt: '2025-02-01T09:00:00.000Z' },
  { id: 'opt-color-13', type: 'color', value: 'Lavender', enabled: true, createdAt: '2025-02-01T09:00:00.000Z' },
  { id: 'opt-color-14', type: 'color', value: 'Cosmic Orange', enabled: true, createdAt: '2025-02-01T09:00:00.000Z' },
  { id: 'opt-color-15', type: 'color', value: 'Deep Blue', enabled: true, createdAt: '2025-02-01T09:00:00.000Z' },
  { id: 'opt-color-16', type: 'color', value: 'Icyblue', enabled: true, createdAt: '2025-02-01T09:00:00.000Z' },
  { id: 'opt-color-17', type: 'color', value: 'Navy', enabled: true, createdAt: '2025-02-01T09:00:00.000Z' },
  { id: 'opt-color-18', type: 'color', value: 'Silver Shadow', enabled: true, createdAt: '2025-02-01T09:00:00.000Z' },
  { id: 'opt-color-19', type: 'color', value: 'Titanium Black', enabled: true, createdAt: '2025-02-01T09:00:00.000Z' },
  { id: 'opt-color-20', type: 'color', value: 'Titanium Silverblue', enabled: true, createdAt: '2025-02-01T09:00:00.000Z' },
  { id: 'opt-color-21', type: 'color', value: 'Sky Blue', enabled: true, createdAt: '2025-02-01T09:00:00.000Z' },
  { id: 'opt-color-22', type: 'color', value: 'Jetblack', enabled: true, createdAt: '2025-02-01T09:00:00.000Z' },
  { id: 'opt-color-23', type: 'color', value: 'Blue Shadow', enabled: true, createdAt: '2025-02-01T09:00:00.000Z' },
]
