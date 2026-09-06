// Per the Contract Template doc. Only what Contract's "Select template"
// step and its snapshot-on-use behavior need — Phase 2 fields (commission)
// are explicitly out of scope for Phase 1 and left off this type entirely,
// not just hidden in a form. Penalty (also Phase 2) IS modeled — see the
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
  createdBy: string
  createdAt: string
  updatedBy: string | null
  updatedAt: string | null
}
