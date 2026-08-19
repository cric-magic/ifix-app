import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Steps, Card, Form, Input, InputNumber, Button, Space,
  Row, Col, Descriptions, DatePicker, Typography, Divider, message,
} from 'antd'
import { Check } from 'lucide-react'
import { Select } from '../../components/AppSelect'
import dayjs from 'dayjs'
import { MOCK_PRODUCTS, MOCK_INSTALLMENTS, MOCK_CUSTOMERS, MOCK_SCHEDULES, MOCK_PAYMENTS, BRANCHES } from '../../constants/mockData'
import { calcFixRate } from '../../utils/calculator'
import { StatusBadge } from '../../components/StatusBadge'
import type { InstallmentRecord, CustomerInfo, ScheduleItem } from '../../types/installment'
import { useCurrentUser } from '../../contexts/AuthContext'

const THB = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 })
const PERIODS = [3, 6, 9, 12, 18, 24]
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair']
const CONTRACT_TYPES = [
  { value: 'hire_purchase', label: 'Hire Purchase (เช่าซื้อ)' },
  { value: 'credit_sale', label: 'Credit Sale (ขายเชื่อ)' },
]

function generateInvoiceNumber() {
  return `INV-${Math.floor(Math.random() * 9000000000 + 1000000000)}`
}

function generateContractNumber() {
  const year = new Date().getFullYear()
  const seq = String(MOCK_INSTALLMENTS.length + 1).padStart(3, '0')
  return `CNT-${year}-${seq}`
}

