import type { CommissionRule, ContractSection, ContractSectionKey } from '../types/contractTemplate'

// The printed contract's configurable sections — everything between the
// header (always first) and the signatures (always last). Required ones
// carry the contract's core terms and can't be hidden; the rest a shop can
// turn off. Every one of them can be moved.
export const CONTRACT_SECTIONS: Record<ContractSectionKey, { label: string; required: boolean }> = {
  parties: { label: 'Parties & binding statement', required: true },
  asset: { label: 'Asset specification', required: true },
  paymentTerms: { label: 'Payment terms', required: true },
  legal: { label: 'Legal declarations', required: true },
  schedule: { label: 'Installment schedule', required: false },
  nationalId: { label: 'National ID', required: false },
  paymentSystem: { label: 'Payment system', required: false },
  commission: { label: 'Commission', required: false },
}

// The layout every template starts with, and the one older templates (saved
// before sections were configurable) print with. Commission is new and off.
export const DEFAULT_CONTRACT_SECTIONS: ContractSection[] = [
  { key: 'parties', visible: true },
  { key: 'asset', visible: true },
  { key: 'paymentTerms', visible: true },
  { key: 'legal', visible: true },
  { key: 'schedule', visible: true },
  { key: 'nationalId', visible: true },
  { key: 'paymentSystem', visible: true },
  { key: 'commission', visible: false },
]

export const DEFAULT_COMMISSION: CommissionRule = { ratePercent: 0, text: '' }

// A saved layout made whole: any section missing from it (added to the app
// after it was saved) is appended in its default state, and required
// sections are always visible whatever was stored.
export function normalizeSections(sections?: ContractSection[]): ContractSection[] {
  const base = sections?.length ? sections : DEFAULT_CONTRACT_SECTIONS
  const known = base.filter(s => s.key in CONTRACT_SECTIONS)
  const missing = DEFAULT_CONTRACT_SECTIONS.filter(d => !known.some(s => s.key === d.key))
  return [...known, ...missing].map(s => (CONTRACT_SECTIONS[s.key].required ? { ...s, visible: true } : s))
}
