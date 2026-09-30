import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Card, Form, Input, Button, Space, Row, Col,
  Typography, Divider, Alert, message,
} from 'antd'
import { DatePicker } from '../../components/AppDatePicker'
import { InputNumber } from '../../components/AppInputNumber'
import dayjs from 'dayjs'
import { Check, X, FileText, Lock } from 'lucide-react'
import { Select } from '../../components/AppSelect'
import { TermChips } from '../../components/TermChips'
import { DownPaymentField } from '../../components/DownPaymentField'
import { InterestField } from '../../components/InterestField'
import { clampDown, preferredTermOf } from '../../utils/quote'
import { PhotoUpload } from '../../components/PhotoUpload'
import { HeaderSteps } from '../../components/HeaderSteps'
import { useIsMobile } from '../../components/useIsMobile'
import { useCurrentUser } from '../../contexts/AuthContext'
import { useSetHeaderContent } from '../../contexts/HeaderContentContext'
import { CurrencyDisplay } from '../../components/CurrencyDisplay'
import { DetailDescriptions } from '../../components/DetailDescriptions'
import { MOCK_PRODUCTS } from '../../constants/mockProducts'
import { MOCK_PRODUCT_UNITS } from '../../constants/mockProductUnits'
import { activeTemplatesFor, MOCK_CONTRACT_TEMPLATES } from '../../constants/mockContractTemplates'
import { MOCK_CUSTOMERS, findCustomerByNationalId, generateCustomerId } from '../../constants/mockCustomers'
import { MOCK_CONTRACTS } from '../../constants/mockContracts'
import { calcFixRate } from '../../utils/calculator'
import { submitContractForApproval } from '../../utils/contract'
import { canEditContractFields, isMerchantAdminOrAbove, scopedContractList } from '../../constants/roles'
import { BoxLabelNote } from './components/BoxLabelNote'
import { SelectDevice, type DeviceChoice, type DeviceSource } from './components/SelectDevice'
import type { Customer } from '../../types/customer'
import type { Contract } from '../../types/contract'
import { PageEmptyState } from '../../components/PageEmptyState'
import { normalizeSections } from '../../constants/contractSections'

// Per the Contract doc's Free Rate terms ("pick a term: 3/6/10/12/18/24
// months") — a different set from Fixed Rate's own per-template terms.
const FREE_RATE_TERMS = [3, 6, 10, 12, 18, 24]

interface DeviceValues { branch: string; productId: string; unitId: string; source: DeviceSource }
interface TemplateValues { templateId: string; termMonths: number; ratePercent: number; downPaymentPercent: number }
interface DeviceInfoValues {
  imei1?: string
  imei2?: string
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
  const isMobile = useIsMobile()
  const actor = useCurrentUser()
  const canUseFreeRate = isMerchantAdminOrAbove(actor)

  // scopedContractList (not a raw merchantId filter) — same reasoning as
  // ContractDetailPage: Staff/Branch Manager shouldn't be able to reach
  // another branch's contract by guessing/typing its id.
  const maybeContract = scopedContractList(actor, MOCK_CONTRACTS).find(c => c.id === id)

  if (!maybeContract) {
    return (
      <PageEmptyState
        icon={<FileText size={22} strokeWidth={2.25} />}
        title="Contract not found"
        action={<Button onClick={() => navigate('/contracts')}>Back to list</Button>}
      />
    )
  }

