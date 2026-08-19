import { Col, Row, Statistic, theme } from 'antd'
import type { InstallmentRecord } from '../../../types/installment'

const formatter = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 })

interface Props {
  records: InstallmentRecord[]
}

export function SummaryCards({ records }: Props) {
  const { token } = theme.useToken()
  const totalPaid = records.reduce((s, r) => s + r.paidAmount, 0)
  const totalDue = records.reduce((s, r) => s + r.dueAmount, 0)
  const totalOverdue = records.reduce((s, r) => s + r.overdueAmount, 0)
  const totalRemaining = records.reduce((s, r) => s + r.remainingBalance, 0)

  return (
    <Row gutter={32} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12} lg={6}>
        <Statistic title="Total Paid" value={formatter.format(totalPaid)} valueStyle={{ color: token.colorText, fontSize: 18 }} />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Statistic title="Total Due" value={formatter.format(totalDue)} valueStyle={{ color: token.colorText, fontSize: 18 }} />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Statistic title="Total Overdue" value={formatter.format(totalOverdue)} valueStyle={{ color: token.colorText, fontSize: 18 }} />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Statistic title="Remaining Balance" value={formatter.format(totalRemaining)} valueStyle={{ color: token.colorText, fontSize: 18 }} />
      </Col>
    </Row>
  )
}
