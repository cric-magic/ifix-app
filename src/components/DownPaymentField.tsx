import { useState } from 'react'
import { Typography, theme } from 'antd'
import { InputNumber } from './AppInputNumber'

interface Props {
  // The down payment as a whole %, supplied by Form.Item or passed
  // directly (Price Check's quote).
  value?: number
  onChange?: (percent: number | undefined) => void
  devicePrice: number
  // The template's allowed range.
  min: number
  max: number
}

const thousands = (v: number | string | undefined) => `${v ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
const plain = (v: string | undefined) => Number((v ?? '').replace(/[^\d.]/g, ''))

// The down payment, by % or by amount — per the Contract doc's "adjust the
// down payment % (exact amounts round to a %)". Two linked fields: typing
// either fills the other. An amount is rounded to the nearest whole % (and
// kept inside the template's range) when it's committed, then shown as that
// % works out — so the % the contract stores and the ฿ it shows never
// disagree. Shared by the contract's Template & Terms step and Price Check.
export function DownPaymentField({ value, onChange, devicePrice, min, max }: Props) {
  const { token } = theme.useToken()
  // The amount while it's being typed, before it rounds to a %.
  const [amountDraft, setAmountDraft] = useState<number | null>(null)
  const amount = value != null ? Math.round(devicePrice * value / 100) : null

  function commitAmount() {
    if (amountDraft == null || !devicePrice) {
      setAmountDraft(null)
      return
    }
    const percent = Math.min(max, Math.max(min, Math.round(amountDraft / devicePrice * 100)))
    onChange?.(percent)
    setAmountDraft(null)
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <InputNumber
          aria-label="Down payment percent"
          style={{ width: '100%' }}
          value={value}
          min={min}
          max={max}
          precision={0}
          addonAfter="%"
          onChange={v => onChange?.(v == null ? undefined : Number(v))}
        />
        <InputNumber
          aria-label="Down payment amount"
          style={{ width: '100%' }}
          value={amountDraft ?? amount}
          min={0}
          max={devicePrice}
          addonBefore="฿"
          formatter={thousands}
          parser={plain}
          onChange={v => setAmountDraft(v == null ? null : Number(v))}
          onBlur={commitAmount}
          onPressEnter={commitAmount}
        />
      </div>
      <Typography.Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: token.fontSizeSM }}>
        {min}–{max}% for this template · an amount rounds to the nearest %
      </Typography.Text>
    </div>
  )
}
