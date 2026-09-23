import dayjs from 'dayjs'
import type { ContractDocumentData } from '../components/ContractDocument'
import type { Merchant } from '../types/merchant'
import type { Branch } from '../types/branch'
import type { Contract } from '../types/contract'
import { calcFixRate } from './calculator'
import { getWorkspaceAvatarUrl } from './avatar'

// Per the doc, "Sample values are used when no contract has been created
// yet" — the template preview lays the live content fields over this fixed
// sample device/customer/financials so the only thing that changes as the
// form is edited is what the template actually controls.
const SAMPLE = {
  devicePrice: 41900,
  downPaymentPercent: 20,
  customer: {
    name: 'สมชาย ใจดี',
    nationalId: '1-2345-67890-12-3',
    address: '99/1 ถนนสุขุมวิท กรุงเทพฯ',
    phone: '081-234-5678',
  },
  product: {
    condition: 'New',
    color: 'Cosmic Orange',
    imei1: '352417000000001',
    imei2: '—',
    brand: 'Apple',
    storage: '256GB',
    model: 'iPhone 17 Pro',
    serialNumber: 'SN-IP17P-256-COR-BKK',
  },
}

interface SampleInput {
  merchant?: Merchant
  branch?: Branch
  content: ContractDocumentData['content']
  termMonths: number
  ratePercent: number
}

export function buildSampleContractDocument({
  merchant,
  branch,
  content,
  termMonths,
  ratePercent,
}: SampleInput): ContractDocumentData {
  const downPayment = Math.round(SAMPLE.devicePrice * SAMPLE.downPaymentPercent / 100)
  const loanAmount = SAMPLE.devicePrice - downPayment
  const calc = calcFixRate(loanAmount, ratePercent, termMonths)
  const createdAt = dayjs().format('D MMM YYYY')

  // Phase 1 prints the *branch's* payment account and QR, per the doc
  // ("use the payment account and QR code from the selected branch");
  // the merchant's own default is the fallback for a branch without one.
  const account = branch?.bankAccount ?? merchant?.bankAccounts.find(b => b.isDefault) ?? merchant?.bankAccounts[0]

  const schedule: ContractDocumentData['schedule'] = [
    {
      period: '1',
      amount: downPayment,
      label: 'เงินดาวน์ (Down Payment)',
      dueDate: createdAt,
      status: 'ชำระแล้ว',
    },
    ...Array.from({ length: termMonths }, (_, i) => ({
      period: String(i + 2),
      amount: calc.monthlyInstallment,
      label: `งวดผ่อนเดือนที่ ${i + 1}`,
      dueDate: dayjs().add(i + 1, 'month').format('D MMM YYYY'),
      status: i === 0 ? 'ถึงกำหนด' : 'รอชำระ',
    })),
  ]

  return {
    merchant: {
      name: merchant?.name ?? 'Merchant name',
      branchName: branch?.name ?? 'Branch name',
      legalAddress: merchant?.address ?? 'Merchant legal address',
      // The merchant's own number, per the doc's header and LESSOR block.
      // Falls back to the issuing branch's line where one isn't set.
      phone: merchant?.phone || branch?.phone || '—',
      // Same fallback the rest of the app uses for a merchant with no
      // uploaded logo (see WorkspaceAccountPage).
      logoUrl: merchant ? merchant.logoUrl ?? getWorkspaceAvatarUrl(merchant.id) : undefined,
      lineQrUrl: merchant?.lineQrUrl,
    },
    contract: {
      // A real contract number is assigned on creation; the preview shows
      // the merchant's own format so the shape is recognisable.
      number: `${merchant?.contractPrefix ?? 'XXX'}-${dayjs().format('YYYYMMDD')}-000001`,
      createdAt,
    },
    customer: SAMPLE.customer,
    product: SAMPLE.product,
    financials: {
      total: SAMPLE.devicePrice,
      downPayment,
      monthly: calc.monthlyInstallment,
      termMonths,
    },
    schedule,
    payment: {
      bankName: account?.bank ?? 'Bank name',
      accountNumber: account?.accountNumber ?? 'Account number',
      accountName: account?.accountName ?? 'Account name',
      promptPayQrUrl: account?.qrCodeUrl,
    },
    content,
  }
}

// Thai labels for the printed schedule. The stored labels are English
// ("Down Payment", "Installment 3") because they're also shown in the app's
// own schedule table; the printed contract is a Thai document.
const SCHEDULE_STATUS_TH: Record<string, string> = {
  paid: 'ชำระแล้ว',
  paid_late: 'ชำระล่าช้า',
  due: 'ถึงกำหนด',
  overdue: 'เกินกำหนด',
  future: 'รอชำระ',
}

// A real contract's printed document. Everything the template controls comes
// from the contract's own TemplateSnapshot rather than the live template —
// per the doc, "the printed contract uses the saved copy, not the latest
// version of the template."
export function buildContractDocument(
  contract: Contract,
  merchant: Merchant | undefined,
  branch: Branch | undefined,
): ContractDocumentData {
  const { device, customer, template, financing } = contract
  const account = branch?.bankAccount ?? merchant?.bankAccounts.find(b => b.isDefault) ?? merchant?.bankAccounts[0]
  const dash = '—'

  return {
    merchant: {
      name: merchant?.name ?? 'Merchant name',
      branchName: contract.branch,
      legalAddress: merchant?.address ?? dash,
      phone: merchant?.phone || branch?.phone || dash,
      logoUrl: merchant ? merchant.logoUrl ?? getWorkspaceAvatarUrl(merchant.id) : undefined,
      lineQrUrl: merchant?.lineQrUrl,
    },
    contract: {
      number: contract.contractNumber,
      createdAt: dayjs(contract.createdAt).format('D MMM YYYY'),
    },
    customer: {
      name: customer.fullName,
      nationalId: customer.nationalId,
      address: customer.currentAddress || customer.idCardAddress,
      phone: customer.phone,
      idCardPhotoUrl: contract.idCardPhotos.idCard,
      idCardWithOwnerPhotoUrl: contract.idCardPhotos.idCardWithOwner,
    },
    product: {
      condition: device.condition,
      color: device.color,
      imei1: device.imei1 ?? dash,
      imei2: device.imei2 ?? dash,
      brand: device.brand,
      storage: device.storage ?? dash,
      model: device.model,
      serialNumber: device.serialNumber,
    },
    financials: {
      total: financing.devicePrice,
      downPayment: financing.downPaymentAmount,
      monthly: financing.installmentAmount,
      termMonths: financing.paymentTermMonths,
    },
    // Period 0 is the down payment; the printed table numbers it งวดที่ 1
    // and counts the installments from there, matching the doc's layout.
    schedule: contract.schedule.map(item => ({
      period: String(item.period + 1),
      amount: item.amount,
      label: item.period === 0 ? 'เงินดาวน์ (Down Payment)' : `งวดผ่อนเดือนที่ ${item.period}`,
      dueDate: dayjs(item.dueDate).format('D MMM YYYY'),
      status: SCHEDULE_STATUS_TH[item.status] ?? item.status,
    })),
    payment: {
      bankName: account?.bank ?? dash,
      accountNumber: account?.accountNumber ?? dash,
      accountName: account?.accountName ?? dash,
      promptPayQrUrl: account?.qrCodeUrl,
    },
    content: {
      title: template.title,
      bindingStatement: template.bindingStatement,
      legalDeclarations: template.legalDeclarations,
      penaltyLegalText: template.penalty.legalText,
    },
  }
}
