import type { ProductCategory } from './product'

export type UserRole = 'super_admin' | 'merchant_owner' | 'merchant_admin' | 'branch_manager' | 'staff'
export type UserStatus = 'created' | 'active' | 'suspended'

export interface UserAccount {
  id: string
  name: string
  staffId: string
  email: string
  password: string
  phone: string
  role: UserRole
  merchantId?: string
  branch?: string
  // Staff-only catalog restriction. Undefined or empty means unrestricted,
  // which is the doc's default ("By default, Staff can view products in
  // every category") — so an account that has never been restricted behaves
  // exactly as before, and clearing the list restores full visibility.
  permittedCategories?: ProductCategory[]
  status: UserStatus
  isTemporaryPassword: boolean
  createdBy: string | null
  createdAt: string
  activatedAt: string | null
  suspendedBy: string | null
  suspendedAt: string | null
  resetToken: string | null
  resetTokenExpiresAt: string | null
}
