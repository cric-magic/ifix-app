import { useState } from 'react'
import {
  Card, Form, InputNumber, Radio, Button, Space, Table, Typography,
  Divider, message, Alert, Tag,
} from 'antd'
import { SaveOutlined, HistoryOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { PageHeader } from '../../components/PageHeader'
import { useAuth } from '../../contexts/AuthContext'
import {
  DEFAULT_PENALTY_RULE,
  MOCK_AUDIT_LOGS,
  type PenaltyRule,
  type PenaltyAuditLog,
} from '../../constants/penaltyMockData'

const auditColumns: ColumnsType<PenaltyAuditLog> = [
  { title: 'Date / Time', dataIndex: 'changedAt', key: 'changedAt', width: 180 },
  { title: 'Changed By', dataIndex: 'changedBy', key: 'changedBy' },
  { title: 'Field', dataIndex: 'field', key: 'field' },
  {
    title: 'Old Value',
    dataIndex: 'oldValue',
    key: 'oldValue',
    render: val => <Tag color="red">{val}</Tag>,
  },
  {
    title: 'New Value',
    dataIndex: 'newValue',
    key: 'newValue',
    render: val => <Tag color="green">{val}</Tag>,
  },
]

export function PenaltySettingsPage() {
  const { user } = useAuth()
  const [form] = Form.useForm<PenaltyRule>()
  const [penaltyType, setPenaltyType] = useState<PenaltyRule['type']>(DEFAULT_PENALTY_RULE.type)
  const [logs, setLogs] = useState(MOCK_AUDIT_LOGS)

  if (user.role !== 'admin') {
    return (
      <Alert
        type="error"
        message="Access Denied"
        description="Penalty settings are only accessible to Admin users."
        showIcon
      />
    )
  }

  function handleSave(values: PenaltyRule) {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const newLogs: PenaltyAuditLog[] = []

    if (values.type !== DEFAULT_PENALTY_RULE.type) {
      newLogs.push({
        id: `log-${Date.now()}-1`,
        changedBy: user.name,
        changedAt: now,
        field: 'Penalty Type',
        oldValue: DEFAULT_PENALTY_RULE.type === 'flat_fee' ? 'Flat Fee' : 'Percent Per Day',
        newValue: values.type === 'flat_fee' ? 'Flat Fee' : 'Percent Per Day',
      })
    }
    if (values.flatFeeAmount !== DEFAULT_PENALTY_RULE.flatFeeAmount) {
      newLogs.push({
        id: `log-${Date.now()}-2`,
        changedBy: user.name,
        changedAt: now,
        field: 'Flat Fee Amount',
        oldValue: `฿${DEFAULT_PENALTY_RULE.flatFeeAmount}`,
        newValue: `฿${values.flatFeeAmount}`,
      })
    }
    if (values.percentPerDay !== DEFAULT_PENALTY_RULE.percentPerDay) {
      newLogs.push({
        id: `log-${Date.now()}-3`,
        changedBy: user.name,
        changedAt: now,
        field: 'Percent Per Day',
        oldValue: `${DEFAULT_PENALTY_RULE.percentPerDay}%`,
        newValue: `${values.percentPerDay}%`,
      })
    }
    if (values.gracePeriodDays !== DEFAULT_PENALTY_RULE.gracePeriodDays) {
      newLogs.push({
        id: `log-${Date.now()}-4`,
        changedBy: user.name,
        changedAt: now,
        field: 'Grace Period',
        oldValue: `${DEFAULT_PENALTY_RULE.gracePeriodDays} days`,
        newValue: `${values.gracePeriodDays} days`,
      })
    }

    if (newLogs.length === 0) {
      message.info('No changes to save')
      return
    }

    setLogs(prev => [...newLogs, ...prev])
    message.success('Penalty settings saved')
  }

  return (
    <div>
      <PageHeader
        title="Penalty Settings"
        subtitle="Configure overdue penalty rules applied to installment contracts"
      />

      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        <Card title="Penalty Rule Configuration">
          <Form
            form={form}
            layout="vertical"
            initialValues={DEFAULT_PENALTY_RULE}
            onFinish={handleSave}
            style={{ maxWidth: 560 }}
          >
            <Form.Item label="Penalty Type" name="type">
              <Radio.Group onChange={e => setPenaltyType(e.target.value)}>
                <Space direction="vertical">
                  <Radio value="flat_fee">
                    <strong>Flat Fee</strong>
                    <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
                      Fixed amount charged per overdue installment
                    </Typography.Text>
                  </Radio>
                  <Radio value="percent_per_day">
                    <strong>Percent Per Day</strong>
                    <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
                      Daily percentage applied to the overdue balance
                    </Typography.Text>
                  </Radio>
                </Space>
              </Radio.Group>
            </Form.Item>

            {penaltyType === 'flat_fee' && (
              <Form.Item
                label="Flat Fee Amount (฿)"
                name="flatFeeAmount"
                rules={[{ required: true, message: 'Required' }]}
              >
                <InputNumber min={0} step={50} style={{ width: 200 }} addonBefore="฿" />
              </Form.Item>
            )}

            {penaltyType === 'percent_per_day' && (
              <Form.Item
                label="Percent Per Day (%)"
                name="percentPerDay"
                rules={[{ required: true, message: 'Required' }]}
              >
                <InputNumber min={0} max={100} step={0.1} precision={1} style={{ width: 200 }} addonAfter="%" />
              </Form.Item>
            )}

            <Form.Item
              label="Grace Period (days)"
              name="gracePeriodDays"
              help="Number of days after due date before penalty is applied"
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber min={0} max={30} style={{ width: 200 }} addonAfter="days" />
            </Form.Item>

            <Form.Item style={{ marginTop: 32 }}>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                Save Settings
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <Card title={<Space><HistoryOutlined /> Audit Log</Space>}>
          <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            All changes to penalty settings are recorded below.
          </Typography.Text>
          <Divider style={{ margin: '0 0 16px' }} />
          <Table
            rowKey="id"
            columns={auditColumns}
            dataSource={logs}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            bordered
          />
        </Card>
      </Space>
    </div>
  )
}
