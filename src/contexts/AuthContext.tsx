import { createContext, useContext, useState } from 'react'
import type { AuthUser } from '../types/installment'
import { ADMIN_USER } from '../constants/roles'

interface AuthContextValue {
  user: AuthUser
  setUser: (user: AuthUser) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(ADMIN_USER)

  return <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
