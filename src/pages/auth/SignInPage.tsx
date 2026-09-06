import { useState } from 'react'
import { Form, Input, Button, Alert, Typography, theme } from 'antd'
import { Mail, Lock } from 'lucide-react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { MOCK_USER_ACCOUNTS } from '../../constants/mockUsers'
import { homePath, toAuthUser } from '../../constants/roles'
import { AuthLayout } from './AuthLayout'

export function SignInPage() {
  const { status, user, login } = useAuth()
  const { token } = theme.useToken()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Role-aware — Super Admin's own home is Merchants, not Contracts (which
  // isn't applicable to their role at all). Covers both paths into this
  // page while already authenticated: landing here directly (below) and a
  // real form submission (handleSubmit, which looks the account up fresh
  // since `login`'s own result doesn't carry it and `user` from context
  // hasn't re-rendered with the new session yet at that point).
  if (status === 'signed_in') return <Navigate to={homePath(user!)} replace />
  if (status === 'must_set_password') return <Navigate to="/set-password" replace />

  function handleSubmit(values: { email: string; password: string }) {
    setError(null)
    setLoading(true)
    const result = login(values.email, values.password)
    setLoading(false)
    if (!result.ok) {
      setError(result.error ?? 'Unable to sign in.')
      return
    }
    const account = MOCK_USER_ACCOUNTS.find(a => a.email.toLowerCase() === values.email.trim().toLowerCase())
    const fallback = account ? homePath(toAuthUser(account)) : '/contracts'
    const redirectTo = (location.state as { from?: string } | null)?.from ?? fallback
    navigate(redirectTo, { replace: true })
  }

  return (
    <AuthLayout title="Sign in" subtitle="Sign in to your workspace">
      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

      <Form layout="vertical" onFinish={handleSubmit} requiredMark={false}>
        <Form.Item
          label="Email"
          name="email"
          rules={[{ required: true, message: 'Email is required' }, { type: 'email', message: 'Enter a valid email' }]}
        >
          <Input prefix={<Mail size={15} strokeWidth={2} />} placeholder="you@company.com" autoComplete="username" />
        </Form.Item>

        <Form.Item
          colon={false}
          label={
            <>
              <span>Password</span>
              <Typography.Text
                onClick={() => navigate('/forgot-password')}
                className="ifix-text-link"
                style={{ fontSize: 14, color: token.colorTextSecondary, cursor: 'pointer' }}
              >
                Forgot password?
              </Typography.Text>
            </>
          }
          name="password"
          rules={[{ required: true, message: 'Password is required' }]}
        >
          <Input.Password prefix={<Lock size={15} strokeWidth={2} />} placeholder="Password" autoComplete="current-password" />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Sign in
          </Button>
        </Form.Item>
      </Form>
    </AuthLayout>
  )
}
