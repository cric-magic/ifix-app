export type MerchantStatus = 'active' | 'suspended'

// Per the Merchant doc: auto-running resets its sequence every month
// (yyyyMMdd-xxxxxx, counter restarts at 1 on the 1st of each month) vs.
// random, a non-traceable UUID. Only the format choice lives on the
// merchant record itself — the actual next-number computation is a
// function of "how many contracts already exist this month," which is
// contract data this prototype doesn't have yet (Contracts isn't final —
// see mockMerchants.ts's previewContractNumber for how this is simulated
// for display purposes only).
export type ContractFormat = 'auto_running' | 'random'

export interface BankAccountProfile {
  id: string
  bank: string
  accountNumber: string
  accountName: string
  branch?: string
  qrCodeUrl?: string
  isDefault: boolean
}

export interface Merchant {
  id: string
  name: string
  legalName: string
  address: string
  logoUrl?: string
  status: MerchantStatus
  contractFormat: ContractFormat
  contractPrefix: string
  lineQrUrl?: string
  bankAccounts: BankAccountProfile[]
  // Captured at creation time (the doc's "Initial Owner account — name +
  // email"); ownerUserId links to the actual provisioned UserAccount once
  // one exists for this merchant. Kept separate rather than only storing
  // the id, since the name/email need to be known before an account exists.
  ownerName: string
  ownerEmail: string
  ownerUserId: string | null
  createdBy: string | null
  createdAt: string
  suspendedBy: string | null
  suspendedAt: string | null
}
