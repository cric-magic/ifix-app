import { Card, Col, Row, Statistic } from 'antd'
import type { InstallmentRecord } from '../../../types/installment'

const formatter = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 })

interface Props {
  records: InstallmentRecord[]
}

export function SummaryCards({ records }: Props) {
  const totalPaid = records.reduce((s, r) => s + r.paidAmount, 0)
  const totalDue = records.reduce((s, r) => s + r.dueAmount, 0)
  const totalOverdue = records.reduce((s, r) => s + r.overdueAmount, 0)
  const totalRemaining = records.reduce((s, r) => s + r.remainingBalance, 0)

  return (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Total Paid"
            value={formatter.format(totalPaid)}
            valueStyle={{ color: '#52c41a', fontSize: 18 }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Total Due"
            value={formatter.format(totalDue)}
            valueStyle={{ color: '#fa8c16', fontSize: 18 }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Total Overdue"
            value={formatter.format(totalOverdue)}
            valueStyle={{ color: '#ff4d4f', fontSize: 18 }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Remaining Balance"
            value={formatter.format(totalRemaining)}
            valueStyle={{ fontSize: 18 }}
          />
        </Card>
      </Col>
    </Row>
  )
}
