import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Steps, Card, Form, Input, InputNumber, Button, Space, Row, Col,
  Typography, Divider, Alert, DatePicker, message,
} from 'antd'
import dayjs from 'dayjs'
import { Check, X } from 'lucide-react'
import { Select } from '../../components/AppSelect'
import { PhotoUpload } from '../../components/PhotoUpload'
import { useCurrentUser } from '../../contexts/AuthContext'
import { useSetHeaderContent } from '../../contexts/HeaderContentContext'
import { CurrencyDisplay } from '../../components/CurrencyDisplay'
import { DetailDescriptions } from '../../components/DetailDescriptions'
import { BRANCHES } from '../../constants/mockData'
import { MOCK_PRODUCTS } from '../../constants/mockProducts'
import { MOCK_PRODUCT_UNITS } from '../../constants/mockProductUnits'
import { MOCK_MERCHANTS } from '../../constants/mockMerchants'
import { activeTemplatesFor } from '../../constants/mockContractTemplates'
import { MOCK_CUSTOMERS, findCustomerByNationalId, generateCustomerId } from '../../constants/mockCustomers'
import { MOCK_CONTRACTS, generateContractId } from '../../constants/mockContracts'
import { calcFixRate } from '../../utils/calculator'
import { generateContractNumber, submitContractForApproval } from '../../utils/contract'
import { canCreateContract, isMerchantAdminOrAbove } from '../../constants/roles'
import type { Contract } from '../../types/contract'
import type { Customer } from '../../types/customer'

// Per the Contract doc's Free Rate terms ("pick a term: 3/6/10/12/18/24
// months") — a different set from Fixed Rate's own per-template terms.
const FREE_RATE_TERMS = [3, 6, 10, 12, 18, 24]

interface DeviceValues { branch: string; productId: string; unitId: string }
interface TemplateValues { templateId: string; termMonths: number; ratePercent: number; downPaymentPercent: number }
interface DeviceInfoValues {
  imei: string
  serialNumber: string
  frontPhoto?: string[]
  backPhoto?: string[]
  imeiLabelPhoto?: string[]
  sealWrapPhoto?: string[]
}
interface CustomerValues {
  nationalId: string
  fullName: string
  phone: string
  dateOfBirth: string
  email?: string
  idCardAddress: string
  currentAddress: string
  workplaceAddress?: string
  idCardPhoto?: string[]
  idCardWithOwnerPhoto?: string[]
}

