import { Button, Card, Descriptions, Divider, message, Space, Typography } from 'antd'
import { PrinterOutlined, DownloadOutlined } from '@ant-design/icons'
import type { InstallmentRecord } from '../../../types/installment'
import type { CustomerInfo } from '../../../types/installment'

const formatter = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 })

interface Props {
  record: InstallmentRecord
  customer: CustomerInfo
}

export function ContractPreviewTab({ record, customer }: Props) {
  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
          Print
        </Button>
        <Button icon={<DownloadOutlined />} onClick={() => message.info('PDF export coming soon')}>
          Download PDF
        </Button>
      </Space>

      <Card style={{ maxWidth: 720, margin: '0 auto', border: '1px solid #d9d9d9' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            iFix Installment Contract
          </Typography.Title>
          <Typography.Text type="secondary">{record.invoiceNumber}</Typography.Text>
        </div>

        <Divider />

        <Typography.Title level={5}>Customer Information</Typography.Title>
        <Descriptions column={2} size="small" items={[
          { label: 'Full Name', children: customer.name },
          { label: 'ID Card', children: customer.idCardNumber },
          { label: 'Phone', children: customer.phone },
          { label: 'Occupation', children: customer.occupation },
          { label: 'Address', children: customer.address, span: 2 },
        ]} />

        <Divider />

        <Typography.Title level={5}>Contract Terms</Typography.Title>
        <Descriptions column={2} size="small" items={[
          { label: 'Contract No.', children: record.contractNumber },
          { label: 'Branch', children: record.branch },
          { label: 'Start Date', children: record.startDate },
          { label: 'End Date', children: record.endDate },
          { label: 'Total Amount', children: formatter.format(record.totalAmount) },
          { label: 'Remaining Balance', children: formatter.format(record.remainingBalance) },
        ]} />

        <Divider />

        <div style={{ marginTop: 48, display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'center', width: '40%' }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: 8 }}>
              <Typography.Text>Customer Signature</Typography.Text>
            </div>
          </div>
          <div style={{ textAlign: 'center', width: '40%' }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: 8 }}>
              <Typography.Text>Authorized Signature</Typography.Text>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
