import type { Branch } from '../types/branch'
import { MERCHANT_ID } from './mockUsers'

// Names match the existing flat BRANCHES constant in mockData.ts (used by
// Products/Units/Installments/User branch-assignment selects) — same real
// locations, now with a full Branch record behind each one rather than a
// bare string. BRANCHES itself is left untouched; unifying every one of
// those unrelated features onto real Branch ids is a bigger follow-up, not
// part of building the Branch feature itself.
export const MOCK_BRANCHES: Branch[] = [
  {
    id: 'branch-bkk',
    merchantId: MERCHANT_ID,
    name: 'Bangkok HQ',
    code: 'BKK-01',
    address: '123 Sukhumvit Road, Klongtoey, Bangkok 10110',
    phone: '02-000-0001',
    status: 'active',
    taxId: '0105558123456',
    taxBranchCode: '00000',
    bankAccount: {
      id: 'branch-bank-bkk',
      bank: 'Kasikornbank (KBank)',
      accountNumber: '123-4-56789-0',
      accountName: 'Siam Gadget Repair Co., Ltd.',
      branch: 'Sukhumvit',
      isDefault: true,
    },
    createdBy: 'owner-1',
    createdAt: '2023-11-10T09:00:00.000Z',
    archivedBy: null,
    archivedAt: null,
  },
  {
    id: 'branch-cnx',
    merchantId: MERCHANT_ID,
    name: 'Chiang Mai',
    code: 'CNX-01',
    address: '45 Nimmanhaemin Road, Suthep, Chiang Mai 50200',
    phone: '053-000-0002',
    status: 'active',
    taxId: '0105558123456',
    taxBranchCode: '00001',
    bankAccount: {
      id: 'branch-bank-cnx',
      bank: 'Siam Commercial Bank (SCB)',
      accountNumber: '234-5-67890-1',
      accountName: 'Siam Gadget Repair Co., Ltd.',
      branch: 'Nimmanhaemin',
      isDefault: true,
    },
    createdBy: 'owner-1',
    createdAt: '2023-11-10T09:00:00.000Z',
    archivedBy: null,
    archivedAt: null,
  },
  {
    id: 'branch-hkt',
    merchantId: MERCHANT_ID,
    name: 'Phuket',
    code: 'HKT-01',
    address: '88 Thanon Phuket, Talat Yai, Phuket 83000',
    phone: '076-000-0003',
    status: 'active',
    taxId: '0105558123456',
    taxBranchCode: '00002',
    createdBy: 'owner-1',
    createdAt: '2023-11-10T09:00:00.000Z',
    archivedBy: null,
    archivedAt: null,
  },
  {
    id: 'branch-kkc',
    merchantId: MERCHANT_ID,
    name: 'Khon Kaen',
    code: 'KKC-01',
    address: '12 Mittraphap Road, Nai Mueang, Khon Kaen 40000',
    phone: '043-000-0004',
    status: 'active',
    taxId: '0105558123456',
    taxBranchCode: '00003',
    createdBy: 'admin-1',
    createdAt: '2023-11-15T09:00:00.000Z',
    archivedBy: null,
    archivedAt: null,
  },
]

export function generateBranchId(): string {
  return `branch-${Date.now()}`
}
