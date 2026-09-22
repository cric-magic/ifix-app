import dayjs from 'dayjs'
import type { ContractDocumentData } from '../components/ContractDocument'
import type { Merchant } from '../types/merchant'
import type { Branch } from '../types/branch'
import { calcFixRate } from './calculator'
import { getWorkspaceAvatarUrl } from './avatar'

// Per the doc, "Sample values are used when no contract has been created
// yet" — the template preview lays the live content fields over this fixed
// sample device/customer/financials so the only thing that changes as the
// form is edited is what the template actually controls.
const SAMPLE = {
  devicePrice: 25900,
  downPaymentPercent: 20,
  customer: {
    name: 'สมชาย ใจดี (Sample Customer)',
    nationalId: '1-2345-67890-12-3',
    address: '99/1 ถนนสุขุมวิท กรุงเทพฯ',
    phone: '081-234-5678',
  },
  product: {
    condition: 'New',
    color: 'Space Black',
    imei1: '353241001234561',
    imei2: '353241001234562',
    brand: 'Apple',
    storage: '128GB',
    model: 'iPhone 14 Pro',
    serialNumber: 'SN-SAMPLE-0001',
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
