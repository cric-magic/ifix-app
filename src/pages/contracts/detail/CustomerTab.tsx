import { Typography, theme } from 'antd'
import type { CustomerSnapshot } from '../../../types/contract'
import { DetailDescriptions } from '../../../components/DetailDescriptions'

interface Props {
  customer: CustomerSnapshot
}

// Read-only — this is the contract's own snapshot (per the doc, taken at
// creation and never affected by later edits to the Customer record), and
// the Customer record itself has no edit UI yet in this prototype (Phase 2
// per the Customer doc).
export function CustomerTab({ customer }: Props) {
  const { token } = theme.useToken()

  return (
    <div className="ifix-table-panel" style={{ marginBottom: 16 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        height: 56,
        padding: '0 16px',
        boxShadow: `inset 0 -0.5px 0 0 ${token.colorBorderSecondary}`,
      }}>
        <Typography.Text strong style={{ fontSize: 15 }}>Customer</Typography.Text>
      </div>

      <div style={{ padding: 16 }}>
        <DetailDescriptions
          items={[
            { key: 'fullName', label: 'Full Name', children: customer.fullName },
            { key: 'nationalId', label: 'National ID / Passport', children: customer.nationalId },
            { key: 'phone', label: 'Phone', children: customer.phone },
            { key: 'dob', label: 'Date of Birth', children: customer.dateOfBirth },
            { key: 'email', label: 'Email', children: customer.email || <span style={{ color: token.colorTextDisabled }}>—</span> },
            { key: 'idCardAddress', label: "ID Card's Address", children: customer.idCardAddress, span: 2 },
            { key: 'currentAddress', label: 'Current Address', children: customer.currentAddress, span: 2 },
            ...(customer.workplaceAddress ? [{ key: 'workplaceAddress', label: 'Workplace Address', children: customer.workplaceAddress, span: 2 }] : []),
          ]}
        />
      </div>
    </div>
  )
}
