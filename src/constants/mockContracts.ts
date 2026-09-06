import dayjs from 'dayjs'
import type { Contract, ContractStatus, ScheduleItem, ContractPaymentRecord, DeviceSnapshot, CustomerSnapshot, TemplateSnapshot } from '../types/contract'
import type { ContractTemplate } from '../types/contractTemplate'
import { calcFixRate } from '../utils/calculator'
import { MERCHANT_ID } from './mockUsers'
import { MOCK_PRODUCTS } from './mockProducts'
import { MOCK_PRODUCT_UNITS } from './mockProductUnits'
import { MOCK_CUSTOMERS } from './mockCustomers'
import { MOCK_CONTRACT_TEMPLATES } from './mockContractTemplates'

function deviceSnapshotFor(unitId: string): DeviceSnapshot {
  const unit = MOCK_PRODUCT_UNITS.find(u => u.id === unitId)!
  const product = MOCK_PRODUCTS.find(p => p.id === unit.productId)!
  return {
    productId: product.id,
    unitId: unit.id,
    productName: product.name,
    brand: product.brand,
    model: product.model,
    storage: product.storage,
    color: product.color,
    condition: unit.grade ?? 'New',
    imei: unit.imei,
    serialNumber: unit.serialNumber,
  }
}

function customerSnapshotFor(customerId: string): CustomerSnapshot {
  const c = MOCK_CUSTOMERS.find(x => x.id === customerId)!
  return {
    fullName: c.fullName,
    nationalId: c.nationalId,
    phone: c.phone,
    dateOfBirth: c.dateOfBirth,
    email: c.email,
    idCardAddress: c.idCardAddress,
    currentAddress: c.currentAddress,
    workplaceAddress: c.workplaceAddress,
  }
}

function templateSnapshotFor(template: ContractTemplate): TemplateSnapshot {
  return {
    templateId: template.id,
    templateName: template.name,
    type: template.type,
    title: template.title,
    bindingStatement: template.bindingStatement,
    legalDeclarations: template.legalDeclarations,
    penalty: template.penalty,
  }
}

// Builds the down-payment-plus-installments schedule and any payments
// already recorded against it, relative to "now" (via dayjs()) rather than
// fixed calendar dates — so a contract seeded as "overdue" stays overdue
// (and "paid" stays paid) no matter when this prototype is actually run.
function buildScheduleAndPayments(
  devicePrice: number,
  downPaymentPercent: number,
  ratePercent: number,
  termMonths: number,
  monthsSinceStart: number,
  paidCount: number,
  overdueCount: number,
) {
  const downPaymentAmount = Math.round(devicePrice * downPaymentPercent / 100)
  const loanAmount = devicePrice - downPaymentAmount
  const calc = calcFixRate(loanAmount, ratePercent, termMonths)
  const startDate = dayjs().subtract(monthsSinceStart, 'month')

  const schedule: ScheduleItem[] = [
    {
      period: 0,
      label: 'Down Payment',
      dueDate: startDate.format('YYYY-MM-DD'),
      amount: downPaymentAmount,
      paidDate: startDate.format('YYYY-MM-DD'),
      status: 'paid',
    },
  ]
  const payments: ContractPaymentRecord[] = [
    { id: `pay-${Date.now()}-0`, period: 0, paymentDate: startDate.format('YYYY-MM-DD'), amount: downPaymentAmount, method: 'transfer', receivedBy: 'system', note: 'Down payment' },
  ]

  for (let i = 1; i <= termMonths; i++) {
    const dueDate = startDate.add(i, 'month')
    let status: ScheduleItem['status']
    let paidDate: string | null = null
    if (i <= paidCount) {
      status = 'paid'
      paidDate = dueDate.format('YYYY-MM-DD')
      payments.push({
        id: `pay-${Date.now()}-${i}`,
        period: i,
        paymentDate: paidDate,
        amount: calc.monthlyInstallment,
        method: i % 2 === 0 ? 'cash' : 'transfer',
        receivedBy: 'system',
      })
    } else if (i <= paidCount + overdueCount) {
      status = 'overdue'
    } else if (i === paidCount + overdueCount + 1) {
      status = dueDate.isBefore(dayjs()) ? 'overdue' : 'due'
    } else {
      status = 'future'
    }
    schedule.push({
      period: i,
      label: `Installment ${i}`,
      dueDate: dueDate.format('YYYY-MM-DD'),
      amount: calc.monthlyInstallment,
      paidDate,
      status,
    })
  }

  const financing = {
    devicePrice,
    downPaymentPercent,
    downPaymentAmount,
    ratePercent,
    paymentTermMonths: termMonths,
    installmentAmount: calc.monthlyInstallment,
    totalContractValue: Math.round(downPaymentAmount + calc.totalPayable),
  }

  return { financing, schedule, payments }
}

