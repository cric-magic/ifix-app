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

// Per the doc, label composition is a merchant-level setting rather than
// something picked per print — so a branch can't quietly print a different
// label format from the rest of the merchant.
export type BarcodeCodeTypes = 'barcode' | 'qr' | 'both'

// Which identifier the code encodes. Serial Number is the unit's own
// primary identifier; Internal Unit ID is the system id, for merchants who
// don't want the serial readable off a scan. Either way the Serial Number
// stays printed as human-readable text (see the doc's note).
export type BarcodeEncodedValue = 'serialNumber' | 'unitId'

// The physical sticker, width × height in mm. 40 × 30 is the smallest
// commonly used thermal label and the default; 50 × 30's extra width prints
// the barcode's bars thicker (see constants/labelSizes).
export type LabelSize = '40x30' | '50x30'

export interface BarcodeSettings {
  codeTypes: BarcodeCodeTypes
  encodedValue: BarcodeEncodedValue
  labelSize: LabelSize
  // Optional human-readable details printed under the code. Serial Number
  // is always shown and so isn't listed here.
  showProductName: boolean
  showStorage: boolean
  showColor: boolean
  // Used units only — a new unit has no grade, so its sticker skips it.
  showGrade: boolean
  showSkuCode: boolean
  showBranch: boolean
  showSalesPrice: boolean
}

export interface Merchant {
  id: string
  name: string
  legalName: string
  address: string
  // Printed on every contract (see the doc's Contract Content Template:
  // the header and the LESSOR block both carry the merchant's phone).
  phone: string
  logoUrl?: string
  status: MerchantStatus
  contractFormat: ContractFormat
  contractPrefix: string
  lineQrUrl?: string
  bankAccounts: BankAccountProfile[]
  // Per the Penalty doc: "Collection fees can be turned on or off for each
  // merchant or branch" / "The fee amount can be set at the merchant or
  // branch level." Branch-level override isn't modeled yet (the doc's own
  // permission table marks Branch Manager's role here as TBD) — this is
  // the merchant-wide default every branch uses until that's built.
  collectionFeeEnabled: boolean
  collectionFeeAmount: number
  barcodeSettings: BarcodeSettings
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
