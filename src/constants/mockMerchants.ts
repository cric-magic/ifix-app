import type { Merchant } from '../types/merchant'
import { MERCHANT_ID, MERCHANT_NAME } from './mockUsers'

// Thai bank list — matches the app's existing Thai-market flavor (THB
// formatting, Thai staff/customer names elsewhere in the mock data).
export const BANKS = [
  'Kasikornbank (KBank)',
  'Bangkok Bank',
  'Siam Commercial Bank (SCB)',
  'Krungthai Bank',
  'TMBThanachart (ttb)',
  'Krungsri (Bank of Ayudhya)',
]

export const MOCK_MERCHANTS: Merchant[] = [
  {
    id: MERCHANT_ID,
    name: MERCHANT_NAME,
    legalName: 'Siam Gadget Repair Co., Ltd.',
    address: '123 Sukhumvit Road, Klongtoey, Bangkok 10110',
    status: 'active',
    contractFormat: 'auto_running',
    contractPrefix: 'SGR',
    bankAccounts: [
      {
        id: 'bank-1',
        bank: 'Kasikornbank (KBank)',
        accountNumber: '123-4-56789-0',
        accountName: 'Siam Gadget Repair Co., Ltd.',
        branch: 'Sukhumvit',
        isDefault: true,
      },
    ],
    ownerName: 'Ake Somsak',
    ownerEmail: 'ake.owner@ifix.dev',
    ownerUserId: 'owner-1',
    createdBy: 'super-1',
    createdAt: '2023-11-01T09:10:00.000Z',
    suspendedBy: null,
    suspendedAt: null,
  },
  {
    id: 'merchant-2',
    name: 'TechFix Repair Co.',
    legalName: 'TechFix Repair Co., Ltd.',
    address: '88 Nimmanhaemin Road, Suthep, Chiang Mai 50200',
    status: 'active',
    contractFormat: 'random',
    contractPrefix: 'TFX',
    bankAccounts: [
      {
        id: 'bank-2',
        bank: 'Siam Commercial Bank (SCB)',
        accountNumber: '987-6-54321-0',
        accountName: 'TechFix Repair Co., Ltd.',
        branch: 'Nimmanhaemin',
        isDefault: true,
      },
      {
        id: 'bank-3',
        bank: 'Bangkok Bank',
        accountNumber: '111-2-22333-4',
        accountName: 'TechFix Repair Co., Ltd.',
        isDefault: false,
      },
    ],
    ownerName: 'Pim Chaiyasit',
    ownerEmail: 'pim@techfix.dev',
    ownerUserId: null,
    createdBy: 'super-1',
    createdAt: '2024-03-14T09:00:00.000Z',
    suspendedBy: null,
    suspendedAt: null,
  },
  {
    id: 'merchant-3',
    name: 'Mobile Medic',
    legalName: 'Mobile Medic Repair Ltd.',
    address: '45 Thanon Phuket, Talat Yai, Phuket 83000',
    status: 'suspended',
    contractFormat: 'auto_running',
    contractPrefix: 'MMD',
    bankAccounts: [],
    ownerName: 'Nattapong Sae-lee',
    ownerEmail: 'nattapong@mobilemedic.dev',
    ownerUserId: null,
    createdBy: 'super-1',
    createdAt: '2024-07-02T09:00:00.000Z',
    suspendedBy: 'super-1',
    suspendedAt: '2026-05-20T09:00:00.000Z',
  },
]

export function generateMerchantId(): string {
  return `merchant-${Date.now()}`
}

export function generateBankAccountId(): string {
  return `bank-${Date.now()}`
}

// Purely a display preview of "what the next contract number would look
// like" — not wired to real contract creation, since Contracts itself
// isn't final yet (no MOCK_CONTRACTS to count against). auto_running shows
// the first number of the current month; random shows a real sample UUID
// so the "not traceable" property is visible, not just described.
export function previewContractNumber(merchant: Pick<Merchant, 'contractFormat' | 'contractPrefix'>): string {
  if (merchant.contractFormat === 'random') {
    const uuid = crypto.randomUUID().toUpperCase()
    return merchant.contractPrefix ? `${merchant.contractPrefix}-${uuid}` : uuid
  }
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const seq = '000001'
  return merchant.contractPrefix ? `${merchant.contractPrefix}-${yyyy}${mm}${dd}-${seq}` : `${yyyy}${mm}${dd}-${seq}`
}
