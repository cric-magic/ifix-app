// Replaces the old InstallmentRecord/ScheduleItem/PaymentRecord/CustomerInfo
// trio from types/installment.ts — that file's naming was only half-renamed
// from "Installment" to "Contract" (fields like contractNumber/
// contractStatus sat on a type still called InstallmentRecord), with none
// of the doc's actual status lifecycle, template snapshotting, or approval
// routing. This is a full rewrite against the Contract doc, not a rename.
//
// types/installment.ts itself is left alone — Product/AuthUser/UserRole/
// ScheduleResult there are shared far outside this module (SmartCalculator,
// Products pages, roles.ts) and aren't part of the rename.
import type { ContractTemplateType } from './contractTemplate'

// The doc's full lifecycle. Defaulted/Closed are explicitly called out as
// "proposed — TBD" / out of scope, but included here (unused by the
// creation flow) so StatusTag/list filtering has real cases to show rather
// than needing a follow-up type change later.
export type ContractStatus =
  | 'draft'
  | 'pending_approval'
  | 'under_review'
  | 'rejected'
  | 'approved'
  | 'awaiting_signature'
  | 'pending_payment'
  | 'active'
  | 'overdue'
  | 'settled'
  | 'defaulted'
  | 'closed'

// Stored as a snapshot on the contract, independent of the linked Customer
// record — per the doc, edits to the Customer record later must not change
// what's already saved on the contract.
export interface CustomerSnapshot {
  fullName: string
  nationalId: string
  phone: string
  dateOfBirth: string
  email?: string
  idCardAddress: string
  currentAddress: string
  workplaceAddress?: string
}

export interface DeviceSnapshot {
  productId: string
  unitId: string
  productName: string
  brand: string
  model: string
  storage?: string
  color: string
  // "New" for new-inventory units, or the used unit's grade (A/B/C/D).
  condition: string
  imei: string
  serialNumber: string
}

// The selected template's content, copied onto the contract at creation —
// per the doc, later edits to the template must never affect an existing
// contract, and the printed contract always reads from this snapshot, not
// the live template.
export interface TemplateSnapshot {
  templateId: string
  templateName: string
  type: ContractTemplateType
  title: string
  bindingStatement: string
  legalDeclarations: string
}

export interface FinancingTerms {
  devicePrice: number
  downPaymentPercent: number
  downPaymentAmount: number
  ratePercent: number
  paymentTermMonths: number
  installmentAmount: number
  totalContractValue: number
}

// period 0 is always the down payment row; 1..n are the monthly
// installments. Generated at activation per the doc — draft/pending/
// approved-stage contracts carry an empty schedule.
export interface ScheduleItem {
  period: number
  label: string
  dueDate: string
  amount: number
  paidDate: string | null
  // 'paid_late' per the Payment doc's own distinct item status ("Paid" vs
  // "Paid (Late)") — set when the payment covering this item was recorded
  // after its due date, same as an on-time payment in every other respect.
  status: 'paid' | 'paid_late' | 'due' | 'overdue' | 'future'
}

export interface ContractPaymentRecord {
  id: string
  period: number
  paymentDate: string
  amount: number
  method: 'cash' | 'transfer' | 'card'
  receivedBy: string
  note?: string
  // Payment slip photo(s) — the doc requires at least one; more can be
  // added later but "photos cannot be edited or deleted" once uploaded.
  slipPhotos?: string[]
  // Void — per the Payment doc's own permission matrix ("Void payment
  // record", Phase 1, not the Phase 2 "Adjust"). A voided record stays in
  // the list (audit trail) but no longer counts toward the schedule.
  voided?: boolean
  voidReason?: string
  voidedBy?: string | null
  voidedAt?: string | null
}

// Required box photos per the doc; Back/Seal-Wrap are optional. Reuses the
// same shape as ProductUnit's own UnitPhotos (captured once at unit
// registration) — contract creation re-displays those as a starting point
// but photos here are the contract's own copy, not a live reference.
export interface DevicePhotos {
  front?: string
  back?: string
  imeiLabel?: string
  sealWrap?: string
}

// Photos of the customer's ID card — stored on the contract only, never on
// the Customer record (re-captured for every new contract per the doc).
export interface IdCardPhotos {
  idCard?: string
  idCardWithOwner?: string
}

export interface Contract {
  id: string
  contractNumber: string
  status: ContractStatus
  merchantId: string
  branch: string
  device: DeviceSnapshot
  devicePhotos: DevicePhotos
  idCardPhotos: IdCardPhotos
  // Links back to the Customer record used to create this contract — kept
  // for "contract history" lookups from a future Customer detail page.
  // Nullable only in principle (every contract in this prototype resolves
  // one at creation).
  customerId: string | null
  customer: CustomerSnapshot
  template: TemplateSnapshot
  financing: FinancingTerms
  schedule: ScheduleItem[]
  payments: ContractPaymentRecord[]
  rejectionNote: string | null
  signedContractUploaded: boolean
  createdBy: string
  createdAt: string
  submittedBy: string | null
  submittedAt: string | null
  approvedBy: string | null
  approvedAt: string | null
  rejectedBy: string | null
  rejectedAt: string | null
  activatedAt: string | null
  settledAt: string | null
}
