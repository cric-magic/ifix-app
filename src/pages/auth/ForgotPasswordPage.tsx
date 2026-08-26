import { useState } from 'react'
import { Form, Input, Button, Alert, Typography, theme } from 'antd'
import { Mail } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { MOCK_USER_ACCOUNTS, generateResetToken, RESET_TOKEN_TTL_MS } from '../../constants/mockUsers'
import { AuthLayout } from './AuthLayout'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { token: designToken } = theme.useToken()
  const [submitted, setSubmitted] = useState(false)
  const [resetPath, setResetPath] = useState<string | null>(null)

  // Always show the same confirmation regardless of outcome — never reveal
  // whether an account exists for the entered email (avoids account probing).
  function handleSubmit(values: { email: string }) {
    const account = MOCK_USER_ACCOUNTS.find(u => u.email.toLowerCase() === values.email.trim().toLowerCase())
    if (account && account.status !== 'suspended') {
      const token = generateResetToken()
      account.resetToken = token
      account.resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString()
      setResetPath(`/reset-password?token=${token}`)
    }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <AuthLayout title="Check your email" subtitle="If an account exists for that email, we've sent a link to reset your password.">
        {resetPath && (
          <Alert
            type="success"
            showIcon
            message="Reset link generated"
            description={
              <div>
                <Typography.Text type="secondary">In a real environment this link would be emailed to you. For this demo, use it directly — it expires in 15 minutes and works once:</Typography.Text>
                <div style={{ marginTop: 8 }}>
                  <Link to={resetPath} style={{ fontSize: 13, wordBreak: 'break-all', color: designToken.colorPrimary }}>{`${window.location.origin}${resetPath}`}</Link>
                </div>
              </div>
            }
            style={{ marginBottom: 16 }}
          />
        )}
        <Button type="primary" block onClick={() => navigate('/sign-in')}>
          Back to sign in
        </Button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Forgot password" subtitle="Enter your email and we'll send you a link to reset your password">
      <Form layout="vertical" onFinish={handleSubmit} requiredMark={false}>
        <Form.Item
          label="Email"
          name="email"
          rules={[{ required: true, message: 'Email is required' }, { type: 'email', message: 'Enter a valid email' }]}
        >
          <Input prefix={<Mail size={15} strokeWidth={2} />} placeholder="you@company.com" autoComplete="username" />
        </Form.Item>

        <Form.Item style={{ marginBottom: 8 }}>
          <Button type="primary" htmlType="submit" block>
            Send reset link
          </Button>
        </Form.Item>
      </Form>

      <Button type="text" block onClick={() => navigate('/sign-in')}>
        Back to sign in
      </Button>
    </AuthLayout>
  )
}
