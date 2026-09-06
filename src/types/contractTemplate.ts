// Per the Contract Template doc. Only what Contract's "Select template"
// step and its snapshot-on-use behavior need — Phase 2 fields (penalty,
// commission) are explicitly out of scope for Phase 1 and left off this
// type entirely, not just hidden in a form.
export type ContractTemplateType = 'fixed_rate' | 'free_rate'
export type ContractTemplateStatus = 'draft' | 'active' | 'archived'

export interface FixedRateTerm {
  months: number
  ratePercent: number
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
  createdBy: string
  createdAt: string
  updatedBy: string | null
  updatedAt: string | null
}
