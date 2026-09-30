import { useEffect, useState } from 'react'
import { Segmented, Typography, theme } from 'antd'
import { InputNumber } from './AppInputNumber'
import { useIsMobile } from './useIsMobile'

interface Props {
  // The monthly rate, %, supplied by Form.Item or passed directly (Price
  // Check's quote). Always a rate — what the contract stores — however it
  // was entered.
  value?: number
  onChange?: (ratePercent: number | undefined) => void
  // What the rate applies to: the device price less the down payment, over
  // the chosen term.
  loanAmount: number
  months?: number
}

type Mode = 'rate' | 'profit'

const thousands = (v: number | string | undefined) => `${v ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
const plain = (v: string | undefined) => Number((v ?? '').replace(/[^\d.]/g, ''))
const baht = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 })

// A Free Rate template's interest, per the Contract doc: "set interest by
// rate or by desired profit". By rate: a monthly %. By profit: the ฿ the
// merchant wants to make, turned into the monthly rate that earns it on
// this loan and term (flat interest, the same as calcFixRate: loan × rate ×
// months). Either way the other figure shows underneath. In profit mode the
// profit is what's held: change the down payment or the term and the rate
// follows. Shared by the contract's Template & Terms step and Price Check.
export function InterestField({ value, onChange, loanAmount, months }: Props) {
  const { token } = theme.useToken()
  const isMobile = useIsMobile()
  const [mode, setMode] = useState<Mode>('rate')
  const [profit, setProfit] = useState<number | null>(null)

  const canConvert = loanAmount > 0 && !!months
  const rateFor = (p: number) => Math.round(p / (loanAmount * months!) * 100 * 100) / 100
  const profitFor = (rate: number) => Math.round(loanAmount * rate / 100 * months!)

  // Profit mode holds the profit: when the loan or term moves, the rate
  // that earns it moves with them.
  useEffect(() => {
    if (mode === 'profit' && profit != null && canConvert) onChange?.(rateFor(profit))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loanAmount, months])

  function switchMode(next: Mode) {
    if (next === 'profit') setProfit(value != null && canConvert ? profitFor(value) : null)
    setMode(next)
  }

  return (
    <div>
      {/* On its own line above the field, full size — the same as Select
          Device's "Browse by model / Search by IMEI" switch. */}
      <div style={{ marginBottom: 8 }}>
        <Segmented<Mode>
          block={isMobile}
          value={mode}
          onChange={switchMode}
          options={[{ value: 'rate', label: 'By rate' }, { value: 'profit', label: 'By profit' }]}
        />
      </div>
      {/* A grid cell, so the field stretches the full width — antd's
          InputNumber with an addon otherwise shrinks to its content. */}
      <div style={{ display: 'grid' }}>
      {mode === 'rate' ? (
        <InputNumber
          aria-label="Interest rate per month"
          style={{ width: '100%' }}
          value={value}
          min={0}
          step={0.1}
          precision={2}
          addonAfter="%/mo"
          placeholder="Enter a rate"
          onChange={v => onChange?.(v == null ? undefined : Number(v))}
        />
      ) : (
        <InputNumber
          aria-label="Desired profit"
          style={{ width: '100%' }}
          value={profit}
          min={0}
          addonBefore="฿"
          formatter={thousands}
          parser={plain}
          placeholder="Profit over the term"
          onChange={v => {
            const p = v == null ? null : Number(v)
            setProfit(p)
            onChange?.(p != null && canConvert ? rateFor(p) : undefined)
          }}
        />
      )}
      </div>
      {value != null && canConvert && (
        <Typography.Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: token.fontSizeSM }}>
          {mode === 'rate'
            ? `${baht.format(profitFor(value))} profit over ${months} months`
            : `${value}% per month — ${baht.format(profitFor(value))} after rounding`}
        </Typography.Text>
      )}
    </div>
  )
}
