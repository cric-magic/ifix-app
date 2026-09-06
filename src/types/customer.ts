// Per the Customer doc: one record per National ID/Passport, reusable
// across contracts. Phase 1 has no standalone UI for this — it's only
// touched through contract creation (lookup by ID → prefill, or fill a new
// form) — this prototype's Contracts rewrite adds the type + mock records
// now so a real Customers list/detail page can drop in later without a
// data-model change.
//
// Address fields are kept as single strings rather than the doc's broken-
// out house no./street/subdistrict/district/province/postal code — that
// structured breakdown is a Phase 2/UI-forms concern, not a data-shape one
// this prototype needs yet.
export interface Customer {
  id: string
  merchantId: string
  // The unique identifier for lookup during contract creation — National ID
  // or Passport number. Unique across a merchant's customers (not
  // globally — see the doc's cross-merchant blacklist-only sharing rule).
  nationalId: string
  fullName: string
  phone: string
  dateOfBirth: string
  email?: string
  idCardAddress: string
  currentAddress: string
  workplaceAddress?: string
  // Phase 2 field, kept on the type now so Contract's customer-lookup step
  // has somewhere to read it from later — not actively enforced (no
  // blacklist warning flow) in this prototype.
  blacklisted: boolean
  createdBy: string
  createdAt: string
}
