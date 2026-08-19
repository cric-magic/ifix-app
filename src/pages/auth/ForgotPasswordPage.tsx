import { useState } from 'react'
import { Form, Input, Button, Alert, Typography } from 'antd'
import { Mail } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MOCK_USER_ACCOUNTS, generateTempPassword } from '../../constants/mockUsers'
import { AuthLayout } from './AuthLayout'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [submitted, setSubmitted] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)

  // Always show the same confirmation regardless of outcome — never reveal
  // whether an account exists for the entered email (avoids account probing).
  function handleSubmit(values: { email: string }) {
    const account = MOCK_USER_ACCOUNTS.find(u => u.email.toLowerCase() === values.email.trim().toLowerCase())
    if (account && account.status !== 'suspended') {
      const newTemp = generateTempPassword()
      account.password = newTemp
      account.isTemporaryPassword = true
      setTempPassword(newTemp)
    }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <AuthLayout title="Check your email" subtitle="If an account exists for that email, we've sent password reset instructions.">
        {tempPassword && (
          <Alert
            type="success"
            showIcon
            message="Temporary password generated"
            description={
              <div>
                <Typography.Text type="secondary">In a real environment this would be emailed to you. For this demo, use it directly:</Typography.Text>
                <div style={{ marginTop: 8 }}>
                  <Typography.Text code copyable style={{ fontSize: 15 }}>{tempPassword}</Typography.Text>
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
    <AuthLayout title="Forgot password" subtitle="Enter your email and we'll generate a temporary password">
      <Form layout="vertical" onFinish={handleSubmit} requiredMark={false}>
        <Form.Item
          label="Email"
          name="email"
          rules={[{ required: true, message: 'Email is required' }, { type: 'email', message: 'Enter a valid email' }]}
        >
          <Input prefix={<Mail size={15} strokeWidth={2} />} placeholder="you@company.com" autoComplete="username" />
        </Form.Item>

        <Form.Item style={{ marginBottom: 12 }}>
          <Button type="primary" htmlType="submit" block>
            Send temporary password
          </Button>
        </Form.Item>
      </Form>

      <Typography.Link onClick={() => navigate('/sign-in')} style={{ fontSize: 13 }}>
        Back to sign in
      </Typography.Link>
    </AuthLayout>
  )
}
