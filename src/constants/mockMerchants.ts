import type { BarcodeSettings, Merchant } from '../types/merchant'
import { MERCHANT_ID, MERCHANT_NAME } from './mockUsers'

// What a merchant gets before anyone visits Settings > Barcode: both code
// types printed (a scanner that can't read one can read the other), the
// Serial Number encoded (the identifier staff already know), and only the
// product name alongside it. Sales price is off by default — labels sit on
// stock that hasn't been priced for a specific contract yet.
export const DEFAULT_BARCODE_SETTINGS: BarcodeSettings = {
  codeTypes: 'both',
  encodedValue: 'serialNumber',
  showProductName: true,
  showSkuCode: false,
  showBranch: false,
  showSalesPrice: false,
}

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
    phone: '02-000-0001',
    lineQrUrl: '/mock/line-qr-merchant-1.png',
    status: 'active',
    contractFormat: 'auto_running',
    contractPrefix: 'SGR',
    bankAccounts: [
      {
        id: 'bank-1',
        qrCodeUrl: '/mock/promptpay-bank-1.png',
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
    collectionFeeEnabled: true,
    collectionFeeAmount: 200,
    barcodeSettings: { ...DEFAULT_BARCODE_SETTINGS, showSkuCode: true, showBranch: true },
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
    phone: '053-000-0002',
    lineQrUrl: '/mock/line-qr-merchant-2.png',
    status: 'active',
    contractFormat: 'random',
    contractPrefix: 'TFX',
    bankAccounts: [
      {
        id: 'bank-2',
        qrCodeUrl: '/mock/promptpay-bank-2.png',
        bank: 'Siam Commercial Bank (SCB)',
        accountNumber: '987-6-54321-0',
        accountName: 'TechFix Repair Co., Ltd.',
        branch: 'Nimmanhaemin',
        isDefault: true,
      },
      {
        id: 'bank-3',
        qrCodeUrl: '/mock/promptpay-bank-3.png',
        bank: 'Bangkok Bank',
        accountNumber: '111-2-22333-4',
        accountName: 'TechFix Repair Co., Ltd.',
        isDefault: false,
      },
    ],
    ownerName: 'Pim Chaiyasit',
    ownerEmail: 'pim@techfix.dev',
    ownerUserId: null,
    collectionFeeEnabled: true,
    collectionFeeAmount: 150,
    barcodeSettings: { ...DEFAULT_BARCODE_SETTINGS, codeTypes: 'qr', encodedValue: 'unitId' },
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
    phone: '076-000-0003',
    lineQrUrl: '/mock/line-qr-merchant-3.png',
    status: 'suspended',
    contractFormat: 'auto_running',
    contractPrefix: 'MMD',
    bankAccounts: [],
    ownerName: 'Nattapong Sae-lee',
    ownerEmail: 'nattapong@mobilemedic.dev',
    ownerUserId: null,
    collectionFeeEnabled: false,
    collectionFeeAmount: 0,
    barcodeSettings: DEFAULT_BARCODE_SETTINGS,
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

// A display-only preview of "what the next contract number would look
// like" for the Merchant settings screen — shown before any contract has
// been created against this exact number. Real generation (which counts
// actual same-month contracts for auto_running) lives in
// utils/contract.ts's generateContractNumber; this one always previews the
// first number of the month so the settings page doesn't need real
// contract data just to show the format. auto_running shows the first
// number of the current month; random shows a real sample UUID so the
// "not traceable" property is visible, not just described.
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
