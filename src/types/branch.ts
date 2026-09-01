import type { BankAccountProfile } from './merchant'

// Per the Branch doc: renamed from "Suspended" to "Archived" — archiving a
// branch auto-suspends all its staff/branch managers (handled where a
// branch's status is toggled, not part of this type itself).
export type BranchStatus = 'active' | 'archived'

export interface Branch {
  id: string
  merchantId: string
  name: string
  code: string
  address: string
  phone: string
  status: BranchStatus
  taxId: string
  taxBranchCode: string
  // Singular — one bank record per branch (unlike Merchant's list of
  // profiles), printed on the contract as payment proof. Reuses
  // BankAccountProfile's shape rather than a separate type since the
  // fields are identical; `isDefault` is meaningless with only one record
  // and is just left true.
  bankAccount?: BankAccountProfile
  createdBy: string | null
  createdAt: string
  archivedBy: string | null
  archivedAt: string | null
}
