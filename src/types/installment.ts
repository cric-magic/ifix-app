import type { UserRole } from './user'

export type { UserRole }

// The contract-specific types that used to live here (InstallmentRecord,
// ScheduleItem, PaymentRecord, CustomerInfo, ContractStatus, PaymentStatus,
// StatusFilter) moved to types/contract.ts as part of the Contracts module
// rewrite — this file's remaining exports (Product, AuthUser, ScheduleResult)
// are shared far outside that module (SmartCalculatorPage, Products pages,
// roles.ts) and aren't part of the rename.

export interface AuthUser {
  id: string
  name: string
  role: UserRole
  branch?: string
  merchantId?: string
}

// Legacy flat product shape used only by the standalone Smart Calculator
// (constants/mockData.ts's MOCK_PRODUCTS) — unrelated to the real
// Product/ProductUnit types in types/product.ts used by the Products
// module and Contract creation's device step.
export interface Product {
  id: string
  name: string
  brand: string
  model: string
  sku: string
  category: string
  color: string
  storage: string
  price: number
  cost: number
  stock: number
}

export interface ScheduleResult {
  monthlyInstallment: number
  totalInterest: number
  totalPayable: number
  flatRatePercent: number
  schedule: { period: number; dueDate: string; amount: number }[]
}
