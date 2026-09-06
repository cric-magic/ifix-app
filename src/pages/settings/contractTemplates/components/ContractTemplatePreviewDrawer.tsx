import { Drawer, Divider, Typography, theme } from 'antd'
import { useAppWindowContainer } from '../../../../contexts/AppWindowContext'
import { useCurrentUser } from '../../../../contexts/AuthContext'
import { MOCK_MERCHANTS } from '../../../../constants/mockMerchants'
import { CurrencyDisplay } from '../../../../components/CurrencyDisplay'
import { calcFixRate } from '../../../../utils/calculator'

interface PreviewValues {
  title?: string
  bindingStatement?: string
  legalDeclarations?: string
  type?: 'fixed_rate' | 'free_rate'
  fixedRateTerms?: { months: number; ratePercent: number }[]
  maxLoanAmount?: number
}

interface Props {
  open: boolean
  onClose: () => void
  values: PreviewValues
}

// Sample device/customer/financial values, per the doc's "Sample values are
// used when no contract has been created yet" — this drawer previews the
// live form values (title/statement/declarations/rate) laid over the same
// fixed sample numbers every time, updating as the form changes.
const SAMPLE_DEVICE_PRICE = 25900

export function ContractTemplatePreviewDrawer({ open, onClose, values }: Props) {
  const { token } = theme.useToken()
  const appWindow = useAppWindowContainer()
  const actor = useCurrentUser()
  const merchant = MOCK_MERCHANTS.find(m => m.id === actor.merchantId)

  const term = values.fixedRateTerms?.[0] ?? { months: 12, ratePercent: 1.75 }
  const downPaymentAmount = Math.round(SAMPLE_DEVICE_PRICE * 0.2)
  const loanAmount = SAMPLE_DEVICE_PRICE - downPaymentAmount
  const calc = calcFixRate(loanAmount, term.ratePercent, term.months)

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Template preview"
      width={480}
      destroyOnHidden
      getContainer={appWindow ?? undefined}
    >
      <div style={{
        padding: 24,
        background: token.colorBgElevated,
        border: `0.5px solid ${token.colorBorderSecondary}`,
        borderRadius: token.borderRadius,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Typography.Title level={4} style={{ margin: 0 }}>{values.title || 'Untitled Template'}</Typography.Title>
          <Typography.Text type="secondary">{merchant?.name} · Sample Preview</Typography.Text>
        </div>

        <Divider />

        <Typography.Paragraph style={{ fontStyle: 'italic', color: token.colorTextSecondary }}>
          {values.bindingStatement || <span style={{ color: token.colorTextDisabled }}>No binding statement yet.</span>}
        </Typography.Paragraph>

        <Divider />

        <Typography.Title level={5}>สรุปข้อมูลทางการเงิน · Contract Financial Summary</Typography.Title>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
          <Typography.Text type="secondary">ราคาสินค้า: <CurrencyDisplay amount={SAMPLE_DEVICE_PRICE} /></Typography.Text>
          <Typography.Text type="secondary">ชำระงวดแรก: <CurrencyDisplay amount={downPaymentAmount} /> (20%)</Typography.Text>
          <Typography.Text type="secondary">แบ่งจ่ายเดือนละ: <CurrencyDisplay amount={calc.monthlyInstallment} /></Typography.Text>
          <Typography.Text type="secondary">จำนวนเดือน: {term.months} เดือน{values.type === 'fixed_rate' ? ` (${term.ratePercent}%/mo)` : ''}</Typography.Text>
        </div>

        <Typography.Paragraph style={{ fontSize: 12, color: token.colorTextTertiary }}>
          {values.legalDeclarations || <span style={{ color: token.colorTextDisabled }}>No legal declarations yet.</span>}
        </Typography.Paragraph>

        <Divider />

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
          <div style={{ textAlign: 'center', width: '40%' }}>
            <div style={{ borderTop: `0.5px solid ${token.colorBorderSecondary}`, paddingTop: 8 }}>
              <Typography.Text type="secondary">(Sample Customer)<br />ผู้เช่าซื้อ</Typography.Text>
            </div>
          </div>
          <div style={{ textAlign: 'center', width: '40%' }}>
            <div style={{ borderTop: `0.5px solid ${token.colorBorderSecondary}`, paddingTop: 8 }}>
              <Typography.Text type="secondary">({merchant?.name})<br />ผู้ให้เช่าซื้อ</Typography.Text>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  )
}
