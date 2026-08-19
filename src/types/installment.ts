import type { UserRole } from './user'

export type ContractStatus = 'normal' | 'bad_debt'
export type PaymentStatus = 'due' | 'overdue' | 'paid' | 'future'
export type StatusFilter = 'all' | PaymentStatus
export type { UserRole }

export interface InstallmentRecord {
  id: string
  invoiceNumber: string
  contractNumber: string
  customerName: string
  customerId: string
  branch: string
  contractStatus: ContractStatus
  totalAmount: number
  paidAmount: number
  dueAmount: number
  overdueAmount: number
  remainingBalance: number
  startDate: string
  endDate: string
  paymentStatus: PaymentStatus
}

export interface ScheduleItem {
  period: number
  dueDate: string
  principal: number
  interest: number
  totalInstallment: number
  paidDate: string | null
  status: 'paid' | 'due' | 'overdue' | 'future'
}

export interface PaymentRecord {
  receiptNumber: string
  paymentDate: string
  amount: number
  method: 'cash' | 'transfer' | 'card'
  receivedBy: string
  note: string
}

export interface CustomerInfo {
  id: string
  name: string
  idCardNumber: string
  phone: string
  email: string
  address: string
  occupation: string
}

export interface AuthUser {
  id: string
  name: string
  role: UserRole
  branch?: string
  merchantId?: string
}

export interface Product {
  id: string
  name: string
  brand: string
  model: string
  sku: string
  category: string
  color: string
  storage: string
  price: number
  cost: number
  stock: number
}

export interface ScheduleResult {
  monthlyInstallment: number
  totalInterest: number
  totalPayable: number
  flatRatePercent: number
  schedule: { period: number; dueDate: string; amount: number }[]
}