export function CreateContractPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const user = useCurrentUser()
  const [step, setStep] = useState(0)
  const [productForm] = Form.useForm()
  const [financingForm] = Form.useForm()
  const [customerForm] = Form.useForm()
  const [contractTypeForm] = Form.useForm()

  // Captured values — persisted when each step's Form unmounts
  const [savedProduct, setSavedProduct] = useState<Record<string, any>>({})
  const [savedFinancing, setSavedFinancing] = useState<Record<string, any>>({})
  const [savedCustomer, setSavedCustomer] = useState<Record<string, any>>({})

  // Pre-fill from calculator params
  const preProductId = searchParams.get('productId') ?? undefined
  const prePrice = Number(searchParams.get('price') ?? 0)
  const preDownPayment = Number(searchParams.get('downPayment') ?? 0)
  const prePeriods = Number(searchParams.get('periods') ?? 0)
  const preFlatRate = Number(searchParams.get('flatRate') ?? 0)
  const preMonthly = Number(searchParams.get('monthly') ?? 0)

  const preProduct = MOCK_PRODUCTS.find(p => p.id === preProductId)

  function onProductSelect(productId: string) {
    const product = MOCK_PRODUCTS.find(p => p.id === productId)
    if (product) {
      productForm.setFieldsValue({
        productName: product.name,
        brand: product.brand,
        model: product.model,
        category: product.category,
        color: product.color,
        storage: product.storage,
      })
    }
  }

  function handleProductNext() {
    productForm.validateFields().then(() => {
      setSavedProduct(productForm.getFieldsValue())
      setStep(1)
    })
  }

  function handleFinancingNext() {
    financingForm.validateFields().then(() => {
      setSavedFinancing(financingForm.getFieldsValue())
      setStep(2)
    })
  }

  function handleCustomerNext() {
    customerForm.validateFields().then(() => {
      setSavedCustomer(customerForm.getFieldsValue())
      setStep(3)
    })
  }

  function handleSubmit() {
    contractTypeForm.validateFields().then(() => {
      const fVals = savedFinancing
      const cVals = savedCustomer

      const loanAmount = fVals.loanAmount ?? (fVals.actualPrice - fVals.downPayment)
      const periods = fVals.periods
      const flatRate = fVals.flatRate ?? preFlatRate
      const calcResult = calcFixRate(loanAmount, flatRate, periods)

      const customerId = `cust-new-${Date.now()}`
      const installmentId = `inst-new-${Date.now()}`

      const newCustomer: CustomerInfo = {
        id: customerId,
        name: cVals.customerName,
        idCardNumber: cVals.idCardNumber,
        phone: cVals.phone,
        email: cVals.email ?? '',
        address: cVals.address,
        occupation: cVals.occupation ?? '',
      }

      const newRecord: InstallmentRecord = {
        id: installmentId,
        invoiceNumber: generateInvoiceNumber(),
        contractNumber: generateContractNumber(),
        customerName: cVals.customerName,
        customerId,
        branch: user.branch ?? BRANCHES[0],
        contractStatus: 'normal',
        totalAmount: calcResult.totalPayable,
        paidAmount: 0,
        dueAmount: calcResult.monthlyInstallment,
        overdueAmount: 0,
        remainingBalance: calcResult.totalPayable,
        startDate: dayjs().format('YYYY-MM-DD'),
        endDate: dayjs().add(periods, 'month').format('YYYY-MM-DD'),
        paymentStatus: 'due',
      }

      const newSchedule: ScheduleItem[] = calcResult.schedule.map(s => ({
        period: s.period,
        dueDate: s.dueDate,
        principal: Math.round(loanAmount / periods),
        interest: s.amount - Math.round(loanAmount / periods),
        totalInstallment: s.amount,
        paidDate: null,
        status: 'future' as const,
      }))
      newSchedule[0].status = 'due'

      // Mutate mock data arrays (in-memory for demo)
      MOCK_INSTALLMENTS.push(newRecord)
      MOCK_CUSTOMERS[customerId] = newCustomer
      MOCK_SCHEDULES[installmentId] = newSchedule
      MOCK_PAYMENTS[installmentId] = []

      message.success('Contract created successfully!')
      navigate(`/installments/${installmentId}`)
    })
  }

  const steps = [
    { title: 'Product' },
    { title: 'Financing' },
    { title: 'Customer' },
    { title: 'Review' },
  ]

  return (
    <div>
<Card style={{ marginBottom: 24 }}>
        <Steps current={step} items={steps} style={{ marginBottom: 32 }} />

        {/* Step 1: Product */}
        {step === 0 && (
          <Form
            form={productForm}
            layout="vertical"
            initialValues={{
              productId: preProductId,
              productName: preProduct?.name,
              brand: preProduct?.brand,
              model: preProduct?.model,
              category: preProduct?.category,
              color: preProduct?.color,
              storage: preProduct?.storage,
            }}
          >
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item label="Select from Catalog" name="productId">
                  <Select
                    showSearch
                    allowClear
                    placeholder="Search product catalog"
                    optionFilterProp="label"
                    onChange={onProductSelect}
                    options={MOCK_PRODUCTS.map(p => ({
                      value: p.id,
                      label: `${p.brand} ${p.name} — ${p.storage} (${THB.format(p.price)})`,
                    }))}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Divider plain>Or enter manually</Divider>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Product Name" name="productName" rules={[{ required: true, message: 'Required' }]}>
                  <Input placeholder="e.g. iPhone 15 Pro" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Brand" name="brand" rules={[{ required: true, message: 'Required' }]}>
                  <Input placeholder="e.g. Apple" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Model" name="model">
                  <Input placeholder="e.g. A3290" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item label="Category" name="category">
                  <Input placeholder="e.g. Smartphone" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Color" name="color">
                  <Input placeholder="e.g. Black" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Storage" name="storage">
                  <Input placeholder="e.g. 256GB" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Condition" name="condition" initialValue="New">
                  <Select options={CONDITIONS.map(c => ({ value: c, label: c }))} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="IMEI" name="imei">
                  <Input placeholder="15-digit IMEI number" maxLength={15} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Serial Number" name="serialNumber">
                  <Input placeholder="Device serial number" />
                </Form.Item>
              </Col>
            </Row>
            <Button type="primary" onClick={handleProductNext}>Next: Financing</Button>
          </Form>
        )}

        {/* Step 2: Financing */}
        {step === 1 && (
          <Form
            form={financingForm}
            layout="vertical"
            initialValues={{
              productPrice: prePrice || preProduct?.price,
              actualPrice: prePrice || preProduct?.price,
              downPayment: preDownPayment,
              loanAmount: prePrice - preDownPayment || undefined,
              periods: prePeriods || undefined,
              flatRate: preFlatRate || undefined,
              installmentAmount: preMonthly || undefined,
              downPaymentDate: dayjs(),
            }}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="Product Price (฿)" name="productPrice" rules={[{ required: true, message: 'Required' }]}>
                  <InputNumber style={{ width: '100%' }} min={0} step={100} addonBefore="฿" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Actual Price (฿)" name="actualPrice" rules={[{ required: true, message: 'Required' }]}>
                  <InputNumber style={{ width: '100%' }} min={0} step={100} addonBefore="฿" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Down Payment (฿)" name="downPayment" rules={[{ required: true, message: 'Required' }]}>
                  <InputNumber style={{ width: '100%' }} min={0} step={100} addonBefore="฿" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="Loan Amount (฿)" name="loanAmount">
                  <InputNumber style={{ width: '100%' }} min={0} step={100} addonBefore="฿" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Number of Installments" name="periods" rules={[{ required: true, message: 'Required' }]}>
                  <Select
                    placeholder="Select"
                    options={PERIODS.map(p => ({ value: p, label: `${p} months` }))}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Flat Rate (%/month)" name="flatRate">
                  <InputNumber style={{ width: '100%' }} min={0} step={0.25} addonAfter="%" precision={2} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="Monthly Installment (฿)" name="installmentAmount">
                  <InputNumber style={{ width: '100%' }} min={0} step={100} addonBefore="฿" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Down Payment Date" name="downPaymentDate">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Commission" name="commission">
                  <InputNumber style={{ width: '100%' }} min={0} step={100} addonBefore="฿" />
                </Form.Item>
              </Col>
            </Row>
            <Space>
              <Button onClick={() => setStep(0)}>Back</Button>
              <Button type="primary" onClick={handleFinancingNext}>Next: Customer</Button>
            </Space>
          </Form>
        )}

        {/* Step 3: Customer */}
        {step === 2 && (
          <Form form={customerForm} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Full Name" name="customerName" rules={[{ required: true, message: 'Required' }]}>
                  <Input placeholder="Customer full name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="ID Card Number" name="idCardNumber" rules={[{ required: true, message: 'Required' }]}>
                  <Input placeholder="X-XXXX-XXXXX-XX-X" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="Phone" name="phone" rules={[{ required: true, message: 'Required' }]}>
                  <Input placeholder="0XX-XXX-XXXX" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Email" name="email">
                  <Input placeholder="email@example.com" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Occupation" name="occupation">
                  <Input placeholder="e.g. Engineer" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="Address" name="address" rules={[{ required: true, message: 'Required' }]}>
              <Input.TextArea rows={3} placeholder="Full address" />
            </Form.Item>
            <Space>
              <Button onClick={() => setStep(1)}>Back</Button>
              <Button type="primary" onClick={handleCustomerNext}>Next: Review</Button>
            </Space>
          </Form>
        )}

        {/* Step 4: Review & Submit */}
        {step === 3 && (() => {
          const pVals = savedProduct
          const fVals = savedFinancing
          const cVals = savedCustomer
          const loanAmount: number = fVals.loanAmount ?? (fVals.actualPrice - fVals.downPayment)
          const calcResult = calcFixRate(loanAmount, fVals.flatRate ?? preFlatRate, fVals.periods)

          return (
            <div>
              <Typography.Title level={5}>Product</Typography.Title>
              <Descriptions bordered size="small" column={3} style={{ marginBottom: 24 }}
                items={[
                  { label: 'Name', children: pVals.productName },
                  { label: 'Brand', children: pVals.brand },
                  { label: 'Model', children: pVals.model },
                  { label: 'Color', children: pVals.color },
                  { label: 'Storage', children: pVals.storage },
                  { label: 'Condition', children: pVals.condition },
                  { label: 'IMEI', children: pVals.imei || '—' },
                  { label: 'Serial', children: pVals.serialNumber || '—' },
                ]}
              />

              <Typography.Title level={5}>Financing</Typography.Title>
              <Descriptions bordered size="small" column={3} style={{ marginBottom: 24 }}
                items={[
                  { label: 'Actual Price', children: THB.format(fVals.actualPrice) },
                  { label: 'Down Payment', children: THB.format(fVals.downPayment) },
                  { label: 'Loan Amount', children: THB.format(loanAmount) },
                  { label: 'Installments', children: `${fVals.periods} months` },
                  { label: 'Monthly', children: THB.format(calcResult.monthlyInstallment) },
                  { label: 'Total Payable', children: THB.format(calcResult.totalPayable) },
                  { label: 'Status', children: <StatusBadge status="due" /> },
                ]}
              />

              <Typography.Title level={5}>Customer</Typography.Title>
              <Descriptions bordered size="small" column={2} style={{ marginBottom: 24 }}
                items={[
                  { label: 'Full Name', children: cVals.customerName },
                  { label: 'ID Card', children: cVals.idCardNumber },
                  { label: 'Phone', children: cVals.phone },
                  { label: 'Email', children: cVals.email || '—' },
                  { label: 'Address', children: cVals.address, span: 2 },
                ]}
              />

              <Form form={contractTypeForm} layout="inline" style={{ marginBottom: 24 }}>
                <Form.Item label="Contract Type" name="contractType" initialValue="hire_purchase" rules={[{ required: true }]}>
                  <Select style={{ width: 240 }} options={CONTRACT_TYPES} />
                </Form.Item>
              </Form>

              <Space>
                <Button onClick={() => setStep(2)}>Back</Button>
                <Button type="primary" icon={<Check size={16} strokeWidth={2.25} />} onClick={handleSubmit}>
                  Confirm & Create Contract
                </Button>
              </Space>
            </div>
          )
        })()}
      </Card>
    </div>
  )
}
