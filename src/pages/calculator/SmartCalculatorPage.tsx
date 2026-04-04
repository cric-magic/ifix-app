import { useState } from 'react'
import {
  Card, Tabs, Form, Select, InputNumber, Button, Table, Space,
  Statistic, Row, Col, Switch, Typography, Divider, Alert,
} from 'antd'
import { ArrowRightOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { MOCK_PRODUCTS, FLAT_RATES } from '../../constants/mockData'
import { calcFixRate, calcEasyMode } from '../../utils/calculator'
import { PageHeader } from '../../components/PageHeader'
import type { ScheduleResult } from '../../types/installment'

const PERIODS = [3, 6, 9, 12, 18, 24]
const THB = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 })

const scheduleColumns = (showInterest: boolean): ColumnsType<ScheduleResult['schedule'][0]> => [
  { title: '#', dataIndex: 'period', key: 'period', width: 50 },
  { title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate' },
  {
    title: showInterest ? 'Installment (incl. interest)' : 'Installment',
    dataIndex: 'amount',
    key: 'amount',
    align: 'right',
    render: val => THB.format(val),
  },
]

export function SmartCalculatorPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isManager = user.role === 'admin'
  const [showInterest, setShowInterest] = useState(true)
  const [fixResult, setFixResult] = useState<ScheduleResult | null>(null)
  const [easyResult, setEasyResult] = useState<ScheduleResult | null>(null)
  const [fixForm] = Form.useForm()
  const [easyForm] = Form.useForm()

  // When product selected in Fix Rate, pre-fill price
  function onProductSelect(productId: string) {
    const product = MOCK_PRODUCTS.find(p => p.id === productId)
    if (product) {
      fixForm.setFieldsValue({ price: product.price })
      setFixResult(null)
    }
  }

  function onFixCalc(values: { productId: string; price: number; periods: number; flatRate: number }) {
    setFixResult(calcFixRate(values.price, values.flatRate, values.periods))
  }

  function onEasyCalc(values: { sellingPrice: number; downPayment: number; periods: number }) {
    setEasyResult(calcEasyMode(values.sellingPrice, values.downPayment, values.periods))
  }

  function goToCreateContract(result: ScheduleResult, fromFix: boolean) {
    const vals = fromFix ? fixForm.getFieldsValue() : easyForm.getFieldsValue()
    const params = new URLSearchParams({
      productId: vals.productId ?? '',
      price: String(vals.price ?? vals.sellingPrice ?? ''),
      downPayment: String(fromFix ? 0 : (vals.downPayment ?? 0)),
      periods: String(vals.periods),
      flatRate: String(result.flatRatePercent),
      monthly: String(result.monthlyInstallment),
      totalPayable: String(result.totalPayable),
    })
    navigate(`/contracts/new?${params.toString()}`)
  }

  const ResultCards = ({ result }: { result: ScheduleResult }) => (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic title="Monthly Installment" value={THB.format(result.monthlyInstallment)} valueStyle={{ color: '#1677ff', fontSize: 20 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Total Payable" value={THB.format(result.totalPayable)} valueStyle={{ fontSize: 20 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title={showInterest ? 'Total Interest' : 'Interest (hidden)'}
              value={showInterest ? THB.format(result.totalInterest) : '—'}
              valueStyle={{ color: '#fa8c16', fontSize: 20 }}
            />
          </Card>
        </Col>
      </Row>
      <Table
        rowKey="period"
        size="small"
        columns={scheduleColumns(showInterest)}
        dataSource={result.schedule}
        pagination={false}
        bordered
        style={{ marginBottom: 16 }}
      />
    </div>
  )

  return (
    <div>
      <PageHeader
        title="Smart Calculator"
        subtitle="Calculate installment schedules before creating a contract"
        actions={
          isManager && (
            <Space>
              <Typography.Text type="secondary">Show Interest on Contract</Typography.Text>
              <Switch checked={showInterest} onChange={setShowInterest} />
            </Space>
          )
        }
      />

      <Card>
        <Tabs
          defaultActiveKey="fix"
          items={[
            {
              key: 'fix',
              label: 'Fix Rate Mode',
              children: (
                <div>
                  <Form
                    form={fixForm}
                    layout="vertical"
                    onFinish={onFixCalc}
                    style={{ maxWidth: 640 }}
                  >
                    <Row gutter={16}>
                      <Col span={16}>
                        <Form.Item label="Product" name="productId" rules={[{ required: true, message: 'Select a product' }]}>
                          <Select
                            showSearch
                            placeholder="Select product"
                            optionFilterProp="label"
                            onChange={onProductSelect}
                            options={MOCK_PRODUCTS.map(p => ({
                              value: p.id,
                              label: `${p.brand} ${p.name} (${p.storage})`,
                            }))}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="Product Price (฿)" name="price" rules={[{ required: true, message: 'Required' }]}>
                          <InputNumber style={{ width: '100%' }} min={0} step={100} addonBefore="฿" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item label="Installments" name="periods" rules={[{ required: true, message: 'Required' }]}>
                          <Select
                            placeholder="Select"
                            options={PERIODS.map(p => ({ value: p, label: `${p} months` }))}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="Flat Rate (%/month)" name="flatRate" rules={[{ required: true, message: 'Required' }]}>
                          <Select
                            placeholder="Select rate"
                            options={FLAT_RATES.map(r => ({ value: r, label: `${r}%` }))}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8} style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <Form.Item style={{ width: '100%' }}>
                          <Button type="primary" htmlType="submit" block onClick={() => setFixResult(null)}>
                            Calculate
                          </Button>
                        </Form.Item>
                      </Col>
                    </Row>
                  </Form>

                  {fixResult && (
                    <>
                      <Divider />
                      <ResultCards result={fixResult} />
                      <Button
                        type="primary"
                        icon={<ArrowRightOutlined />}
                        onClick={() => goToCreateContract(fixResult, true)}
                      >
                        Create Contract
                      </Button>
                    </>
                  )}
                </div>
              ),
            },
            ...(isManager
              ? [
                  {
                    key: 'easy',
                    label: 'Easy Mode',
                    children: (
                      <div>
                        <Alert
                          type="info"
                          message="Enter the desired selling price and down payment — the system will reverse-calculate the installment amount and implied interest rate."
                          style={{ marginBottom: 16 }}
                          showIcon
                        />
                        <Form
                          form={easyForm}
                          layout="vertical"
                          onFinish={onEasyCalc}
                          style={{ maxWidth: 480 }}
                        >
                          <Form.Item label="Desired Selling Price (฿)" name="sellingPrice" rules={[{ required: true, message: 'Required' }]}>
                            <InputNumber style={{ width: '100%' }} min={0} step={100} addonBefore="฿" />
                          </Form.Item>
                          <Form.Item label="Down Payment (฿)" name="downPayment" initialValue={0}>
                            <InputNumber style={{ width: '100%' }} min={0} step={100} addonBefore="฿" />
                          </Form.Item>
                          <Form.Item label="Number of Installments" name="periods" rules={[{ required: true, message: 'Required' }]}>
                            <Select
                              placeholder="Select"
                              options={PERIODS.map(p => ({ value: p, label: `${p} months` }))}
                            />
                          </Form.Item>
                          <Form.Item>
                            <Button type="primary" htmlType="submit" onClick={() => setEasyResult(null)}>
                              Calculate
                            </Button>
                          </Form.Item>
                        </Form>

                        {easyResult && (
                          <>
                            <Divider />
                            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                              Implied flat rate: <strong>{easyResult.flatRatePercent}%/month</strong>
                            </Typography.Text>
                            <ResultCards result={easyResult} />
                            <Button
                              type="primary"
                              icon={<ArrowRightOutlined />}
                              onClick={() => goToCreateContract(easyResult, false)}
                            >
                              Create Contract
                            </Button>
                          </>
                        )}
                      </div>
                    ),
                  },
                ]
              : []),
          ]}
        />
      </Card>
    </div>
  )
}