  if (!canEditContractFields(actor, maybeContract)) {
    return (
      <PageEmptyState
        icon={<Lock size={22} strokeWidth={2.25} />}
        title="You can't edit this contract"
        description="Only the contract's own creator can edit it, and only while it's Draft, Pending Approval, or Rejected."
        action={<Button onClick={() => navigate(`/contracts/${maybeContract.id}`)}>Back to contract</Button>}
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
  const [templateForm] = Form.useForm<TemplateValues>()
  const [deviceInfoForm] = Form.useForm<DeviceInfoValues>()
  const [customerForm] = Form.useForm<CustomerValues>()

  // Ant Design Form instances lose their values on unmount between wizard
  // steps — captured into React state on each "Next" click instead of read
  // back off the (by-then-unmounted) Form. Seeded from the existing
  // contract so "Next" past a step the user never touched still carries
  // its original values forward.
  // The contract's unit was already identified and confirmed when it was
  // created, so it counts as found by IMEI — its IMEI and Serial Number stay
  // filled in unless a different unit is picked by browsing.
  const [device, setDevice] = useState<DeviceValues | null>({
    branch: contract.branch,
    productId: contract.device.productId,
    unitId: contract.device.unitId,
    source: 'imei',
  })
  const [deviceChoice, setDeviceChoice] = useState<DeviceChoice | null>({
    unitId: contract.device.unitId,
    productId: contract.device.productId,
    source: 'imei',
  })
  const [templateValues, setTemplateValues] = useState<TemplateValues | null>({
    templateId: contract.template.templateId,
    termMonths: contract.financing.paymentTermMonths,
    ratePercent: contract.financing.ratePercent,
    downPaymentPercent: contract.financing.downPaymentPercent,
  })
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfoValues | null>({
    imei1: contract.device.imei1,
    imei2: contract.device.imei2,
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

  const selectedTemplateId = Form.useWatch('templateId', templateForm) ?? templateValues?.templateId
  // The chosen term, for the rate shown under the term chips.
  const watchedTerm = Form.useWatch('termMonths', templateForm) as number | undefined
  // The unit's price and the down payment being set — what the down
  // payment's amount and a Free Rate profit are worked out against.
  const termsUnit = device ? MOCK_PRODUCT_UNITS.find(u => u.id === device.unitId) : undefined
  const termsProduct = termsUnit ? MOCK_PRODUCTS.find(p => p.id === termsUnit.productId) : undefined
  const termsDevicePrice = termsUnit && termsProduct ? termsUnit.customPrice ?? termsProduct.salesPrice : 0
  const watchedDown = Form.useWatch('downPaymentPercent', templateForm) as number | undefined
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId)

  function handleDeviceNext() {
    if (!deviceChoice) {
      message.error('Pick a unit to continue')
      return
    }
    setDevice({ branch: contract.branch, ...deviceChoice })
    setStep(1)
  }

  function handleTemplateNext() {
    templateForm.validateFields().then(values => {
      setTemplateValues(values)
      // Same as creating: filled in from an IMEI search (or the contract's
      // own unit), entered and matched when a unit was picked by browsing.
      const unit = MOCK_PRODUCT_UNITS.find(u => u.id === device!.unitId)!
      if (device!.source === 'imei') {
        deviceInfoForm.setFieldsValue({ serialNumber: unit.serialNumber, imei1: unit.imei1, imei2: unit.imei2 })
      } else if (deviceInfo?.serialNumber !== unit.serialNumber) {
        deviceInfoForm.setFieldsValue({ serialNumber: undefined, imei1: undefined, imei2: undefined })
      }
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
      imei1: deviceInfo.imei1 || undefined,
      imei2: deviceInfo.imei2 || undefined,
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
      sections: normalizeSections(selectedTemplate!.sections),
      commission: selectedTemplate!.commission,
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
    center: <HeaderSteps current={step} titles={steps.map(s => s.title)} />,
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
    <div className={isMobile ? 'ifix-wizard-page' : undefined}>
      <Card className={isMobile ? 'ifix-wizard-mobile' : undefined} style={{ marginBottom: isMobile ? 0 : 24 }}>
        {/* Same as CreateContractPage — see its own comment for why. */}
        <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 4 }}>{steps[step].title}</Typography.Title>
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>{steps[step].description}</Typography.Text>

        {step === 0 && (
          <Form layout="vertical">
            {/* The contract stays on its own branch; its current unit, held
                by this same contract, still counts as available. */}
            <SelectDevice
              actor={actor}
              branch={contract.branch}
              value={deviceChoice}
              onChange={setDeviceChoice}
              currentUnitId={originalUnitId}
            />
            <div className="ifix-wizard-actions">
              <Button type="primary" onClick={handleDeviceNext}>Next: Template & Terms</Button>
            </div>
          </Form>
        )}

        {step === 1 && (
          <Form form={templateForm} layout="vertical" initialValues={templateValues ?? undefined}>
            <Form.Item label="Contract Template" name="templateId" rules={[{ required: true, message: 'Required' }]}>
              <Select
                // A different template has its own terms: move to its
                // preferred one (as Price Check and Create do) rather than
                // keep a term it may not offer. The contract's own term
                // stays until the template changes.
                onChange={id => {
                  const template = templates.find(t => t.id === id)
                  const term = template ? preferredTermOf(template) : undefined
                  templateForm.setFieldsValue({
                    termMonths: term?.months,
                    ratePercent: term?.ratePercent,
                    // Kept, but pulled into the new template's allowed range.
                    downPaymentPercent: template ? clampDown(templateForm.getFieldValue('downPaymentPercent'), template) : undefined,
                  })
                }}
                placeholder="Select template"
                options={templates
                  .filter(t => t.type === 'fixed_rate' || canUseFreeRate)
                  .map(t => ({ value: t.id, label: `${t.name}${t.isDefault ? ' (Default)' : ''}${t.id === currentTemplate?.id && t.status !== 'active' ? ' (Archived)' : ''}` }))}
              />
            </Form.Item>

            {/* Terms as chips — the same control as Price Check's quote —
                then the down payment (by % or amount), then, on a Free Rate
                template, the interest (by rate or by profit). In that order:
                a profit target depends on how much is financed. */}
            {selectedTemplate && (
              <>
                <Form.Item
                  label="Payment Term"
                  name="termMonths"
                  rules={[{ required: true, message: 'Required' }]}
                  extra={selectedTemplate.type === 'fixed_rate' && watchedTerm !== undefined
                    ? `${selectedTemplate.fixedRateTerms!.find(t => t.months === watchedTerm)?.ratePercent ?? '—'}% per month`
                    : undefined}
                >
                  <TermChips
                    months={selectedTemplate.type === 'fixed_rate' ? selectedTemplate.fixedRateTerms!.map(t => t.months) : FREE_RATE_TERMS}
                    onChange={months => {
                      if (selectedTemplate.type !== 'fixed_rate') return
                      const rate = selectedTemplate.fixedRateTerms!.find(t => t.months === months)?.ratePercent
                      templateForm.setFieldValue('ratePercent', rate)
                    }}
                  />
                </Form.Item>
                <Form.Item label="Down Payment" name="downPaymentPercent" rules={[{ required: true, message: 'Required' }]}>
                  <DownPaymentField
                    devicePrice={termsDevicePrice}
                    min={selectedTemplate.minDownPaymentPercent}
                    max={selectedTemplate.maxDownPaymentPercent}
                  />
                </Form.Item>
                {selectedTemplate.type === 'free_rate' ? (
                  <Form.Item label="Interest" name="ratePercent" rules={[{ required: true, message: 'Required' }]}>
                    <InterestField
                      loanAmount={termsDevicePrice - Math.round(termsDevicePrice * (watchedDown ?? 0) / 100)}
                      months={watchedTerm}
                    />
                  </Form.Item>
                ) : (
                  <Form.Item name="ratePercent" hidden><InputNumber /></Form.Item>
                )}
              </>
            )}

            <Space className="ifix-wizard-actions">
              <Button onClick={() => setStep(0)}>Back</Button>
              <Button type="primary" onClick={handleTemplateNext} disabled={!selectedTemplate}>Next: Device Info</Button>
            </Space>
          </Form>
        )}

        {step === 2 && device && (() => {
          // Same rules as creating (see CreateContractPage): fixed when the
          // unit came from an IMEI search, entered and matched when browsed.
          const unit = MOCK_PRODUCT_UNITS.find(u => u.id === device.unitId)!
          const fromImei = device.source === 'imei'
          const mustMatch = (expected: (string | undefined)[], what: string) => ({
            validator: (_: unknown, value?: string) => (
              !value || fromImei || expected.includes(value.trim())
                ? Promise.resolve()
                : Promise.reject(new Error(`Doesn't match this unit's ${what}`))
            ),
          })
          const filledNote = fromImei ? 'Filled in from the IMEI search' : undefined
          return (
          <Form form={deviceInfoForm} layout="vertical" initialValues={fromImei ? deviceInfo ?? undefined : undefined}>
            {!fromImei && (
              <BoxLabelNote
                unit={unit}
                onFill={() => {
                  deviceInfoForm.setFieldsValue({ serialNumber: unit.serialNumber, imei1: unit.imei1, imei2: unit.imei2 })
                  deviceInfoForm.validateFields(['serialNumber', 'imei1', 'imei2'])
                }}
              />
            )}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Serial Number"
                  name="serialNumber"
                  extra={filledNote}
                  rules={[{ required: true, message: 'Required' }, mustMatch([unit.serialNumber], 'serial number')]}
                >
                  <Input disabled={fromImei} placeholder="From the box label" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="IMEI 1"
                  name="imei1"
                  extra={filledNote}
                  rules={[
                    ...(unit.imei1 ? [{ required: true, message: 'Required' }] : []),
                    mustMatch([unit.imei1, unit.imei2], 'IMEI'),
                  ]}
                >
                  <Input maxLength={15} inputMode="numeric" disabled={fromImei} placeholder={unit.imei1 ? '15 digits' : 'Optional'} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="IMEI 2" name="imei2" extra={filledNote} rules={[mustMatch([unit.imei1, unit.imei2], 'IMEI')]}>
                  <Input maxLength={15} inputMode="numeric" disabled={fromImei} placeholder="Optional" />
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
            <Space className="ifix-wizard-actions">
              <Button onClick={() => setStep(1)}>Back</Button>
              <Button type="primary" onClick={handleDeviceInfoNext}>Next: Customer</Button>
            </Space>
          </Form>
          )
        })()}

        {step === 3 && (
          <Form form={customerForm} layout="vertical" initialValues={customerValues ?? undefined}>
            <Row gutter={16}>
              <Col span={16}>
                {/* Look Up attached to the field's right end (Space.Compact)
                    rather than a separate column — a column pushed down to
                    the input's line by a fixed margin, which broke loose
                    onto its own row once columns stack on mobile. */}
                <Form.Item label="National ID / Passport" required>
                  <Space.Compact style={{ width: '100%' }}>
                    <Form.Item name="nationalId" noStyle rules={[{ required: true, message: 'Required' }]}>
                      <Input placeholder="X-XXXX-XXXXX-XX-X" />
                    </Form.Item>
                    <Button onClick={handleLookupCustomer}>Look Up</Button>
                  </Space.Compact>
                </Form.Item>
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
                  <DatePicker style={{ width: '100%' }} />
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
            <Space className="ifix-wizard-actions">
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
                  { label: 'IMEI 1', children: deviceInfo.imei1 || '—' },
                  { label: 'IMEI 2', children: deviceInfo.imei2 || '—' },
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

              <Space className="ifix-wizard-actions">
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