const tmplFixed1 = MOCK_CONTRACT_TEMPLATES.find(t => t.id === 'tmpl-fixed-1')!
const tmplFixed2 = MOCK_CONTRACT_TEMPLATES.find(t => t.id === 'tmpl-fixed-2')!

interface Seed {
  id: string
  contractNumber: string
  status: ContractStatus
  branch: string
  unitId: string
  customerId: string
  template: ContractTemplate
  downPaymentPercent: number
  termMonths: number
  createdBy: string
  monthsSinceStart: number
  paidCount: number
  overdueCount: number
  submittedBy?: string
  approvedBy?: string
  rejectedBy?: string
  rejectionNote?: string
  signedContractUploaded?: boolean
}

// Contract numbers follow the demo merchant's own contractFormat/
// contractPrefix (auto_running, "SGR" — see mockMerchants.ts), same format
// generateContractNumber produces for real. Each is dated to its own
// monthsSinceStart offset with a sequence reset per month, approximating
// (not exactly replicating) the real per-month counter.
function seedContractNumber(monthsSinceStart: number, seqInMonth: number): string {
  const d = dayjs().subtract(monthsSinceStart, 'month')
  return `SGR-${d.format('YYYYMM')}01-${String(seqInMonth).padStart(6, '0')}`
}

const SEEDS: Seed[] = [
  { id: 'contract-001', contractNumber: seedContractNumber(0, 1), status: 'draft', branch: 'Khon Kaen', unitId: 'unit-5', customerId: 'cust-004', template: tmplFixed1, downPaymentPercent: 20, termMonths: 12, createdBy: 'staff-1', monthsSinceStart: 0, paidCount: 0, overdueCount: 0 },
  { id: 'contract-002', contractNumber: seedContractNumber(0, 2), status: 'pending_approval', branch: 'Bangkok HQ', unitId: 'unit-1', customerId: 'cust-001', template: tmplFixed1, downPaymentPercent: 15, termMonths: 6, createdBy: 'staff-2', monthsSinceStart: 0, paidCount: 0, overdueCount: 0, submittedBy: 'staff-2' },
  { id: 'contract-003', contractNumber: seedContractNumber(0, 3), status: 'under_review', branch: 'Bangkok HQ', unitId: 'unit-2', customerId: 'cust-005', template: tmplFixed2, downPaymentPercent: 20, termMonths: 12, createdBy: 'staff-2', monthsSinceStart: 0, paidCount: 0, overdueCount: 0, submittedBy: 'staff-2' },
  { id: 'contract-004', contractNumber: seedContractNumber(1, 4), status: 'rejected', branch: 'Khon Kaen', unitId: 'unit-5', customerId: 'cust-004', template: tmplFixed1, downPaymentPercent: 15, termMonths: 12, createdBy: 'staff-1', monthsSinceStart: 1, paidCount: 0, overdueCount: 0, submittedBy: 'staff-1', rejectedBy: 'admin-1', rejectionNote: 'ID card photo is blurry — please re-upload a clearer copy.' },
  { id: 'contract-005', contractNumber: seedContractNumber(0, 4), status: 'approved', branch: 'Phuket', unitId: 'unit-4', customerId: 'cust-003', template: tmplFixed1, downPaymentPercent: 25, termMonths: 12, createdBy: 'branch-2', monthsSinceStart: 0, paidCount: 0, overdueCount: 0, approvedBy: 'branch-2' },
  { id: 'contract-006', contractNumber: seedContractNumber(0, 5), status: 'awaiting_signature', branch: 'Bangkok HQ', unitId: 'unit-1', customerId: 'cust-001', template: tmplFixed1, downPaymentPercent: 15, termMonths: 6, createdBy: 'staff-2', monthsSinceStart: 0, paidCount: 0, overdueCount: 0, submittedBy: 'staff-2', approvedBy: 'admin-1' },
  { id: 'contract-007', contractNumber: seedContractNumber(1, 5), status: 'pending_payment', branch: 'Chiang Mai', unitId: 'unit-9', customerId: 'cust-002', template: tmplFixed2, downPaymentPercent: 20, termMonths: 12, createdBy: 'branch-1', monthsSinceStart: 1, paidCount: 0, overdueCount: 0, approvedBy: 'branch-1', signedContractUploaded: true },
  { id: 'contract-008', contractNumber: seedContractNumber(3, 2), status: 'active', branch: 'Chiang Mai', unitId: 'unit-6', customerId: 'cust-006', template: tmplFixed1, downPaymentPercent: 20, termMonths: 12, createdBy: 'branch-1', monthsSinceStart: 3, paidCount: 3, overdueCount: 0, approvedBy: 'branch-1', signedContractUploaded: true },
  { id: 'contract-009', contractNumber: seedContractNumber(3, 3), status: 'overdue', branch: 'Bangkok HQ', unitId: 'unit-1', customerId: 'cust-005', template: tmplFixed1, downPaymentPercent: 10, termMonths: 6, createdBy: 'staff-2', monthsSinceStart: 3, paidCount: 1, overdueCount: 2, submittedBy: 'staff-2', approvedBy: 'admin-1', signedContractUploaded: true },
  { id: 'contract-010', contractNumber: seedContractNumber(7, 1), status: 'settled', branch: 'Phuket', unitId: 'unit-13', customerId: 'cust-003', template: tmplFixed2, downPaymentPercent: 30, termMonths: 6, createdBy: 'branch-2', monthsSinceStart: 7, paidCount: 6, overdueCount: 0, approvedBy: 'branch-2', signedContractUploaded: true },
]

