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
    title: 'Hire Purchase Agreement',
    bindingStatement: 'This agreement is made between the Lessor and the Lessee, and both parties agree to the terms specified below.',
    legalDeclarations: 'The Lessee acknowledges and agrees to pay according to the installment schedule below. Failure to pay on time will be handled per the merchant’s terms.',
    penalty: {
      type: 'fixed_rate',
      ratePercent: 1.5,
      graceDays: 3,
      maxCap: 3000,
      legalText: 'If payment is late beyond the grace period, the Lessee agrees to pay a penalty at the specified rate, not to exceed the stated maximum cap.',
    },
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
    title: 'Hire Purchase Agreement — Premium',
    bindingStatement: 'This agreement is made between the Lessor and the Lessee for a high-value item, and both parties agree to the terms specified below.',
    legalDeclarations: 'The Lessee acknowledges and agrees to pay according to the installment schedule below. Failure to pay on time will be handled per the merchant’s terms.',
    penalty: {
      type: 'fixed_fee',
      flatFeeAmount: 300,
      graceDays: 5,
      maxCap: 5000,
      legalText: 'If payment is late beyond the grace period, the Lessee agrees to pay a penalty at the specified rate, not to exceed the stated maximum cap.',
    },
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
    title: 'Credit Sale Agreement — Easy Mode',
    bindingStatement: 'This agreement is made between the Seller and the Buyer, setting the rate and installment terms agreed specifically for this contract.',
    legalDeclarations: 'The Buyer acknowledges and agrees to pay according to the installment schedule below. Failure to pay on time will be handled per the merchant’s terms.',
    penalty: {
      type: 'fixed_rate',
      ratePercent: 2,
      graceDays: 0,
      maxCap: 4000,
      legalText: 'If payment is late beyond the grace period, the Buyer agrees to pay a penalty at the specified rate, not to exceed the stated maximum cap.',
    },
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
