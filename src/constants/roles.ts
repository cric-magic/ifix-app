import type { AuthUser, InstallmentRecord } from '../types/installment'

export const MOCK_USERS: AuthUser[] = [
  { id: 'admin-1',   name: 'Ake Somsak',      role: 'admin',  branch: 'Bangkok HQ'  },
  { id: 'admin-2',   name: 'Nida Pradit',      role: 'admin',  branch: 'Bangkok HQ'  },
  { id: 'retail-1',  name: 'Malee Jaidee',     role: 'retail', branch: 'Chiang Mai'  },
  { id: 'retail-2',  name: 'Krit Wongsa',      role: 'retail', branch: 'Phuket'      },
  { id: 'retail-3',  name: 'Fon Buranee',      role: 'retail', branch: 'Khon Kaen'   },
  { id: 'retail-4',  name: 'Tong Phimchan',    role: 'retail', branch: 'Bangkok HQ'  },
]

export const ADMIN_USER = MOCK_USERS[0]
export const RETAIL_USER = MOCK_USERS[2]

export function canEditInstallment(user: AuthUser, record: InstallmentRecord): boolean {
  if (user.role === 'admin') return true
  return record.branch === user.branch
}

export function canViewBranchFilter(user: AuthUser): boolean {
  return user.role === 'admin'
}

export function canConfigurePenalty(user: AuthUser): boolean {
  return user.role === 'admin'
}
