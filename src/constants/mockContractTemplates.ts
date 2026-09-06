import type { ContractTemplate } from '../types/contractTemplate'
import { MERCHANT_ID } from './mockUsers'

// Per the Contract Template doc: every new merchant gets a default Fixed
// Rate and a default Free Rate template. There's no template management UI
// yet (that's its own module, tracked separately) — these exist so
// Contract creation's "Select template" step has real, doc-shaped records
// to select from, and so a template CRUD page can be dropped in later
// against this same store.
export const MOCK_CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    id: 'tmpl-fixed-1',
    merchantId: MERCHANT_ID,
    name: 'Standard Fixed Rate',
    description: 'Default installment terms for new devices.',
    type: 'fixed_rate',
    status: 'active',
    isDefault: true,
    minDownPaymentPercent: 10,
    maxDownPaymentPercent: 50,
    maxLoanAmount: 100000,
    fixedRateTerms: [
      { months: 3, ratePercent: 1.25 },
      { months: 6, ratePercent: 1.5 },
      { months: 12, ratePercent: 1.75 },
      { months: 24, ratePercent: 2.0 },
    ],
    title: 'สัญญาเช่าซื้อสินค้า (Hire Purchase Agreement)',
    bindingStatement: 'สัญญาฉบับนี้ทำขึ้นระหว่างผู้ให้เช่าซื้อและผู้เช่าซื้อ โดยทั้งสองฝ่ายตกลงตามเงื่อนไขที่ระบุไว้ด้านล่างนี้',
    legalDeclarations: 'ผู้เช่าซื้อรับทราบและตกลงชำระเงินตามงวดที่กำหนดไว้ในตารางชำระเงินด้านล่าง หากผิดนัดชำระจะถูกดำเนินการตามข้อกำหนดของร้านค้า',
    createdBy: 'owner-1',
    createdAt: '2023-11-01T09:00:00.000Z',
    updatedBy: null,
    updatedAt: null,
  },
  {
    id: 'tmpl-fixed-2',
    merchantId: MERCHANT_ID,
    name: 'Premium Device Fixed Rate',
    description: 'Longer terms for higher-value devices (laptops, premium phones).',
    type: 'fixed_rate',
    status: 'active',
    isDefault: false,
    minDownPaymentPercent: 15,
    maxDownPaymentPercent: 60,
    maxLoanAmount: 150000,
    fixedRateTerms: [
      { months: 6, ratePercent: 1.4 },
      { months: 12, ratePercent: 1.6 },
      { months: 18, ratePercent: 1.85 },
      { months: 24, ratePercent: 2.1 },
    ],
    title: 'สัญญาเช่าซื้อสินค้า (Hire Purchase Agreement) — Premium',
    bindingStatement: 'สัญญาฉบับนี้ทำขึ้นระหว่างผู้ให้เช่าซื้อและผู้เช่าซื้อ สำหรับสินค้ามูลค่าสูง โดยทั้งสองฝ่ายตกลงตามเงื่อนไขที่ระบุไว้ด้านล่างนี้',
    legalDeclarations: 'ผู้เช่าซื้อรับทราบและตกลงชำระเงินตามงวดที่กำหนดไว้ในตารางชำระเงินด้านล่าง หากผิดนัดชำระจะถูกดำเนินการตามข้อกำหนดของร้านค้า',
    createdBy: 'owner-1',
    createdAt: '2023-11-01T09:05:00.000Z',
    updatedBy: null,
    updatedAt: null,
  },
  {
    id: 'tmpl-free-1',
    merchantId: MERCHANT_ID,
    name: 'Easy Mode Free Rate',
    description: 'Merchant Owner/Admin sets the rate and term per contract.',
    type: 'free_rate',
    status: 'active',
    isDefault: true,
    minDownPaymentPercent: 10,
    maxDownPaymentPercent: 70,
    maxLoanAmount: 200000,
    maxPaymentAmount: 500000,
    title: 'สัญญาขายเชื่อสินค้า (Credit Sale Agreement) — Easy Mode',
    bindingStatement: 'สัญญาฉบับนี้ทำขึ้นระหว่างผู้ขายและผู้ซื้อ โดยกำหนดอัตราและเงื่อนไขการผ่อนชำระตามที่ตกลงกันในสัญญานี้โดยเฉพาะ',
    legalDeclarations: 'ผู้ซื้อรับทราบและตกลงชำระเงินตามงวดที่กำหนดไว้ในตารางชำระเงินด้านล่าง หากผิดนัดชำระจะถูกดำเนินการตามข้อกำหนดของร้านค้า',
    createdBy: 'owner-1',
    createdAt: '2023-11-01T09:10:00.000Z',
    updatedBy: null,
    updatedAt: null,
  },
]

export function activeTemplatesFor(merchantId: string) {
  return MOCK_CONTRACT_TEMPLATES.filter(t => t.merchantId === merchantId && t.status === 'active')
}

export function generateContractTemplateId(): string {
  return `tmpl-${Date.now()}`
}
