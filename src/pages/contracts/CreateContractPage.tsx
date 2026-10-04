import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Card, Form, Input, Button, Space, Row, Col,
  Typography, Divider, Alert, Radio, message,
} from 'antd'
import { DatePicker } from '../../components/AppDatePicker'
import { InputNumber } from '../../components/AppInputNumber'
import dayjs from 'dayjs'
import { Check, X } from 'lucide-react'
import { Select } from '../../components/AppSelect'
import { TermChips } from '../../components/TermChips'
import { DownPaymentField } from '../../components/DownPaymentField'
import { InterestField } from '../../components/InterestField'
import { PhotoUpload } from '../../components/PhotoUpload'
import { HeaderSteps } from '../../components/HeaderSteps'
import { useIsMobile } from '../../components/useIsMobile'
import { useCurrentUser } from '../../contexts/AuthContext'
import { useSetHeaderContent } from '../../contexts/HeaderContentContext'
import { CurrencyDisplay } from '../../components/CurrencyDisplay'
import { DetailDescriptions } from '../../components/DetailDescriptions'
import { MOCK_PRODUCTS } from '../../constants/mockProducts'
import { MOCK_PRODUCT_UNITS } from '../../constants/mockProductUnits'
import { MOCK_MERCHANTS } from '../../constants/mockMerchants'
import { MOCK_CUSTOMERS, findCustomerByNationalId, generateCustomerId } from '../../constants/mockCustomers'
import { MOCK_CONTRACTS, generateContractId } from '../../constants/mockContracts'
import { FREE_RATE_TERMS, defaultTemplateOf, financingFor, preferredTermOf, clampDown, selectableTemplatesFor, type QuoteHandoff } from '../../utils/quote'
import type { ContractTemplate } from '../../types/contractTemplate'
import { generateContractNumber, submitContractForApproval } from '../../utils/contract'
import { canCreateContract } from '../../constants/roles'
import type { Contract } from '../../types/contract'
import type { Customer } from '../../types/customer'
import { normalizeSections } from '../../constants/contractSections'
import { MOCK_BRANCHES } from '../../constants/mockBranches'
import { BoxLabelNote } from './components/BoxLabelNote'
import { SelectDevice, type DeviceChoice, type DeviceSource } from './components/SelectDevice'
import { contractConditionOf } from '../../utils/product'

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

