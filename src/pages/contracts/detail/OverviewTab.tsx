import type { ReactNode } from 'react'
import { Typography, theme } from 'antd'
import type { Contract } from '../../../types/contract'
import { CurrencyDisplay } from '../../../components/CurrencyDisplay'
import { DetailDescriptions } from '../../../components/DetailDescriptions'
import { ContractStatusTag } from '../components/ContractStatusTag'

interface Props {
  contract: Contract
  actions: ReactNode
}

// Same page-header pattern as Products' OverviewTab: title/tags on the
// left, actions on the right, no card chrome (see that file for why —
// antd dropped PageHeader from core in v5+, so this reproduces its layout
// by hand). The contract number stands in for a "name" here.
export function OverviewTab({ contract, actions }: Props) {
  const { token } = theme.useToken()
  const { device, financing, template } = contract

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', rowGap: 8, alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Typography.Title level={4} style={{ margin: 0 }}>{contract.contractNumber}</Typography.Title>
          <ContractStatusTag status={contract.status} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>{actions}</div>
      </div>

      <DetailDescriptions
        items={[
          { key: 'branch', label: 'Branch', children: contract.branch },
          { key: 'template', label: 'Template', children: template.templateName },
          { key: 'device', label: 'Device', children: `${device.brand} ${device.model}${device.storage ? ` · ${device.storage}` : ''} · ${device.color}` },
          { key: 'condition', label: 'Condition', children: device.condition },
          { key: 'imei', label: 'IMEI', children: device.imei },
          { key: 'serial', label: 'Serial Number', children: device.serialNumber },
          { key: 'devicePrice', label: 'Device Price', children: <CurrencyDisplay amount={financing.devicePrice} /> },
          { key: 'downPayment', label: 'Down Payment', children: <>{financing.downPaymentPercent}% · <CurrencyDisplay amount={financing.downPaymentAmount} /></> },
          { key: 'rate', label: 'Rate', children: `${financing.ratePercent}% / month` },
          { key: 'term', label: 'Payment Term', children: `${financing.paymentTermMonths} months` },
          { key: 'installment', label: 'Installment Amount', children: <CurrencyDisplay amount={financing.installmentAmount} /> },
          { key: 'total', label: 'Total Contract Value', children: <CurrencyDisplay amount={financing.totalContractValue} /> },
        ]}
      />

      {contract.status === 'rejected' && contract.rejectionNote && (
        <div style={{ marginTop: 16, padding: 12, background: token.colorErrorBg, borderRadius: token.borderRadius }}>
          <Typography.Text strong style={{ color: token.colorError, display: 'block', marginBottom: 4 }}>Rejection Note</Typography.Text>
          <Typography.Text style={{ color: token.colorError }}>{contract.rejectionNote}</Typography.Text>
        </div>
      )}
    </div>
  )
}
