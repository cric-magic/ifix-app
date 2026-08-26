import { useState } from 'react'
import { Form, Input, Button, Alert } from 'antd'
import { Lock } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MOCK_USER_ACCOUNTS } from '../../constants/mockUsers'
import { AuthLayout } from './AuthLayout'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [done, setDone] = useState(false)

  const account = token ? MOCK_USER_ACCOUNTS.find(u => u.resetToken === token) : undefined
  const isExpired = account?.resetTokenExpiresAt != null && new Date(account.resetTokenExpiresAt).getTime() < Date.now()
  const isValid = !!account && !isExpired

  if (done) {
    return (
      <AuthLayout title="Password updated" subtitle="Your password has been reset.">
        <Button type="primary" block onClick={() => navigate('/sign-in')}>
          Continue to sign in
        </Button>
      </AuthLayout>
    )
  }

  if (!isValid) {
    return (
      <AuthLayout title="Reset link invalid">
        <Alert
          type="error"
          showIcon
          message="This reset link is invalid or has expired"
          description="Reset links are single-use and expire after 15 minutes. Request a new one to continue."
          style={{ marginBottom: 16 }}
        />
        <Button type="primary" block onClick={() => navigate('/forgot-password')}>
          Request a new link
        </Button>
      </AuthLayout>
    )
  }

  function handleSubmit(values: { password: string }) {
    if (!account) return
    account.password = values.password
    account.isTemporaryPassword = false
    account.resetToken = null
    account.resetTokenExpiresAt = null
    if (account.status === 'created') {
      account.status = 'active'
      account.activatedAt = new Date().toISOString()
    }
    setDone(true)
  }

  return (
    <AuthLayout title="Set a new password" subtitle={`Resetting password for ${account.name}`}>
      <Form layout="vertical" onFinish={handleSubmit} requiredMark={false}>
        <Form.Item
          label="New password"
          name="password"
          rules={[{ required: true, message: 'New password is required' }, { min: 8, message: 'At least 8 characters' }]}
          hasFeedback
        >
          <Input.Password prefix={<Lock size={15} strokeWidth={2} />} placeholder="New password" autoComplete="new-password" />
        </Form.Item>

        <Form.Item
          label="Confirm new password"
          name="confirm"
          dependencies={['password']}
          hasFeedback
          rules={[
            { required: true, message: 'Please confirm your new password' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) return Promise.resolve()
                return Promise.reject(new Error('Passwords do not match'))
              },
            }),
          ]}
        >
          <Input.Password prefix={<Lock size={15} strokeWidth={2} />} placeholder="Confirm new password" autoComplete="new-password" />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button type="primary" htmlType="submit" block>
            Set password &amp; continue
          </Button>
        </Form.Item>
      </Form>
    </AuthLayout>
  )
}
