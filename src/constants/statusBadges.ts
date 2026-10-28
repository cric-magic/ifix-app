import type { Tone } from '../components/tones'
import type { ContractStatus, ScheduleItem } from '../types/contract'
import type { ContractTemplate } from '../types/contractTemplate'
import type { ProductStatus, ProductType, UnitDisplayStatus } from '../types/product'
import type { UserStatus } from '../types/user'
import type { BranchStatus } from '../types/branch'
import type { MerchantStatus } from '../types/merchant'
import { CONTRACT_STATUS_LABELS } from '../pages/contracts/components/contractStatus'
import { AVAILABILITY_LABELS, STATUS_LABELS, TYPE_LABELS } from './products'

// Every status badge in the app, and the tone (components/tones.ts) it is
// drawn in. This is the one place a status gets its colour: each tag
// component, count tab and filter dot reads its tone from here, and
// /design-docs' Status badges section renders straight from it, so the docs
// can't drift from the app. A new status picks one of the existing tones —
// never an antd colour of its own.
//
// muted drops the text to tertiary for a state that's switched off
// (Unavailable, Disabled).
export interface StatusBadge {
  label: string
  tone: Tone
  muted?: boolean
}

export const CONTRACT_STATUS_BADGES: Record<ContractStatus, StatusBadge> = {
  draft: { label: CONTRACT_STATUS_LABELS.draft, tone: 'neutral' },
  pending_approval: { label: CONTRACT_STATUS_LABELS.pending_approval, tone: 'warning' },
  under_review: { label: CONTRACT_STATUS_LABELS.under_review, tone: 'warning' },
  rejected: { label: CONTRACT_STATUS_LABELS.rejected, tone: 'error' },
  approved: { label: CONTRACT_STATUS_LABELS.approved, tone: 'primary' },
  awaiting_signature: { label: CONTRACT_STATUS_LABELS.awaiting_signature, tone: 'primary' },
  pending_payment: { label: CONTRACT_STATUS_LABELS.pending_payment, tone: 'primary' },
  active: { label: CONTRACT_STATUS_LABELS.active, tone: 'success' },
  overdue: { label: CONTRACT_STATUS_LABELS.overdue, tone: 'error' },
  settled: { label: CONTRACT_STATUS_LABELS.settled, tone: 'success' },
  defaulted: { label: CONTRACT_STATUS_LABELS.defaulted, tone: 'error' },
  closed: { label: CONTRACT_STATUS_LABELS.closed, tone: 'neutral' },
}

export const SCHEDULE_STATUS_BADGES: Record<ScheduleItem['status'], StatusBadge> = {
  paid: { label: 'Paid', tone: 'success' },
  paid_late: { label: 'Paid (Late)', tone: 'success' },
  due: { label: 'Due', tone: 'warning' },
  overdue: { label: 'Overdue', tone: 'error' },
  future: { label: 'Upcoming', tone: 'neutral' },
}

// not_for_sale is display-only: an Available unit whose SKU is removed or
// Unavailable (unitDisplayStatus in utils/product.ts).
export const UNIT_AVAILABILITY_BADGES: Record<UnitDisplayStatus, StatusBadge> = {
  available: { label: AVAILABILITY_LABELS.available, tone: 'success' },
  not_for_sale: { label: 'Not for sale', tone: 'neutral', muted: true },
  reserved: { label: AVAILABILITY_LABELS.reserved, tone: 'warning' },
  sold: { label: AVAILABILITY_LABELS.sold, tone: 'purple' },
}

export const PRODUCT_STATUS_BADGES: Record<ProductStatus, StatusBadge> = {
  available: { label: STATUS_LABELS.available, tone: 'success' },
  unavailable: { label: STATUS_LABELS.unavailable, tone: 'neutral', muted: true },
}

export const PRODUCT_CONDITION_BADGES: Record<ProductType, StatusBadge> = {
  new: { label: TYPE_LABELS.new, tone: 'cyan' },
  opened: { label: TYPE_LABELS.opened, tone: 'lime' },
  used: { label: TYPE_LABELS.used, tone: 'magenta' },
}

export const ATTRIBUTE_VALUE_BADGES: Record<'enabled' | 'disabled', StatusBadge> = {
  enabled: { label: 'Enabled', tone: 'success' },
  disabled: { label: 'Disabled', tone: 'neutral' },
}

export const CUSTOMER_STANDING_BADGES: Record<'good_standing' | 'blacklisted', StatusBadge> = {
  good_standing: { label: 'Good Standing', tone: 'success' },
  blacklisted: { label: 'Blacklisted', tone: 'error' },
}

export const USER_STATUS_BADGES: Record<UserStatus, StatusBadge> = {
  created: { label: 'Created', tone: 'warning' },
  active: { label: 'Active', tone: 'success' },
  suspended: { label: 'Suspended', tone: 'error' },
}

export const BRANCH_STATUS_BADGES: Record<BranchStatus, StatusBadge> = {
  active: { label: 'Active', tone: 'success' },
  archived: { label: 'Archived', tone: 'error' },
}

export const MERCHANT_STATUS_BADGES: Record<MerchantStatus, StatusBadge> = {
  active: { label: 'Active', tone: 'success' },
  suspended: { label: 'Suspended', tone: 'error' },
}

export const CONTRACT_TEMPLATE_STATUS_BADGES: Record<ContractTemplate['status'], StatusBadge> = {
  draft: { label: 'Draft', tone: 'warning' },
  active: { label: 'Active', tone: 'success' },
  archived: { label: 'Archived', tone: 'neutral' },
}

// The groups /design-docs lists, in the order it lists them.
export const STATUS_BADGE_GROUPS: { title: string; usedIn: string; badges: Record<string, StatusBadge> }[] = [
  { title: 'Contract', usedIn: 'Contracts list, its status filter, contract detail', badges: CONTRACT_STATUS_BADGES },
  { title: 'Installment', usedIn: 'Contract payment schedule', badges: SCHEDULE_STATUS_BADGES },
  { title: 'Unit availability', usedIn: 'Units list and its status tabs, unit detail, Price Check. Not for sale = Available, but its product is removed or Unavailable', badges: UNIT_AVAILABILITY_BADGES },
  { title: 'Product status', usedIn: 'Catalog, product detail', badges: PRODUCT_STATUS_BADGES },
  { title: 'Product condition', usedIn: 'Catalog and its condition tabs', badges: PRODUCT_CONDITION_BADGES },
  { title: 'Attribute value', usedIn: 'Product attributes', badges: ATTRIBUTE_VALUE_BADGES },
  { title: 'Customer standing', usedIn: 'Customers list, customer detail', badges: CUSTOMER_STANDING_BADGES },
  { title: 'User', usedIn: 'Users list, user detail', badges: USER_STATUS_BADGES },
  { title: 'Branch', usedIn: 'Branches list, branch detail', badges: BRANCH_STATUS_BADGES },
  { title: 'Merchant', usedIn: 'Merchants list, merchant detail', badges: MERCHANT_STATUS_BADGES },
  { title: 'Contract template', usedIn: 'Settings › Contract templates', badges: CONTRACT_TEMPLATE_STATUS_BADGES },
]
