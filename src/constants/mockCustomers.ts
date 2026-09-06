import type { Customer } from '../types/customer'
import { MERCHANT_ID } from './mockUsers'

// Standalone Customer records — per the Customer doc these are currently
// only created/edited inline during contract creation (no list/edit UI
// until Phase 2), but Contract's customer step needs real records to look
// up by National ID and prefill from, and a future Customers module can
// read straight off this store without a data migration.
export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'cust-001',
    merchantId: MERCHANT_ID,
    nationalId: '1-1001-00001-00-1',
    fullName: 'Somchai Jaidee',
    phone: '081-234-5678',
    dateOfBirth: '1988-04-12',
    email: 'somchai@email.com',
    idCardAddress: '123 Sukhumvit Rd, Klongtoey, Bangkok 10110',
    currentAddress: '123 Sukhumvit Rd, Klongtoey, Bangkok 10110',
    workplaceAddress: '45 Asoke Tower, Bangkok 10110',
    blacklisted: false,
    createdBy: 'staff-2',
    createdAt: '2024-01-15T09:00:00.000Z',
  },
  {
    id: 'cust-002',
    merchantId: MERCHANT_ID,
    nationalId: '1-5001-00002-00-2',
    fullName: 'Malee Srisuk',
    phone: '082-345-6789',
    dateOfBirth: '1990-09-02',
    email: 'malee@email.com',
    idCardAddress: '456 Nimmanhaemin Rd, Suthep, Chiang Mai 50200',
    currentAddress: '456 Nimmanhaemin Rd, Suthep, Chiang Mai 50200',
    blacklisted: false,
    createdBy: 'branch-1',
    createdAt: '2024-02-01T09:00:00.000Z',
  },
  {
    id: 'cust-003',
    merchantId: MERCHANT_ID,
    nationalId: '1-8301-00003-00-3',
    fullName: 'Prapat Wannasin',
    phone: '083-456-7890',
    dateOfBirth: '1985-01-20',
    email: 'prapat@email.com',
    idCardAddress: '789 Thanon Phuket, Talat Yai, Phuket 83000',
    currentAddress: '789 Thanon Phuket, Talat Yai, Phuket 83000',
    workplaceAddress: '12 Patong Beach Rd, Phuket 83150',
    blacklisted: true,
    createdBy: 'branch-2',
    createdAt: '2023-11-01T09:00:00.000Z',
  },
  {
    id: 'cust-004',
    merchantId: MERCHANT_ID,
    nationalId: '1-4001-00004-00-4',
    fullName: 'Nattaya Boonsri',
    phone: '084-567-8901',
    dateOfBirth: '1993-06-30',
    email: 'nattaya@email.com',
    idCardAddress: '321 Mittraphap Rd, Nai Mueang, Khon Kaen 40000',
    currentAddress: '321 Mittraphap Rd, Nai Mueang, Khon Kaen 40000',
    blacklisted: false,
    createdBy: 'staff-1',
    createdAt: '2024-03-01T09:00:00.000Z',
  },
  {
    id: 'cust-005',
    merchantId: MERCHANT_ID,
    nationalId: '1-1001-00005-00-5',
    fullName: 'Wanchai Phromma',
    phone: '085-678-9012',
    dateOfBirth: '1979-12-08',
    email: 'wanchai@email.com',
    idCardAddress: '654 Silom Rd, Bang Rak, Bangkok 10500',
    currentAddress: '654 Silom Rd, Bang Rak, Bangkok 10500',
    workplaceAddress: '88 Sathorn Tower, Bangkok 10120',
    blacklisted: false,
    createdBy: 'staff-3',
    createdAt: '2024-01-01T09:00:00.000Z',
  },
  {
    id: 'cust-006',
    merchantId: MERCHANT_ID,
    nationalId: '1-5001-00006-00-6',
    fullName: 'Siriporn Thaweesak',
    phone: '086-789-0123',
    dateOfBirth: '1991-03-17',
    email: 'siriporn@email.com',
    idCardAddress: '987 Chang Klan Rd, Chang Khlan, Chiang Mai 50100',
    currentAddress: '987 Chang Klan Rd, Chang Khlan, Chiang Mai 50100',
    blacklisted: false,
    createdBy: 'branch-1',
    createdAt: '2023-09-01T09:00:00.000Z',
  },
]

export function findCustomerByNationalId(merchantId: string, nationalId: string): Customer | undefined {
  return MOCK_CUSTOMERS.find(c => c.merchantId === merchantId && c.nationalId === nationalId)
}

export function generateCustomerId(): string {
  return `cust-${Date.now()}`
}
