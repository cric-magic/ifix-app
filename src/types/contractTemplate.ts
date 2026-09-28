// Per the Contract Template doc. Only what Contract's "Select template"
// step and its snapshot-on-use behavior need. Commission, originally Phase
// 2, is modeled as a simple optional contract section (see CommissionRule). Penalty (also Phase 2) IS modeled — see the
// Penalty doc's own rework: "Penalty rules are set in the Contract
// Template and copied into each new contract."
export type ContractTemplateType = 'fixed_rate' | 'free_rate'
export type ContractTemplateStatus = 'draft' | 'active' | 'archived'

export interface FixedRateTerm {
  months: number
  ratePercent: number
}

// Per the Penalty doc's "Penalty Settings" — set on the template, copied
// onto every new contract at creation (see Contract's TemplateSnapshot),
// and never retroactively affected by later template edits.
export type PenaltyType = 'fixed_rate' | 'fixed_fee'

export interface PenaltyRule {
  type: PenaltyType
  // Fixed Rate only — % per month, applied to the overdue installment.
  ratePercent?: number
  // Fixed Fee only — flat THB charged per month overdue.
  flatFeeAmount?: number
  // Days after the due date before a penalty starts accruing at all.
  graceDays: number
  // Total penalty fees this contract can ever be charged, cumulative —
  // collection fees are explicitly excluded from this cap per the doc.
  maxCap: number
  // Printed alongside the template's own legalDeclarations, but kept as
  // its own field since it's specifically about penalty terms, editable
  // independently of the general legal declarations text.
  legalText: string
}

// The printed contract's sections between the header and the signatures —
// shown in this order, and each either shown or hidden. Some are required
// and can't be hidden (see constants/contractSections).
export type ContractSectionKey =
  | 'parties'
  | 'asset'
  | 'paymentTerms'
  | 'legal'
  | 'schedule'
  | 'nationalId'
  | 'paymentSystem'
  | 'commission'

export interface ContractSection {
  key: ContractSectionKey
  visible: boolean
}

// The optional Commission section: a rate on the device price, printed
// with the amount it comes to, and any wording the shop wants alongside.
export interface CommissionRule {
  ratePercent: number
  text: string
}

export interface ContractTemplate {
  id: string
  merchantId: string
  name: string
  description?: string
  type: ContractTemplateType
  status: ContractTemplateStatus
  // One active default per type (enforced where templates are assigned as
  // default, not by this type itself).
  isDefault: boolean
  minDownPaymentPercent: number
  maxDownPaymentPercent: number
  maxLoanAmount: number
  // Free Rate only.
  maxPaymentAmount?: number
  // Fixed Rate only — the available payment terms and each one's rate.
  fixedRateTerms?: FixedRateTerm[]
  // Printed-contract content — shown as-is (title), or before the relevant
  // section (binding statement before product/financial details, legal
  // declarations before the installment schedule).
  title: string
  bindingStatement: string
  legalDeclarations: string
  penalty: PenaltyRule
  // Which sections the printed contract shows, and in what order. Absent on
  // templates saved before sections were configurable — read through
  // normalizeSections, which falls back to the default layout.
  sections?: ContractSection[]
  commission?: CommissionRule
  createdBy: string
  createdAt: string
  updatedBy: string | null
  updatedAt: string | null
}
