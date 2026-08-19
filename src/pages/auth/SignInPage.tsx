import { useState } from 'react'
import { Form, Input, Button, Alert, Typography, theme } from 'antd'
import { Mail, Lock } from 'lucide-react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { AuthLayout } from './AuthLayout'

export function SignInPage() {
  const { status, login } = useAuth()
  const { token } = theme.useToken()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (status === 'signed_in') return <Navigate to="/contracts" replace />
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
    const redirectTo = (location.state as { from?: string } | null)?.from ?? '/contracts'
    navigate(redirectTo, { replace: true })
  }

  return (
    <AuthLayout title="Sign in" subtitle="Sign in to your iFix workspace">
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
