import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Steps, Card, Form, Input, InputNumber, Button, Space, Row, Col,
  Typography, Divider, Alert, Result, DatePicker, message,
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
import { activeTemplatesFor, MOCK_CONTRACT_TEMPLATES } from '../../constants/mockContractTemplates'
import { MOCK_CUSTOMERS, findCustomerByNationalId, generateCustomerId } from '../../constants/mockCustomers'
import { MOCK_CONTRACTS } from '../../constants/mockContracts'
import { calcFixRate } from '../../utils/calculator'
import { submitContractForApproval } from '../../utils/contract'
import { canEditContractFields, isMerchantAdminOrAbove, scopedContractList } from '../../constants/roles'
import type { Customer } from '../../types/customer'
import type { Contract } from '../../types/contract'

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

// Same 5-step wizard as CreateContractPage, prefilled from an existing
// Draft/Pending Approval/Rejected contract instead of starting blank —
// per the doc's Contract Status Matrix, those are the only statuses ever
// editable, and only by the contract's own creator (canEditContractFields).
// Saving mutates the existing contract in place (same id/contractNumber)
// rather than creating a new one, then applies the same submit-for-
// approval transition Draft/Rejected already used at creation — this is
// the doc's "Staff edits the contract and resubmits" step, which previously
// had no actual editing UI at all (LifecycleActions' old "Resubmit" button
// just flipped status with nothing to fix first).
export function EditContractPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const actor = useCurrentUser()
  const canUseFreeRate = isMerchantAdminOrAbove(actor)

  // scopedContractList (not a raw merchantId filter) — same reasoning as
  // ContractDetailPage: Staff/Branch Manager shouldn't be able to reach
  // another branch's contract by guessing/typing its id.
  const maybeContract = scopedContractList(actor, MOCK_CONTRACTS).find(c => c.id === id)

  if (!maybeContract) {
    return (
      <Result
        status="404"
        title="Contract not found"
        extra={<Button onClick={() => navigate('/contracts')}>Back to list</Button>}
      />
    )
  }

  if (!canEditContractFields(actor, maybeContract)) {
    return (
      <Result
        status="403"
        title="You can't edit this contract"
        subTitle="Only the contract's own creator can edit it, and only while it's Draft, Pending Approval, or Rejected."
        extra={<Button onClick={() => navigate(`/contracts/${maybeContract.id}`)}>Back to contract</Button>}
      />
    )
  }

  // Rebound to a non-optional type — TS's narrowing above doesn't persist
  // into handleSubmit, a nested function declared later in this component,
  // since it can't prove the closure only ever runs after these guards.
  const contract: Contract = maybeContract

  const originalUnitId = contract.device.unitId
  const originalStatus = contract.status
  const originalCustomer = contract.customerId ? MOCK_CUSTOMERS.find(c => c.id === contract.customerId) ?? null : null

  const [step, setStep] = useState(0)
  const [deviceForm] = Form.useForm<DeviceValues>()
  const [templateForm] = Form.useForm<TemplateValues>()
  const [deviceInfoForm] = Form.useForm<DeviceInfoValues>()
  const [customerForm] = Form.useForm<CustomerValues>()

  // Ant Design Form instances lose their values on unmount between wizard
  // steps — captured into React state on each "Next" click instead of read
  // back off the (by-then-unmounted) Form. Seeded from the existing
  // contract so "Next" past a step the user never touched still carries
  // its original values forward.
  const [device, setDevice] = useState<DeviceValues | null>({
    branch: contract.branch,
    productId: contract.device.productId,
    unitId: contract.device.unitId,
  })
  const [templateValues, setTemplateValues] = useState<TemplateValues | null>({
    templateId: contract.template.templateId,
    termMonths: contract.financing.paymentTermMonths,
    ratePercent: contract.financing.ratePercent,
    downPaymentPercent: contract.financing.downPaymentPercent,
  })
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfoValues | null>({
    imei: contract.device.imei,
    serialNumber: contract.device.serialNumber,
    frontPhoto: contract.devicePhotos.front ? [contract.devicePhotos.front] : [],
    backPhoto: contract.devicePhotos.back ? [contract.devicePhotos.back] : [],
    imeiLabelPhoto: contract.devicePhotos.imeiLabel ? [contract.devicePhotos.imeiLabel] : [],
    sealWrapPhoto: contract.devicePhotos.sealWrap ? [contract.devicePhotos.sealWrap] : [],
  })
  const [customerValues, setCustomerValues] = useState<CustomerValues | null>({
    nationalId: contract.customer.nationalId,
    fullName: contract.customer.fullName,
    phone: contract.customer.phone,
    dateOfBirth: contract.customer.dateOfBirth,
    email: contract.customer.email,
    idCardAddress: contract.customer.idCardAddress,
    currentAddress: contract.customer.currentAddress,
    workplaceAddress: contract.customer.workplaceAddress,
    idCardPhoto: contract.idCardPhotos.idCard ? [contract.idCardPhotos.idCard] : [],
    idCardWithOwnerPhoto: contract.idCardPhotos.idCardWithOwner ? [contract.idCardPhotos.idCardWithOwner] : [],
  })
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(originalCustomer)

  // Active templates for the merchant, plus the contract's own template
  // even if it's since been archived — otherwise an edit would silently
  // drop the originally selected template out of the picker entirely.
  const activeTemplates = actor.merchantId ? activeTemplatesFor(actor.merchantId) : []
  const currentTemplate = MOCK_CONTRACT_TEMPLATES.find(t => t.id === contract.template.templateId)
  const templates = currentTemplate && !activeTemplates.some(t => t.id === currentTemplate.id)
    ? [...activeTemplates, currentTemplate]
    : activeTemplates

  const selectedBranch = Form.useWatch('branch', deviceForm) ?? device?.branch
  const selectedProductId = Form.useWatch('productId', deviceForm) ?? device?.productId
  const selectedTemplateId = Form.useWatch('templateId', templateForm) ?? templateValues?.templateId
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId)

  // The contract's own currently-assigned unit is "reserved" (by this same
  // contract), so it wouldn't show up in the plain "available" pool below —
  // included explicitly so re-selecting the same unit (the common case,
  // when the user is only fixing something else) still works.
  const availableUnits = selectedProductId
    ? MOCK_PRODUCT_UNITS.filter(u =>
        u.productId === selectedProductId && u.branch === selectedBranch &&
        (u.availability === 'available' || u.id === originalUnitId)
      )
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
    // Same defensive user-facing feedback as CreateContractPage's own
    // handleSubmit — a bare silent `return` here left a broken step
    // reading as "the button does nothing," with no indication what (or
    // whether anything) was wrong.
    if (!device || !templateValues || !deviceInfo || !customerValues || !selectedTemplate) {
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

    // Release the previously-reserved unit if the selection changed, then
    // reserve whichever unit the edit ends on — mirrors the reservation
    // CreateContractPage sets up at creation, just re-pointed if needed.
    if (unit.id !== originalUnitId) {
      const oldUnit = MOCK_PRODUCT_UNITS.find(u => u.id === originalUnitId)
      if (oldUnit) oldUnit.availability = 'available'
    }
    unit.availability = 'reserved'

    contract.branch = device.branch
    contract.device = {
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
    }
    contract.devicePhotos = {
      front: deviceInfo.frontPhoto?.[0],
      back: deviceInfo.backPhoto?.[0],
      imeiLabel: deviceInfo.imeiLabelPhoto?.[0],
      sealWrap: deviceInfo.sealWrapPhoto?.[0],
    }
    contract.idCardPhotos = {
      idCard: customerValues.idCardPhoto?.[0],
      idCardWithOwner: customerValues.idCardWithOwnerPhoto?.[0],
    }
    contract.customerId = customerId
    contract.customer = {
      fullName: customerValues.fullName,
      nationalId: customerValues.nationalId,
      phone: customerValues.phone,
      dateOfBirth: customerValues.dateOfBirth,
      email: customerValues.email,
      idCardAddress: customerValues.idCardAddress,
      currentAddress: customerValues.currentAddress,
      workplaceAddress: customerValues.workplaceAddress,
    }
    contract.template = {
      templateId: selectedTemplate!.id,
      templateName: selectedTemplate!.name,
      type: selectedTemplate!.type,
      title: selectedTemplate!.title,
      bindingStatement: selectedTemplate!.bindingStatement,
      legalDeclarations: selectedTemplate!.legalDeclarations,
      penalty: selectedTemplate!.penalty,
    }
    contract.financing = financing

    // Draft/Rejected are the two statuses this edit actually resubmits from
    // — Pending Approval means Staff is fixing something before a Branch
    // Manager has even started review, so there's no re-submission to do,
    // just a save. Rejected also clears the old rejection note/reviewer —
    // it's a fresh submission, not a continuation of the old review.
    if (originalStatus === 'draft' || originalStatus === 'rejected') {
      contract.rejectionNote = null
      contract.rejectedBy = null
      contract.rejectedAt = null
      submitContractForApproval(contract, actor.id, actor.role)
      message.success(actor.role === 'staff' ? 'Changes saved and submitted for approval' : 'Changes saved and approved')
    } else {
      message.success('Changes saved')
    }

    navigate(`/contracts/${contract.id}`)
  }

  const steps = [
    { title: 'Device', description: 'Pick the branch, product, and available unit for this contract.' },
    { title: 'Template & Terms', description: 'Choose a contract template and set the down payment and term.' },
    { title: 'Device Info & Photos', description: "Confirm the unit's IMEI and serial number, then upload box photos." },
    { title: 'Customer', description: 'Look up an existing customer by ID, or fill in a new one.' },
    { title: 'Preview', description: 'Review the full contract summary before saving.' },
  ]

  const submitLabel = originalStatus === 'rejected'
    ? 'Save & Resubmit'
    : originalStatus === 'draft'
    ? (actor.role === 'staff' ? 'Save & Submit for Approval' : 'Save Contract')
    : 'Save Changes'

  // Same header takeover as CreateContractPage — see its own comment for
  // why (a Steps bar replacing the breadcrumb, an X-icon Cancel replacing
  // the empty right slot). Cancel goes back to the contract itself here
  // (not the list), since that's where the "Edit" button that opened this
  // was clicked from.
  useSetHeaderContent({
    // title-only here — see CreateContractPage's own comment for why.
    center: <Steps current={step} items={steps.map(s => ({ title: s.title }))} size="small" className="ifix-header-steps" style={{ fontSize: 14 }} />,
    right: (
      <Button
        type="text"
        size="small"
        style={{ borderRadius: 6 }}
        icon={<X size={16} strokeWidth={2.25} />}
        onClick={() => navigate(`/contracts/${contract.id}`)}
      />
    ),
  }, [step])

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        {/* Same as CreateContractPage — see its own comment for why. */}
        <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 4 }}>{steps[step].title}</Typography.Title>
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>{steps[step].description}</Typography.Text>

        {step === 0 && (
          <Form form={deviceForm} layout="vertical" initialValues={device ?? { branch: actor.branch }}>
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
                      label: `IMEI ${u.imei}${u.grade ? ` · Grade ${u.grade}` : ''}${u.id === originalUnitId ? ' (current)' : ''}`,
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
          <Form form={templateForm} layout="vertical" initialValues={templateValues ?? undefined}>
            <Form.Item label="Contract Template" name="templateId" rules={[{ required: true, message: 'Required' }]}>
              <Select
                placeholder="Select template"
                options={templates
                  .filter(t => t.type === 'fixed_rate' || canUseFreeRate)
                  .map(t => ({ value: t.id, label: `${t.name}${t.isDefault ? ' (Default)' : ''}${t.id === currentTemplate?.id && t.status !== 'active' ? ' (Archived)' : ''}` }))}
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
          <Form form={deviceInfoForm} layout="vertical" initialValues={deviceInfo ?? undefined}>
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
          <Form form={customerForm} layout="vertical" initialValues={customerValues ?? undefined}>
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
                  {submitLabel}
                </Button>
              </Space>
            </div>
          )
        })()}
      </Card>
    </div>
  )
}
