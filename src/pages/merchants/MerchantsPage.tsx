import { Building2 } from 'lucide-react'
import { Alert } from 'antd'
import { PlaceholderPage } from '../../components/PlaceholderPage'
import { useCurrentUser } from '../../contexts/AuthContext'

export function MerchantsPage() {
  const user = useCurrentUser()

  if (user.role !== 'super_admin') {
    return (
      <Alert
        type="error"
        message="Access Denied"
        description="Merchants is only accessible to Super Admin."
        showIcon
      />
    )
  }

  return <PlaceholderPage icon={<Building2 size={26} strokeWidth={2} />} title="Merchants" />
}
