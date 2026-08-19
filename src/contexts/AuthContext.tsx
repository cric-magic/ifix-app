import { createContext, useContext, useState } from 'react'
import type { AuthUser } from '../types/installment'
import type { UserAccount } from '../types/user'
import { MOCK_USER_ACCOUNTS } from '../constants/mockUsers'
import { toAuthUser } from '../constants/roles'

type AuthState =
  | { status: 'signed_out' }
  | { status: 'must_set_password'; account: UserAccount }
  | { status: 'signed_in'; account: UserAccount }

interface LoginResult {
  ok: boolean
  error?: string
}

interface AuthContextValue {
  status: AuthState['status']
  user: AuthUser | null
  pendingAccount: UserAccount | null
  login: (email: string, password: string) => LoginResult
  logout: () => void
  setNewPassword: (newPassword: string) => void
  devSetUser: (account: UserAccount) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'signed_out' })

  function login(email: string, password: string): LoginResult {
    const account = MOCK_USER_ACCOUNTS.find(u => u.email.toLowerCase() === email.trim().toLowerCase())
    if (!account || account.password !== password) {
      return { ok: false, error: 'Invalid email or password.' }
    }
    if (account.status === 'suspended') {
      return { ok: false, error: 'This account has been suspended. Contact your administrator.' }
    }
    if (account.isTemporaryPassword) {
      setState({ status: 'must_set_password', account })
      return { ok: true }
    }
    setState({ status: 'signed_in', account })
    return { ok: true }
  }

  function setNewPassword(newPassword: string) {
    if (state.status !== 'must_set_password') return
    const account = state.account
    account.password = newPassword
    account.isTemporaryPassword = false
    if (account.status === 'created') {
      account.status = 'active'
      account.activatedAt = new Date().toISOString()
    }
    setState({ status: 'signed_in', account })
  }

  function logout() {
    setState({ status: 'signed_out' })
  }

  function devSetUser(account: UserAccount) {
    setState({ status: 'signed_in', account })
  }

  const user = state.status === 'signed_in' ? toAuthUser(state.account) : null
  const pendingAccount = state.status === 'must_set_password' ? state.account : null

  return (
    <AuthContext.Provider value={{ status: state.status, user, pendingAccount, login, logout, setNewPassword, devSetUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

// For use inside routes already gated by RequireAuth — guarantees a non-null user.
export function useCurrentUser(): AuthUser {
  const { user } = useAuth()
  if (!user) throw new Error('useCurrentUser must be used within an authenticated route')
  return user
}
