import type { AuthUser } from '../types/installment'
import type { ContractTemplate } from '../types/contractTemplate'
import { activeTemplatesFor } from '../constants/mockContractTemplates'
import { isMerchantAdminOrAbove } from '../constants/roles'
import { calcFixRate } from './calculator'

// Per the Contract doc's Free Rate terms ("pick a term: 3/6/10/12/18/24
// months") — a different set from Fixed Rate's own per-template terms.
export const FREE_RATE_TERMS = [3, 6, 10, 12, 18, 24]

// The templates this person can put a contract on: Fixed Rate for everyone,
// Free Rate (Easy Mode, a rate set per contract) for Admin/Owner only. The
// contract flow and Price Check both read this, so a quote can never offer
// terms the contract wouldn't.
export function selectableTemplatesFor(actor: AuthUser): ContractTemplate[] {
  if (!actor.merchantId) return []
  return activeTemplatesFor(actor.merchantId)
    .filter(t => t.type === 'fixed_rate' || isMerchantAdminOrAbove(actor))
}

// Per the doc, "the default template for the selected type is pre-selected
// when creating a contract." Templates are picked directly rather than a
// type first, so the Fixed Rate default wins where both exist.
export function defaultTemplateOf(templates: ContractTemplate[]): ContractTemplate | undefined {
  return templates.find(t => t.isDefault && t.type === 'fixed_rate') ?? templates.find(t => t.isDefault) ?? templates[0]
}

// The terms a template offers, each with its monthly rate — a Free Rate
// template has no rate of its own (it's set per contract), so `ratePercent`
// is undefined there.
export function termsOf(template: ContractTemplate): { months: number; ratePercent?: number }[] {
  return template.type === 'fixed_rate'
    ? template.fixedRateTerms ?? []
    : FREE_RATE_TERMS.map(months => ({ months }))
}

// The term a template opens on — in a Price Check quote and on the
// contract's Template & Terms step alike: 12 months where the template has
// it (the usual ask), otherwise its middle term. Carries the term's rate
// for a Fixed Rate template.
export function preferredTermOf(template: ContractTemplate): { months: number; ratePercent?: number } | undefined {
  const terms = termsOf(template)
  return terms.find(t => t.months === 12) ?? terms[Math.floor(terms.length / 2)]
}

// A down payment % pulled into a template's allowed range — its minimum
// when there's none yet.
export function clampDown(percent: number | undefined, template: ContractTemplate): number {
  if (percent == null) return template.minDownPaymentPercent
  return Math.min(template.maxDownPaymentPercent, Math.max(template.minDownPaymentPercent, percent))
}

export interface Financing {
  devicePrice: number
  downPaymentPercent: number
  downPaymentAmount: number
  ratePercent: number
  paymentTermMonths: number
  installmentAmount: number
  totalContractValue: number
}

// A contract's money, from the device price and its terms. The contract's
// own Preview and a Price Check quote both come from here — the same maths,
// so the number quoted at the counter is the number on the contract.
export function financingFor(devicePrice: number, downPaymentPercent: number, ratePercent: number, termMonths: number): Financing {
  const downPaymentAmount = Math.round(devicePrice * downPaymentPercent / 100)
  const loanAmount = devicePrice - downPaymentAmount
  const calc = calcFixRate(loanAmount, ratePercent, termMonths)
  return {
    devicePrice,
    downPaymentPercent,
    downPaymentAmount,
    ratePercent,
    paymentTermMonths: termMonths,
    installmentAmount: calc.monthlyInstallment,
    totalContractValue: Math.round(downPaymentAmount + calc.totalPayable),
  }
}

// What Price Check hands the contract flow when "Start contract" is tapped
// (as router state on /contracts/new): the branch and unit, and the terms
// already chosen — so nothing quoted has to be entered again.
export interface QuoteHandoff {
  branch: string
  unitId: string
  productId: string
  templateId: string
  termMonths: number
  ratePercent: number
  downPaymentPercent: number
}
