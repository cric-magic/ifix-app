import type { UserRole } from './user'
import type { ProductCategory } from './product'

export type { UserRole }

// The contract-specific types that used to live here (InstallmentRecord,
// ScheduleItem, PaymentRecord, CustomerInfo, ContractStatus, PaymentStatus,
// StatusFilter) moved to types/contract.ts as part of the Contracts module
// rewrite — this file's remaining exports (AuthUser, ScheduleResult) are
// shared far outside that module (Products pages, roles.ts) and aren't part
// of the rename.

export interface AuthUser {
  id: string
  name: string
  role: UserRole
  branch?: string
  merchantId?: string
  // Carried through from UserAccount so the catalog scoping helpers can see
  // it — undefined/empty means unrestricted. Only ever set for Staff.
  permittedCategories?: ProductCategory[]
}

export interface ScheduleResult {
  monthlyInstallment: number
  totalInterest: number
  totalPayable: number
  flatRatePercent: number
  schedule: { period: number; dueDate: string; amount: number }[]
}