export const MOCK_CONTRACTS: Contract[] = SEEDS.map(seed => {
  const device = deviceSnapshotFor(seed.unitId)
  const product = MOCK_PRODUCTS.find(p => p.id === device.productId)!
  const rate = seed.template.fixedRateTerms!.find(t => t.months === seed.termMonths)?.ratePercent
    ?? seed.template.fixedRateTerms![0].ratePercent
  const { financing, schedule, payments } = buildScheduleAndPayments(
    product.salesPrice,
    seed.downPaymentPercent,
    rate,
    seed.termMonths,
    seed.monthsSinceStart,
    seed.paidCount,
    seed.overdueCount,
  )
  // Draft/pending/under-review/rejected/approved contracts haven't reached
  // activation yet — no schedule/payments exist for them per the doc
  // ("Payment schedule — generated at activation").
  const preActivation: ContractStatus[] = ['draft', 'pending_approval', 'under_review', 'rejected', 'approved', 'awaiting_signature', 'pending_payment']
  const isPreActivation = preActivation.includes(seed.status)

  const createdAt = dayjs().subtract(seed.monthsSinceStart, 'month').toISOString()

  return {
    id: seed.id,
    contractNumber: seed.contractNumber,
    status: seed.status,
    merchantId: MERCHANT_ID,
    branch: seed.branch,
    device,
    devicePhotos: { front: product.photos?.[0], imeiLabel: product.photos?.[0] },
    idCardPhotos: {},
    customerId: seed.customerId,
    customer: customerSnapshotFor(seed.customerId),
    template: templateSnapshotFor(seed.template),
    financing,
    schedule: isPreActivation ? [] : schedule,
    payments: isPreActivation ? [] : payments,
    collectionFees: [],
    penaltyAdjustments: [],
    penaltyChargedTotal: 0,
    penaltyBalance: 0,
    collectionFeeBalance: 0,
    rejectionNote: seed.rejectionNote ?? null,
    signedContractUploaded: seed.signedContractUploaded ?? false,
    createdBy: seed.createdBy,
    createdAt,
    submittedBy: seed.submittedBy ?? null,
    submittedAt: seed.submittedBy ? createdAt : null,
    approvedBy: seed.approvedBy ?? null,
    approvedAt: seed.approvedBy ? createdAt : null,
    rejectedBy: seed.rejectedBy ?? null,
    rejectedAt: seed.rejectedBy ? createdAt : null,
    activatedAt: isPreActivation ? null : createdAt,
    settledAt: seed.status === 'settled' ? dayjs().subtract(1, 'day').toISOString() : null,
  }
})

export function generateContractId(): string {
  return `contract-${Date.now()}`
}
