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
