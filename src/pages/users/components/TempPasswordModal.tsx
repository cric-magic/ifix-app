import { Drawer, Button, Typography, Alert } from 'antd'
import { useAppWindowContainer } from '../../../contexts/AppWindowContext'

interface Props {
  open: boolean
  userName: string
  tempPassword: string
  onClose: () => void
}

export function TempPasswordModal({ open, userName, tempPassword, onClose }: Props) {
  const appWindow = useAppWindowContainer()
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Temporary password"
      width={420}
      getContainer={appWindow ?? undefined}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="primary" onClick={onClose}>Done</Button>
        </div>
      }
    >
      <Alert
        type="info"
        showIcon
        message={`A temporary password was generated for ${userName}`}
        description="Share this with the user through a secure channel. They will be required to set a new password on next sign-in."
        style={{ marginBottom: 16 }}
      />
      <Typography.Text code copyable style={{ fontSize: 16 }}>{tempPassword}</Typography.Text>
    </Drawer>
  )
}
