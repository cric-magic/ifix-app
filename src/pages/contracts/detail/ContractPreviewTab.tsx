import { Button, Divider, Space, Typography, message, theme } from 'antd'
import { Printer, Download } from 'lucide-react'
import type { Contract } from '../../../types/contract'
import { MOCK_MERCHANTS } from '../../../constants/mockMerchants'
import { CurrencyDisplay } from '../../../components/CurrencyDisplay'

interface Props {
  contract: Contract
}

// Printed contract layout, per the Contract Template doc's "Contract
// Content Template" — merchant header, lessor/lessee block, the template's
// own binding statement/legal declarations (read from the contract's
// snapshot, not a live template — see types/contract.ts's TemplateSnapshot),
// asset spec, financial summary, and the installment schedule.
export function ContractPreviewTab({ contract }: Props) {
  const { token } = theme.useToken()
  const merchant = MOCK_MERCHANTS.find(m => m.id === contract.merchantId)
  const { device, customer, template, financing } = contract

  return (
    <div className="ifix-table-panel" style={{ marginBottom: 16 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        padding: '0 8px 0 16px',
        boxShadow: `inset 0 -0.5px 0 0 ${token.colorBorderSecondary}`,
      }}>
        <Typography.Text strong style={{ fontSize: 15 }}>Contract Preview</Typography.Text>
        <Space size={4} style={{ paddingRight: 2 }}>
          <Button icon={<Printer size={16} strokeWidth={2.25} />} onClick={() => window.print()}>Print</Button>
          <Button icon={<Download size={16} strokeWidth={2.25} />} onClick={() => message.info('PDF export coming soon')}>Download PDF</Button>
        </Space>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: 24,
          background: token.colorBgElevated,
          border: `0.5px solid ${token.colorBorderSecondary}`,
          borderRadius: token.borderRadius,
        }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <Typography.Title level={4} style={{ margin: 0 }}>{template.title}</Typography.Title>
            <Typography.Text type="secondary">
              {merchant?.name} ({contract.branch}) · {contract.contractNumber}
            </Typography.Text>
          </div>

          <Divider />

          <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <Typography.Text strong style={{ display: 'block', marginBottom: 4 }}>LESSOR</Typography.Text>
              <Typography.Text type="secondary" style={{ display: 'block' }}>{merchant?.name} ({contract.branch})</Typography.Text>
              <Typography.Text type="secondary" style={{ display: 'block' }}>{merchant?.address}</Typography.Text>
            </div>
            <div style={{ flex: 1 }}>
              <Typography.Text strong style={{ display: 'block', marginBottom: 4 }}>LESSEE</Typography.Text>
              <Typography.Text type="secondary" style={{ display: 'block' }}>{customer.fullName}</Typography.Text>
              <Typography.Text type="secondary" style={{ display: 'block' }}>{customer.nationalId} · {customer.phone}</Typography.Text>
            </div>
          </div>

          <Typography.Paragraph style={{ fontStyle: 'italic', color: token.colorTextSecondary }}>
            {template.bindingStatement}
          </Typography.Paragraph>

          <Divider />

          <Typography.Title level={5}>Asset Specification</Typography.Title>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
            <Typography.Text type="secondary">Brand: {device.brand}</Typography.Text>
            <Typography.Text type="secondary">Model: {device.model}</Typography.Text>
            <Typography.Text type="secondary">Condition: {device.condition}</Typography.Text>
            <Typography.Text type="secondary">Color: {device.color}</Typography.Text>
            <Typography.Text type="secondary">IMEI: {device.imei}</Typography.Text>
            <Typography.Text type="secondary">Serial: {device.serialNumber}</Typography.Text>
          </div>

          <Typography.Title level={5}>Contract Financial Summary</Typography.Title>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
            <Typography.Text type="secondary">Device Price: <CurrencyDisplay amount={financing.devicePrice} /></Typography.Text>
            <Typography.Text type="secondary">Down Payment: <CurrencyDisplay amount={financing.downPaymentAmount} /> ({financing.downPaymentPercent}%)</Typography.Text>
            <Typography.Text type="secondary">Monthly Installment: <CurrencyDisplay amount={financing.installmentAmount} /></Typography.Text>
            <Typography.Text type="secondary">Term: {financing.paymentTermMonths} months</Typography.Text>
          </div>

          <Typography.Paragraph style={{ fontSize: 12, color: token.colorTextTertiary }}>
            {template.legalDeclarations}
          </Typography.Paragraph>

          {template.penalty.legalText && (
            <Typography.Paragraph style={{ fontSize: 12, color: token.colorTextTertiary }}>
              {template.penalty.legalText}
            </Typography.Paragraph>
          )}

          <Divider />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
            <div style={{ textAlign: 'center', width: '40%' }}>
              <div style={{ borderTop: `0.5px solid ${token.colorBorderSecondary}`, paddingTop: 8 }}>
                <Typography.Text type="secondary">({customer.fullName})<br />Lessee</Typography.Text>
              </div>
            </div>
            <div style={{ textAlign: 'center', width: '40%' }}>
              <div style={{ borderTop: `0.5px solid ${token.colorBorderSecondary}`, paddingTop: 8 }}>
                <Typography.Text type="secondary">({merchant?.name})<br />Lessor</Typography.Text>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
