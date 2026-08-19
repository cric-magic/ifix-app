import { Descriptions, theme } from 'antd'
import type { InstallmentRecord } from '../../../types/installment'
import { StatusBadge } from '../../../components/StatusBadge'
import { CurrencyDisplay } from '../../../components/CurrencyDisplay'

const formatter = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 })

interface Props {
  record: InstallmentRecord
}

export function OverviewTab({ record }: Props) {
  const { token } = theme.useToken()

  return (
    <Descriptions
      bordered
      column={{ xs: 1, sm: 2, lg: 2 }}
      items={[
        { label: 'Invoice Number', children: record.invoiceNumber },
        { label: 'Contract Number', children: record.contractNumber },
        { label: 'Branch', children: record.branch },
        { label: 'Contract Status', children: <StatusBadge status={record.contractStatus} /> },
        { label: 'Payment Status', children: <StatusBadge status={record.paymentStatus} /> },
        { label: 'Start Date', children: record.startDate },
        { label: 'End Date', children: record.endDate },
        { label: 'Total Amount', children: formatter.format(record.totalAmount) },
        { label: 'Paid Amount', children: <span style={{ color: token.colorSuccess }}>{formatter.format(record.paidAmount)}</span> },
        { label: 'Due Amount', children: <CurrencyDisplay amount={record.dueAmount} colored /> },
        { label: 'Overdue Amount', children: record.overdueAmount > 0 ? <span style={{ color: token.colorError }}>{formatter.format(record.overdueAmount)}</span> : '—' },
        { label: 'Remaining Balance', children: formatter.format(record.remainingBalance) },
      ]}
    />
  )
}