export function CreateContractPage() {
  const navigate = useNavigate()
  const actor = useCurrentUser()
  const merchant = MOCK_MERCHANTS.find(m => m.id === actor.merchantId)
  const canUseFreeRate = isMerchantAdminOrAbove(actor)

  const [step, setStep] = useState(0)
  const [deviceForm] = Form.useForm<DeviceValues>()
  const [templateForm] = Form.useForm<TemplateValues>()
  const [deviceInfoForm] = Form.useForm<DeviceInfoValues>()
  const [customerForm] = Form.useForm<CustomerValues>()

  // Ant Design Form instances lose their values on unmount between wizard
  // steps — captured into React state on each "Next" click instead of read
  // back off the (by-then-unmounted) Form.
  const [device, setDevice] = useState<DeviceValues | null>(null)
  const [templateValues, setTemplateValues] = useState<TemplateValues | null>(null)
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfoValues | null>(null)
  const [customerValues, setCustomerValues] = useState<CustomerValues | null>(null)
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null)

  const templates = actor.merchantId ? activeTemplatesFor(actor.merchantId) : []
  // Falls back to the snapshotted state once its own step's Form unmounts
  // (per the comment above — a watched field resets to undefined once its
  // Form is gone) — without it, `selectedTemplate` silently went undefined
  // again the moment the user left the Template & Terms step, and
  // handleSubmit's `selectedTemplate!.id` etc. at the Preview step threw
  // with zero visible feedback (no toast, no error boundary) since it's a
  // plain event-handler exception. Matches EditContractPage's own already-
  // correct version of these three.
  const selectedBranch = Form.useWatch('branch', deviceForm) ?? device?.branch ?? actor.branch
  const selectedProductId = Form.useWatch('productId', deviceForm) ?? device?.productId
  const selectedTemplateId = Form.useWatch('templateId', templateForm) ?? templateValues?.templateId
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId)

  const steps = [
    { title: 'Device', description: 'Pick the branch, product, and available unit for this contract.' },
    { title: 'Template & Terms', description: 'Choose a contract template and set the down payment and term.' },
    { title: 'Device Info & Photos', description: "Confirm the unit's IMEI and serial number, then upload box photos." },
    { title: 'Customer', description: 'Look up an existing customer by ID, or fill in a new one.' },
    { title: 'Preview', description: 'Review the full contract summary before submitting.' },
  ]

  // Replaces AppLayout's own breadcrumb/right-slot with this wizard's own
  // progress (a Steps bar, in place of the plain "Contracts" title) and its
  // Cancel — an X icon here rather than a labeled button, matching a
  // Drawer's own close affordance despite this being a full page. Same
  // plain, no-confirmation Cancel every other Create flow in the app
  // already has (e.g. CreateProductModal's own footer Cancel) — this
  // wizard previously had no way to back out of it at all short of the
  // sidebar's own nav, at any of its 5 steps. Registered unconditionally
  // (before the canCreateContract guard below) since hooks can't follow an
  // early return; it updates live as `step` advances since this re-runs on
  // every render, not just once.
  useSetHeaderContent({
    // title-only here — `steps` also carries each step's own `description`
    // now (used below the heading in the main content, not the compact
    // header bar), which antd's Steps would otherwise render as its own
    // sub-label under every item.
    center: <Steps current={step} items={steps.map(s => ({ title: s.title }))} size="small" className="ifix-header-steps" style={{ fontSize: 14 }} />,
    right: (
      <Button
        type="text"
        size="small"
        style={{ borderRadius: 6 }}
        icon={<X size={16} strokeWidth={2.25} />}
        onClick={() => navigate('/contracts')}
      />
    ),
  }, [step])

  if (!canCreateContract(actor)) {
    return (
      <Alert
        type="info"
        message="Not applicable"
        description="Contracts are scoped to a merchant workspace. Super Admin operates at the platform level."
        showIcon
      />
    )
  }

  const availableUnits = selectedProductId
    ? MOCK_PRODUCT_UNITS.filter(u => u.productId === selectedProductId && u.branch === selectedBranch && u.availability === 'available')
    : []

  function handleProductChange() {
    deviceForm.setFieldValue('unitId', undefined)
  }

  function handleDeviceNext() {
    deviceForm.validateFields().then(values => {
      setDevice(values)
      setStep(1)
    })
  }

  function handleTemplateNext() {
    templateForm.validateFields().then(values => {
      setTemplateValues(values)
      const unit = MOCK_PRODUCT_UNITS.find(u => u.id === device!.unitId)!
      deviceInfoForm.setFieldsValue({ imei: unit.imei, serialNumber: unit.serialNumber })
      setStep(2)
    })
  }

  function handleDeviceInfoNext() {
    deviceInfoForm.validateFields().then(values => {
      setDeviceInfo(values)
      setStep(3)
    })
  }

  function handleLookupCustomer() {
    const nationalId = customerForm.getFieldValue('nationalId')
    if (!nationalId || !actor.merchantId) return
    const found = findCustomerByNationalId(actor.merchantId, nationalId)
    if (found) {
      setMatchedCustomer(found)
      customerForm.setFieldsValue({
        fullName: found.fullName,
        phone: found.phone,
        dateOfBirth: found.dateOfBirth,
        email: found.email,
        idCardAddress: found.idCardAddress,
        currentAddress: found.currentAddress,
        workplaceAddress: found.workplaceAddress,
      })
      message.success(`Existing customer found — form prefilled from ${found.fullName}'s record`)
    } else {
      setMatchedCustomer(null)
      message.info('No existing customer with this ID — fill in the form below to create one')
    }
  }

  function handleCustomerNext() {
    customerForm.validateFields().then(values => {
      setCustomerValues(values)
      setStep(4)
    })
  }

  function computeFinancing() {
    const product = MOCK_PRODUCTS.find(p => p.id === device!.productId)!
    const unit = MOCK_PRODUCT_UNITS.find(u => u.id === device!.unitId)!
    const devicePrice = unit.customPrice ?? product.salesPrice
    const downPaymentAmount = Math.round(devicePrice * templateValues!.downPaymentPercent / 100)
    const loanAmount = devicePrice - downPaymentAmount
    const calc = calcFixRate(loanAmount, templateValues!.ratePercent, templateValues!.termMonths)
    return {
      devicePrice,
      downPaymentPercent: templateValues!.downPaymentPercent,
      downPaymentAmount,
      ratePercent: templateValues!.ratePercent,
      paymentTermMonths: templateValues!.termMonths,
      installmentAmount: calc.monthlyInstallment,
      totalContractValue: Math.round(downPaymentAmount + calc.totalPayable),
    }
  }

  function handleSubmit() {
    // A bare `return` here previously failed completely silently — no
    // toast, no error, the button just did nothing — for the same reason
    // selectedTemplate above did: a step's own snapshot going missing
    // reads as "nothing happened" from the user's side with no indication
    // anything is even wrong, let alone what to fix.
    if (!merchant || !device || !templateValues || !deviceInfo || !customerValues || !selectedTemplate) {
      message.error('Something went wrong — please go back and check every step.')
      return
    }
    const product = MOCK_PRODUCTS.find(p => p.id === device.productId)!
    const unit = MOCK_PRODUCT_UNITS.find(u => u.id === device.unitId)!
    const financing = computeFinancing()

    const customerId = matchedCustomer?.id ?? generateCustomerId()
    if (!matchedCustomer) {
      MOCK_CUSTOMERS.push({
        id: customerId,
        merchantId: actor.merchantId!,
        nationalId: customerValues.nationalId,
        fullName: customerValues.fullName,
        phone: customerValues.phone,
        dateOfBirth: customerValues.dateOfBirth,
        email: customerValues.email,
        idCardAddress: customerValues.idCardAddress,
        currentAddress: customerValues.currentAddress,
        workplaceAddress: customerValues.workplaceAddress,
        blacklisted: false,
        createdBy: actor.id,
        createdAt: new Date().toISOString(),
      })
    } else {
      // "Update when adding a new contract for an existing customer" — the
      // form may have edited details for the matched record.
      Object.assign(matchedCustomer, {
        fullName: customerValues.fullName,
        phone: customerValues.phone,
        dateOfBirth: customerValues.dateOfBirth,
        email: customerValues.email,
        idCardAddress: customerValues.idCardAddress,
        currentAddress: customerValues.currentAddress,
        workplaceAddress: customerValues.workplaceAddress,
      })
    }

    const now = new Date().toISOString()
    const isStaff = actor.role === 'staff'
    const contract: Contract = {
      id: generateContractId(),
      contractNumber: generateContractNumber(merchant, MOCK_CONTRACTS),
      // Starts 'draft' and immediately transitions below via
      // submitContractForApproval — the same helper EditContractPage uses
      // to resubmit — rather than duplicating the status/submittedBy/
      // approvedBy logic inline here too.
      status: 'draft',
      merchantId: actor.merchantId!,
      branch: device.branch,
      device: {
        productId: product.id,
        unitId: unit.id,
        productName: product.name,
        brand: product.brand,
        model: product.model,
        storage: product.storage,
        color: product.color,
        condition: unit.grade ?? 'New',
        imei: deviceInfo.imei,
        serialNumber: deviceInfo.serialNumber,
      },
      devicePhotos: {
        front: deviceInfo.frontPhoto?.[0],
        back: deviceInfo.backPhoto?.[0],
        imeiLabel: deviceInfo.imeiLabelPhoto?.[0],
        sealWrap: deviceInfo.sealWrapPhoto?.[0],
      },
      idCardPhotos: {
        idCard: customerValues.idCardPhoto?.[0],
        idCardWithOwner: customerValues.idCardWithOwnerPhoto?.[0],
      },
      customerId,
      customer: {
        fullName: customerValues.fullName,
        nationalId: customerValues.nationalId,
        phone: customerValues.phone,
        dateOfBirth: customerValues.dateOfBirth,
        email: customerValues.email,
        idCardAddress: customerValues.idCardAddress,
        currentAddress: customerValues.currentAddress,
        workplaceAddress: customerValues.workplaceAddress,
      },
      template: {
        templateId: selectedTemplate!.id,
        templateName: selectedTemplate!.name,
        type: selectedTemplate!.type,
        title: selectedTemplate!.title,
        bindingStatement: selectedTemplate!.bindingStatement,
        legalDeclarations: selectedTemplate!.legalDeclarations,
        penalty: selectedTemplate!.penalty,
      },
      financing,
      schedule: [],
      payments: [],
      collectionFees: [],
      penaltyAdjustments: [],
      penaltyChargedTotal: 0,
      penaltyBalance: 0,
      collectionFeeBalance: 0,
      rejectionNote: null,
      signedContractUploaded: false,
      createdBy: actor.id,
      createdAt: now,
      submittedBy: null,
      submittedAt: null,
      approvedBy: null,
      approvedAt: null,
      rejectedBy: null,
      rejectedAt: null,
      activatedAt: null,
      settledAt: null,
    }

    submitContractForApproval(contract, actor.id, actor.role)

    // Reserve the unit so it drops out of the "available" pool for the next
    // contract — mirrors what the Products module does when a unit sells.
    unit.availability = 'reserved'

    MOCK_CONTRACTS.push(contract)
    message.success(isStaff ? 'Contract submitted for approval' : 'Contract created and approved')
    navigate(`/contracts/${contract.id}`)
  }

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        {/* Now that the header's own Steps bar only spells out the active
            step's title (see index.css) and abbreviates/hides the rest,
            the step you're on needs a clear marker somewhere in the
            content itself too — reusing `steps[step].title` (the same
            string the header shows) keeps the two in sync automatically
            rather than duplicating the label per step. A one-line
            description underneath says what the step is actually for,
            not just its name. marginTop: 0 — antd's own Title default
            (~27px here) assumes it's sitting under other content; as the
            very first thing in the Card it just read as a stray gap. */}
        <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 4 }}>{steps[step].title}</Typography.Title>
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>{steps[step].description}</Typography.Text>

        {step === 0 && (
          <Form form={deviceForm} layout="vertical" initialValues={{ branch: actor.branch }}>
            {!actor.branch && (
              <Form.Item label="Branch" name="branch" rules={[{ required: true, message: 'Required' }]}>
                <Select placeholder="Select branch" options={BRANCHES.map(b => ({ value: b, label: b }))} />
              </Form.Item>
            )}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Product" name="productId" rules={[{ required: true, message: 'Required' }]}>
                  <Select
                    showSearch
                    placeholder="Search brand or model"
                    optionFilterProp="label"
                    onChange={handleProductChange}
                    options={MOCK_PRODUCTS.filter(p => p.merchantId === actor.merchantId && !p.deletedAt).map(p => ({
                      value: p.id,
                      label: `${p.brand} ${p.name}${p.storage ? ` · ${p.storage}` : ''} (${p.type === 'used' ? 'Used' : 'New'})`,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Unit" name="unitId" rules={[{ required: true, message: 'Required' }]}>
                  <Select
                    placeholder={selectedProductId ? 'Select an available unit' : 'Select a product first'}
                    disabled={!selectedProductId}
                    options={availableUnits.map(u => ({
                      value: u.id,
                      label: `IMEI ${u.imei}${u.grade ? ` · Grade ${u.grade}` : ''}`,
                    }))}
                  />
                </Form.Item>
              </Col>
            </Row>
            {selectedProductId && availableUnits.length === 0 && (
              <Alert type="warning" showIcon message="No available units for this product at this branch." style={{ marginBottom: 16 }} />
            )}
            <Button type="primary" onClick={handleDeviceNext}>Next: Template & Terms</Button>
          </Form>
        )}

        {step === 1 && (
          <Form form={templateForm} layout="vertical">
            <Form.Item label="Contract Template" name="templateId" rules={[{ required: true, message: 'Required' }]}>
              <Select
                placeholder="Select template"
                options={templates
                  .filter(t => t.type === 'fixed_rate' || canUseFreeRate)
                  .map(t => ({ value: t.id, label: `${t.name}${t.isDefault ? ' (Default)' : ''}` }))}
              />
            </Form.Item>

            {selectedTemplate?.type === 'fixed_rate' && (
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="Payment Term" name="termMonths" rules={[{ required: true, message: 'Required' }]}>
                    <Select
                      placeholder="Select term"
                      options={selectedTemplate.fixedRateTerms!.map(t => ({ value: t.months, label: `${t.months} months (${t.ratePercent}%/mo)` }))}
                      onChange={months => {
                        const rate = selectedTemplate.fixedRateTerms!.find(t => t.months === months)?.ratePercent
                        templateForm.setFieldValue('ratePercent', rate)
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Down Payment (%)" name="downPaymentPercent" rules={[{ required: true, message: 'Required' }]}>
                    <InputNumber
                      style={{ width: '100%' }}
                      min={selectedTemplate.minDownPaymentPercent}
                      max={selectedTemplate.maxDownPaymentPercent}
                      addonAfter="%"
                    />
                  </Form.Item>
                </Col>
                <Form.Item name="ratePercent" hidden><InputNumber /></Form.Item>
              </Row>
            )}

            {selectedTemplate?.type === 'free_rate' && (
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="Payment Term" name="termMonths" rules={[{ required: true, message: 'Required' }]}>
                    <Select placeholder="Select term" options={FREE_RATE_TERMS.map(m => ({ value: m, label: `${m} months` }))} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Rate (%/month)" name="ratePercent" rules={[{ required: true, message: 'Required' }]}>
                    <InputNumber style={{ width: '100%' }} min={0} step={0.1} precision={2} addonAfter="%" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Down Payment (%)" name="downPaymentPercent" rules={[{ required: true, message: 'Required' }]}>
                    <InputNumber
                      style={{ width: '100%' }}
                      min={selectedTemplate.minDownPaymentPercent}
                      max={selectedTemplate.maxDownPaymentPercent}
                      addonAfter="%"
                    />
                  </Form.Item>
                </Col>
              </Row>
            )}

            <Space>
              <Button onClick={() => setStep(0)}>Back</Button>
              <Button type="primary" onClick={handleTemplateNext} disabled={!selectedTemplate}>Next: Device Info</Button>
            </Space>
          </Form>
        )}

        {step === 2 && (
          <Form form={deviceInfoForm} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="IMEI" name="imei" rules={[{ required: true, message: 'Required' }]}>
                  <Input maxLength={15} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Serial Number" name="serialNumber" rules={[{ required: true, message: 'Required' }]}>
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item label="Box Front" name="frontPhoto" rules={[{ required: true, message: 'Required' }]}>
                  <PhotoUpload maxCount={1} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Box Back" name="backPhoto">
                  <PhotoUpload maxCount={1} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="IMEI Label" name="imeiLabelPhoto" rules={[{ required: true, message: 'Required' }]}>
                  <PhotoUpload maxCount={1} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Seal / Wrap" name="sealWrapPhoto">
                  <PhotoUpload maxCount={1} />
                </Form.Item>
              </Col>
            </Row>
            <Space>
              <Button onClick={() => setStep(1)}>Back</Button>
              <Button type="primary" onClick={handleDeviceInfoNext}>Next: Customer</Button>
            </Space>
          </Form>
        )}

        {step === 3 && (
          <Form form={customerForm} layout="vertical">
            <Row gutter={16}>
              <Col span={16}>
                <Form.Item label="National ID / Passport" name="nationalId" rules={[{ required: true, message: 'Required' }]}>
                  <Input placeholder="X-XXXX-XXXXX-XX-X" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Button style={{ marginTop: 30 }} onClick={handleLookupCustomer}>Look Up</Button>
              </Col>
            </Row>
            {matchedCustomer?.blacklisted && (
              <Alert
                type="error"
                showIcon
                message="This customer is blacklisted"
                description="Creating a contract for a blacklisted customer requires approval. Continuing will route this contract for review regardless of who submits it."
                style={{ marginBottom: 16 }}
              />
            )}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Full Name" name="fullName" rules={[{ required: true, message: 'Required' }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Phone" name="phone" rules={[{ required: true, message: 'Required' }]}>
                  <Input placeholder="0XX-XXX-XXXX" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Date of Birth"
                  name="dateOfBirth"
                  rules={[{ required: true, message: 'Required' }]}
                  getValueProps={value => ({ value: value ? dayjs(value) : undefined })}
                  normalize={value => (value ? value.format('YYYY-MM-DD') : value)}
                >
                  <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Email" name="email">
                  <Input placeholder="email@example.com" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="ID Card's Address" name="idCardAddress" rules={[{ required: true, message: 'Required' }]}>
              <Input.TextArea rows={2} />
            </Form.Item>
            <Form.Item label="Current Address" name="currentAddress" rules={[{ required: true, message: 'Required' }]}>
              <Input.TextArea rows={2} />
            </Form.Item>
            <Form.Item label="Workplace Address" name="workplaceAddress">
              <Input.TextArea rows={2} />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="ID Card Photo" name="idCardPhoto" rules={[{ required: true, message: 'Required' }]}>
                  <PhotoUpload maxCount={1} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="ID Card with Owner" name="idCardWithOwnerPhoto" rules={[{ required: true, message: 'Required' }]}>
                  <PhotoUpload maxCount={1} />
                </Form.Item>
              </Col>
            </Row>
            <Space>
              <Button onClick={() => setStep(2)}>Back</Button>
              <Button type="primary" onClick={handleCustomerNext}>Next: Preview</Button>
            </Space>
          </Form>
        )}

        {step === 4 && device && templateValues && deviceInfo && customerValues && (() => {
          const product = MOCK_PRODUCTS.find(p => p.id === device.productId)!
          const financing = computeFinancing()

          return (
            <div>
              <Typography.Title level={5}>Device</Typography.Title>
              <DetailDescriptions style={{ marginBottom: 24 }}
                items={[
                  { label: 'Product', children: `${product.brand} ${product.name}` },
                  { label: 'Color', children: product.color },
                  { label: 'Storage', children: product.storage ?? '—' },
                  { label: 'IMEI', children: deviceInfo.imei },
                  { label: 'Serial', children: deviceInfo.serialNumber },
                  { label: 'Branch', children: device.branch },
                ]}
              />

              <Typography.Title level={5}>Financing — {selectedTemplate?.name}</Typography.Title>
              <DetailDescriptions style={{ marginBottom: 24 }}
                items={[
                  { label: 'Device Price', children: <CurrencyDisplay amount={financing.devicePrice} /> },
                  { label: 'Down Payment', children: <>{financing.downPaymentPercent}% · <CurrencyDisplay amount={financing.downPaymentAmount} /></> },
                  { label: 'Rate', children: `${financing.ratePercent}%/month` },
                  { label: 'Term', children: `${financing.paymentTermMonths} months` },
                  { label: 'Monthly Installment', children: <CurrencyDisplay amount={financing.installmentAmount} /> },
                  { label: 'Total Contract Value', children: <CurrencyDisplay amount={financing.totalContractValue} /> },
                ]}
              />

              <Typography.Title level={5}>Customer</Typography.Title>
              <DetailDescriptions style={{ marginBottom: 24 }}
                items={[
                  { label: 'Full Name', children: customerValues.fullName },
                  { label: 'National ID', children: customerValues.nationalId },
                  { label: 'Phone', children: customerValues.phone },
                  { label: 'Email', children: customerValues.email || '—' },
                ]}
              />

              <Divider />

              <Space>
                <Button onClick={() => setStep(3)}>Back</Button>
                <Button type="primary" icon={<Check size={16} strokeWidth={2.25} />} onClick={handleSubmit}>
                  {actor.role === 'staff' ? 'Submit for Approval' : 'Create Contract'}
                </Button>
              </Space>
            </div>
          )
        })()}
      </Card>
    </div>
  )
}