export function CreateContractPage() {
  const navigate = useNavigate()
  // Started from a Price Check quote: the branch, unit and terms arrive
  // already chosen, and the flow opens at Device with them filled in.
  const quote = (useLocation().state as { quote?: QuoteHandoff } | null)?.quote
  const isMobile = useIsMobile()
  const actor = useCurrentUser()
  const merchant = MOCK_MERCHANTS.find(m => m.id === actor.merchantId)

  // Steps by name rather than index: Merchant Admin/Owner get a Branch step
  // first (they manage several branches), which Staff and Branch Managers —
  // always on their own branch — skip, so the positions differ by role.
  type StepKey = 'branch' | 'device' | 'template' | 'deviceInfo' | 'customer' | 'preview'
  const stepKeys: StepKey[] = [
    ...(actor.branch ? [] : ['branch' as const]),
    'device', 'template', 'deviceInfo', 'customer', 'preview',
  ]
  const [step, setStep] = useState(() => (quote ? stepKeys.indexOf('device') : 0))
  const current = stepKeys[step]
  const goTo = (key: StepKey) => setStep(stepKeys.indexOf(key))

  // The contract's branch: the actor's own, or picked on the Branch step.
  const [branch, setBranch] = useState<string | undefined>(actor.branch ?? quote?.branch)
  // The unit picked on the Select Device step — kept here rather than in a
  // Form, since the step's own picker holds it across its two paths.
  const [deviceChoice, setDeviceChoice] = useState<DeviceChoice | null>(
    quote ? { unitId: quote.unitId, productId: quote.productId, source: 'browse' } : null,
  )
  const [templateForm] = Form.useForm<TemplateValues>()
  const [deviceInfoForm] = Form.useForm<DeviceInfoValues>()
  const [customerForm] = Form.useForm<CustomerValues>()

  // Ant Design Form instances lose their values on unmount between wizard
  // steps — captured into React state on each "Next" click instead of read
  // back off the (by-then-unmounted) Form.
  const [device, setDevice] = useState<DeviceValues | null>(null)
  const [templateValues, setTemplateValues] = useState<TemplateValues | null>(
    quote ? { templateId: quote.templateId, termMonths: quote.termMonths, ratePercent: quote.ratePercent, downPaymentPercent: quote.downPaymentPercent } : null,
  )
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfoValues | null>(null)
  const [customerValues, setCustomerValues] = useState<CustomerValues | null>(null)
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null)

  // Falls back to the snapshotted state once its own step's Form unmounts
  // (per the comment above — a watched field resets to undefined once its
  // Form is gone) — without it, `selectedTemplate` silently went undefined
  // again the moment the user left the Template & Terms step, and
  // handleSubmit's `selectedTemplate!.id` etc. at the Preview step threw
  // with zero visible feedback (no toast, no error boundary) since it's a
  // plain event-handler exception. Matches EditContractPage's own already-
  // correct version of these three.
  const selectedTemplateId = Form.useWatch('templateId', templateForm) ?? templateValues?.templateId
  // The chosen term, for the rate shown under the term chips.
  const watchedTerm = Form.useWatch('termMonths', templateForm) as number | undefined
  // The unit's price and the down payment being set — what the down
  // payment's amount and a Free Rate profit are worked out against.
  const termsUnit = device ? MOCK_PRODUCT_UNITS.find(u => u.id === device.unitId) : undefined
  const termsProduct = termsUnit ? MOCK_PRODUCTS.find(p => p.id === termsUnit.productId) : undefined
  const termsDevicePrice = termsUnit && termsProduct ? termsUnit.customPrice ?? termsProduct.salesPrice : 0
  const watchedDown = Form.useWatch('downPaymentPercent', templateForm) as number | undefined
  const selectableTemplates = selectableTemplatesFor(actor)
  const selectedTemplate = selectableTemplates.find(t => t.id === selectedTemplateId)

  const defaultTemplateId = defaultTemplateOf(selectableTemplates)?.id
  const defaultTemplate = selectableTemplates.find(t => t.id === defaultTemplateId)
  const defaultTerm = defaultTemplate ? preferredTermOf(defaultTemplate) : undefined
  function applyPreferredTerm(template: ContractTemplate | undefined) {
    const term = template ? preferredTermOf(template) : undefined
    templateForm.setFieldsValue({
      termMonths: term?.months,
      ratePercent: term?.ratePercent,
      // Kept, but pulled into the new template's allowed range.
      downPaymentPercent: template ? clampDown(templateForm.getFieldValue('downPaymentPercent'), template) : undefined,
    })
  }
  // This step's Form unmounts when the user leaves it, so its initialValues
  // re-apply on the way back — seeding them from the captured templateValues
  // keeps an earlier selection instead of resetting it to the default.

  const STEP_META: Record<StepKey, { title: string; description: string }> = {
    branch: { title: 'Branch', description: 'Choose the branch this contract belongs to — its inventory is what you can sell from.' },
    device: { title: 'Device', description: 'Browse by model, or scan the unit sticker or IMEI to find the unit.' },
    template: { title: 'Template & Terms', description: 'Choose a contract template and set the down payment and term.' },
    deviceInfo: { title: 'Device Info & Photos', description: "Confirm the unit's IMEI and serial number, then upload box photos." },
    customer: { title: 'Customer', description: 'Look up an existing customer by ID, or fill in a new one.' },
    preview: { title: 'Preview', description: 'Review the full contract summary before submitting.' },
  }
  const steps = stepKeys.map(key => STEP_META[key])

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
    center: <HeaderSteps current={step} titles={steps.map(s => s.title)} />,
    right: (
      <Button
        type="text"
        size="small"
        style={{ borderRadius: 6 }}
        icon={<X size={16} strokeWidth={2.25} />}
        onClick={() => navigate('/contracts')}
      />
    ),
  }, [step, stepKeys.length])

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

  // Active branches of this merchant, each with how many units it has
  // available — what the Branch step offers.
  const merchantBranches = MOCK_BRANCHES.filter(b => b.merchantId === actor.merchantId && b.status === 'active')
  const availableAt = (name: string) => MOCK_PRODUCT_UNITS.filter(u => u.branch === name && u.availability === 'available').length

  function handleBranchNext() {
    if (!branch) {
      message.error('Choose a branch to continue')
      return
    }
    goTo('device')
  }

  function handleDeviceNext() {
    if (!branch || !deviceChoice) {
      message.error('Pick a unit to continue')
      return
    }
    setDevice({ branch, ...deviceChoice })
    goTo('template')
  }

  function handleTemplateNext() {
    templateForm.validateFields().then(values => {
      setTemplateValues(values)
      // From IMEI Search the unit's IMEI and Serial Number arrive filled in
      // (and fixed); from Guided Browse they're entered from the box and
      // matched against the unit — kept if already entered for this unit.
      const unit = MOCK_PRODUCT_UNITS.find(u => u.id === device!.unitId)!
      if (device!.source === 'imei') {
        deviceInfoForm.setFieldsValue({ serialNumber: unit.serialNumber, imei1: unit.imei1, imei2: unit.imei2 })
      } else if (deviceInfo?.serialNumber !== unit.serialNumber) {
        deviceInfoForm.setFieldsValue({ serialNumber: undefined, imei1: undefined, imei2: undefined })
      }
      goTo('deviceInfo')
    })
  }

  function handleDeviceInfoNext() {
    deviceInfoForm.validateFields().then(values => {
      setDeviceInfo(values)
      goTo('customer')
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
      goTo('preview')
    })
  }

  function computeFinancing() {
    const product = MOCK_PRODUCTS.find(p => p.id === device!.productId)!
    const unit = MOCK_PRODUCT_UNITS.find(u => u.id === device!.unitId)!
    return financingFor(
      unit.customPrice ?? product.salesPrice,
      templateValues!.downPaymentPercent,
      templateValues!.ratePercent,
      templateValues!.termMonths,
    )
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
        condition: contractConditionOf(unit, product),
        imei1: deviceInfo.imei1 || undefined,
        imei2: deviceInfo.imei2 || undefined,
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
        sections: normalizeSections(selectedTemplate!.sections),
        commission: selectedTemplate!.commission,
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
      signedContract: null,
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
    <div className={isMobile ? 'ifix-wizard-page' : undefined}>
      <Card className={isMobile ? 'ifix-wizard-mobile' : undefined} style={{ marginBottom: isMobile ? 0 : 24 }}>
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

        {current === 'branch' && (
          <Form layout="vertical">
            <Form.Item required label="Branch">
              {/* A card per branch, with how much it has in stock — the
                  choice that decides which inventory the contract sells. */}
              <Radio.Group
                value={branch}
                onChange={e => {
                  // A different branch means a different inventory: any
                  // unit picked for the old one no longer applies.
                  if (e.target.value !== branch) setDeviceChoice(null)
                  setBranch(e.target.value)
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}
              >
                {merchantBranches.map(b => (
                  <Radio key={b.id} value={b.name} className="ifix-choice-card">
                    <span style={{ display: 'flex', flexDirection: 'column' }}>
                      <span>{b.name}</span>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {b.code} · {availableAt(b.name)} units available
                      </Typography.Text>
                    </span>
                  </Radio>
                ))}
              </Radio.Group>
            </Form.Item>
            <div className="ifix-wizard-actions">
              <Button type="primary" onClick={handleBranchNext}>Next: Device</Button>
            </div>
          </Form>
        )}

        {current === 'device' && branch && (
          <Form layout="vertical">
            <SelectDevice actor={actor} branch={branch} value={deviceChoice} onChange={setDeviceChoice} />
            <Space className="ifix-wizard-actions">
              {stepKeys[0] === 'branch' && <Button onClick={() => goTo('branch')}>Back</Button>}
              <Button type="primary" onClick={handleDeviceNext}>Next: Template & Terms</Button>
            </Space>
          </Form>
        )}

        {current === 'template' && (
          <Form
            form={templateForm}
            layout="vertical"
            initialValues={templateValues ?? {
              templateId: defaultTemplateId,
              // A term already chosen, the way Price Check's quote opens —
              // the default template's preferred term (and its rate).
              termMonths: defaultTerm?.months,
              ratePercent: defaultTerm?.ratePercent,
              // The template's smallest down payment, as a quote opens on.
              downPaymentPercent: defaultTemplate?.minDownPaymentPercent,
            }}
          >
            <Form.Item label="Contract Template" name="templateId" rules={[{ required: true, message: 'Required' }]}>
              <Select
                // A different template has its own terms: move to its
                // preferred one rather than keep a term it may not offer.
                onChange={id => applyPreferredTerm(selectableTemplates.find(t => t.id === id))}
                placeholder="Select template"
                options={selectableTemplates
                  .map(t => ({ value: t.id, label: `${t.name}${t.isDefault ? ' (Default)' : ''}` }))}
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
              <Button onClick={() => goTo('device')}>Back</Button>
              <Button type="primary" onClick={handleTemplateNext} disabled={!selectedTemplate}>Next: Device Info</Button>
            </Space>
          </Form>
        )}

        {current === 'deviceInfo' && device && (() => {
          // From IMEI Search: filled in and fixed — the scan already
          // identified the unit. From Guided Browse: entered from the box
          // label and checked against the chosen unit, so the paperwork
          // matches the device actually handed over.
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
          <Form form={deviceInfoForm} layout="vertical">
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
                {/* Required when the unit has an IMEI (a phone); blank for
                    devices that have none (laptops, accessories). */}
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
              <Button onClick={() => goTo('template')}>Back</Button>
              <Button type="primary" onClick={handleDeviceInfoNext}>Next: Customer</Button>
            </Space>
          </Form>
          )
        })()}

        {current === 'customer' && (
          <Form form={customerForm} layout="vertical">
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
              <Button onClick={() => goTo('deviceInfo')}>Back</Button>
              <Button type="primary" onClick={handleCustomerNext}>Next: Preview</Button>
            </Space>
          </Form>
        )}

        {current === 'preview' && device && templateValues && deviceInfo && customerValues && (() => {
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
                <Button onClick={() => goTo('customer')}>Back</Button>
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
