import { Form, Input, Button, Alert, Typography, theme } from 'antd'
import { Lock } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { AuthLayout } from './AuthLayout'

export function SetPasswordPage() {
  const { status, pendingAccount, setNewPassword, logout } = useAuth()
  const navigate = useNavigate()
  const { token } = theme.useToken()

  if (status === 'signed_out') return <Navigate to="/sign-in" replace />
  if (status === 'signed_in') return <Navigate to="/contracts" replace />

  function handleSubmit(values: { password: string }) {
    setNewPassword(values.password)
    navigate('/contracts', { replace: true })
  }

  function handleSignOut() {
    logout()
    navigate('/sign-in', { replace: true })
  }

  const isFirstActivation = pendingAccount?.status === 'created'

  return (
    <AuthLayout
      title="Set a new password"
      subtitle={isFirstActivation
        ? 'This is your first sign-in. Set a new password to activate your account.'
        : 'Your password was reset. Set a new password to continue.'}
    >
      <Alert
        type="info"
        showIcon
        message={`Signed in as ${pendingAccount?.name}`}
        style={{ marginBottom: 8 }}
      />

      {/* Forces the password change (no way to skip into the app with the
          temp password still active) but still gives an exit — otherwise a
          user who isn't ready to pick a password right now is just stuck on
          this screen with no way out. Styled like SignInPage's "Forgot
          password?" link (plain text, no button chrome) so it doesn't
          compete with the primary action below. */}
      <Typography.Text
        onClick={handleSignOut}
        className="ifix-text-link"
        style={{ display: 'block', fontSize: 14, color: token.colorTextSecondary, cursor: 'pointer', marginBottom: 16 }}
      >
        Not you? Sign out
      </Typography.Text>

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
