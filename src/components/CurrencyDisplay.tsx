const formatter = new Intl.NumberFormat('th-TH', {
  style: 'currency',
  currency: 'THB',
  minimumFractionDigits: 0,
})

interface Props {
  amount: number
  colored?: boolean
}

export function CurrencyDisplay({ amount, colored }: Props) {
  const color = colored ? (amount > 0 ? '#52c41a' : amount < 0 ? '#ff4d4f' : undefined) : undefined
  return <span style={{ color }}>{formatter.format(amount)}</span>
}
