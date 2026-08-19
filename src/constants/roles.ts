import type { AuthUser, InstallmentRecord } from '../types/installment'
import type { UserAccount, UserRole } from '../types/user'
import type { Product, ProductUnit } from '../types/product'
import { MOCK_USER_ACCOUNTS } from './mockUsers'

export const ROLE_LEVEL: Record<UserRole, number> = {
  staff: 1,
  branch_manager: 2,
  merchant_admin: 3,
  merchant_owner: 4,
  super_admin: 5,
}

export const ROLE_LABELS: Record<UserRole, string> = {
  staff: 'Staff',
  branch_manager: 'Branch Manager',
  merchant_admin: 'Merchant Admin',
  merchant_owner: 'Merchant Owner',
  super_admin: 'Super Admin',
}

export const ROLE_TAG_COLOR: Record<UserRole, string> = {
  staff: 'default',
  branch_manager: 'default',
  merchant_admin: 'default',
  merchant_owner: 'default',
  super_admin: 'default',
}

// Roles each actor role can create/edit/suspend/reset, per the User Account
// doc's Permission Matrix: Owner -> Owner/Admin/BM/Staff, Admin -> BM/Staff
// only (not a peer Admin), BM/Staff -> none.
const MANAGEABLE_ROLES: Record<UserRole, UserRole[]> = {
  super_admin: ['super_admin', 'merchant_owner', 'merchant_admin', 'branch_manager', 'staff'],
  merchant_owner: ['merchant_owner', 'merchant_admin', 'branch_manager', 'staff'],
  merchant_admin: ['branch_manager', 'staff'],
  branch_manager: [],
  staff: [],
}

export function isMerchantAdminOrAbove(user: AuthUser): boolean {
  return ROLE_LEVEL[user.role] >= ROLE_LEVEL.merchant_admin
}

export function toAuthUser(account: UserAccount): AuthUser {
  return {
    id: account.id,
    name: account.name,
    role: account.role,
    branch: account.branch,
    merchantId: account.merchantId,
  }
}

export const MOCK_USERS: AuthUser[] = MOCK_USER_ACCOUNTS.map(toAuthUser)

// Installment permissions — merchant_admin and above act on all branches;
// branch_manager / staff are scoped to their own assigned branch.
export function canEditInstallment(user: AuthUser, record: InstallmentRecord): boolean {
  if (isMerchantAdminOrAbove(user)) return true
  return record.branch === user.branch
}

export function canViewBranchFilter(user: AuthUser): boolean {
  return isMerchantAdminOrAbove(user)
}

export function canConfigurePenalty(user: AuthUser): boolean {
  return isMerchantAdminOrAbove(user)
}

// User management permissions — per the invite hierarchy (see MANAGEABLE_ROLES):
// Owner and Admin can invite/manage Admin, BM, Staff; BM can invite/manage Staff only.
export function canManageUsers(user: AuthUser): boolean {
  return MANAGEABLE_ROLES[user.role].length > 0
}

export function canManageTargetUser(actor: AuthUser, target: UserAccount): boolean {
  if (actor.id === target.id) return false
  if (!MANAGEABLE_ROLES[actor.role].includes(target.role)) return false
  if (actor.role === 'super_admin') return true
  return actor.merchantId === target.merchantId
}

// Branch Manager and above can view the user list (per doc); Staff cannot.
export function canViewUserList(user: AuthUser): boolean {
  return ROLE_LEVEL[user.role] >= ROLE_LEVEL.branch_manager
}

export function scopedUserList(actor: AuthUser, all: UserAccount[]): UserAccount[] {
  if (actor.role === 'super_admin') return all
  if (actor.role === 'merchant_owner' || actor.role === 'merchant_admin') {
    return all.filter(u => u.merchantId === actor.merchantId)
  }
  if (actor.role === 'branch_manager') {
    return all.filter(u => u.merchantId === actor.merchantId && u.branch === actor.branch)
  }
  return []
}

// Roles an actor is allowed to assign when creating/inviting a user.
export function assignableRoles(actor: AuthUser): UserRole[] {
  return [...MANAGEABLE_ROLES[actor.role]].sort((a, b) => ROLE_LEVEL[b] - ROLE_LEVEL[a])
}

// Product permissions — per the Product doc's permission matrix, which has no
// Super Admin column at all: products are merchant-scoped business data and
// Super Admin (a platform-level role with no assigned merchant) doesn't
// manage them. Staff can view the catalog but never cost price or CRUD it.
export function canViewProducts(user: AuthUser): boolean {
  return user.role !== 'super_admin'
}

export function canManageProducts(user: AuthUser): boolean {
  return user.role !== 'super_admin' && ROLE_LEVEL[user.role] >= ROLE_LEVEL.branch_manager
}

export function canViewCostPrice(user: AuthUser): boolean {
  return canManageProducts(user)
}

export function scopedProductList(actor: AuthUser, all: Product[]): Product[] {
  if (actor.role === 'super_admin') return []
  return all.filter(p => p.merchantId === actor.merchantId && !p.deletedAt)
}

// Unit permissions — "Assign / Update Product Units" in the doc's matrix has
// the same actor set as product management (Staff ❌, BM+ ✅), but BM is
// scoped to their own branch rather than the whole merchant.
export function canManageUnits(user: AuthUser): boolean {
  return canManageProducts(user)
}

export function scopedUnitList(actor: AuthUser, productId: string, all: ProductUnit[]): ProductUnit[] {
  const forProduct = all.filter(u => u.productId === productId)
  if (actor.role === 'branch_manager') return forProduct.filter(u => u.branch === actor.branch)
  return forProduct
}

// Global unit list (across all products) — same merchant/branch scoping as
// scopedUnitList, just not narrowed to one product.
export function scopedAllUnits(actor: AuthUser, allUnits: ProductUnit[], allProducts: Product[]): ProductUnit[] {
  const merchantProductIds = new Set(scopedProductList(actor, allProducts).map(p => p.id))
  const inMerchant = allUnits.filter(u => merchantProductIds.has(u.productId))
  if (actor.role === 'branch_manager') return inMerchant.filter(u => u.branch === actor.branch)
  return inMerchant
}
