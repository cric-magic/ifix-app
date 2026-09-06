import type { Product } from '../types/installment'

// MOCK_INSTALLMENTS/MOCK_CUSTOMERS/MOCK_SCHEDULES/MOCK_PAYMENTS used to live
// here — they moved to constants/mockContracts.ts / mockCustomers.ts as
// part of the Contracts module rewrite. BRANCHES/FLAT_RATES/MOCK_PRODUCTS
// below are the Smart Calculator's own standalone mock data (a legacy flat
// Product shape, unrelated to the real Product/ProductUnit types the
// Products and Contracts modules use) and are untouched by that rewrite.

export const BRANCHES = ['Bangkok HQ', 'Chiang Mai', 'Phuket', 'Khon Kaen']

export const FLAT_RATES = [1.0, 1.25, 1.5, 1.75, 2.0]

export const MOCK_PRODUCTS: Product[] = [
  { id: 'prod-001', name: 'iPhone 15 Pro', brand: 'Apple', model: 'A3290', sku: 'IPH15P-BLK-256', category: 'Smartphone', color: 'Black Titanium', storage: '256GB', price: 42900, cost: 38000, stock: 5 },
  { id: 'prod-002', name: 'iPhone 15', brand: 'Apple', model: 'A3090', sku: 'IPH15-BLU-128', category: 'Smartphone', color: 'Blue', storage: '128GB', price: 32900, cost: 29000, stock: 8 },
  { id: 'prod-003', name: 'Samsung Galaxy S24 Ultra', brand: 'Samsung', model: 'SM-S928B', sku: 'SGS24U-BLK-256', category: 'Smartphone', color: 'Titanium Black', storage: '256GB', price: 44900, cost: 40000, stock: 4 },
  { id: 'prod-004', name: 'Samsung Galaxy A55', brand: 'Samsung', model: 'SM-A556B', sku: 'SGA55-BLU-128', category: 'Smartphone', color: 'Awesome Iceblue', storage: '128GB', price: 14900, cost: 12500, stock: 12 },
  { id: 'prod-005', name: 'iPad Pro 11"', brand: 'Apple', model: 'M4', sku: 'IPADPRO11-SLV-256', category: 'Tablet', color: 'Silver', storage: '256GB', price: 35900, cost: 31000, stock: 3 },
  { id: 'prod-006', name: 'iPad Air 11"', brand: 'Apple', model: 'M2', sku: 'IPADAIR11-SPC-128', category: 'Tablet', color: 'Space Gray', storage: '128GB', price: 21900, cost: 19000, stock: 6 },
  { id: 'prod-007', name: 'MacBook Air 13"', brand: 'Apple', model: 'M3', sku: 'MBA13-SLV-256', category: 'Laptop', color: 'Silver', storage: '256GB', price: 42900, cost: 38500, stock: 3 },
  { id: 'prod-008', name: 'AirPods Pro 2nd Gen', brand: 'Apple', model: 'A3048', sku: 'APP2-WHT', category: 'Accessories', color: 'White', storage: '-', price: 8900, cost: 7200, stock: 15 },
  { id: 'prod-009', name: 'Apple Watch Series 9', brand: 'Apple', model: 'A2978', sku: 'AWS9-BLK-45', category: 'Wearable', color: 'Midnight', storage: '-', price: 15900, cost: 13500, stock: 7 },
  { id: 'prod-010', name: 'Xiaomi 14T Pro', brand: 'Xiaomi', model: '24091PN0G', sku: 'XM14TP-BLK-256', category: 'Smartphone', color: 'Titan Black', storage: '256GB', price: 22900, cost: 19500, stock: 9 },
]
