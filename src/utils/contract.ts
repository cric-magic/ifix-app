import dayjs from 'dayjs'
import type { Contract, ContractPaymentRecord, FinancingTerms, ScheduleItem, CollectionFeeRecord, PenaltyAdjustment } from '../types/contract'
import type { Merchant } from '../types/merchant'
import type { PenaltyRule } from '../types/contractTemplate'

// Derived, not stored — the doc's List Contract columns (outstanding
// balance, next due, overdue days, net position) are all computable from
// `schedule`/`payments`, so there's nothing to keep in sync by hand.

// Shared "submit for approval" transition — used both by CreateContractPage
// (fresh contract, actor === creator by construction) and EditContractPage
// (Draft/Rejected edit-and-resubmit). Staff submissions go to Pending
// Approval; BM/Admin/Owner submissions auto-approve, per the doc. Mutates
// the contract in place, matching how LifecycleActions' other transitions
// work.
export function submitContractForApproval(contract: Contract, actorId: string, actorRole: string): void {
  const now = new Date().toISOString()
  contract.submittedBy = actorId
  contract.submittedAt = now
  if (actorRole === 'staff') {
    contract.status = 'pending_approval'
  } else {
    contract.status = 'approved'
    contract.approvedBy = actorId
    contract.approvedAt = now
  }
}

export function getOutstandingBalance(contract: Contract): number {
  return contract.schedule
    .filter(s => s.status !== 'paid' && s.status !== 'paid_late')
    .reduce((sum, s) => sum + s.amount, 0)
}

export function getCollectedAmount(contract: Contract): number {
  return contract.payments.reduce((sum, p) => sum + p.amount, 0)
}

export function getNextDue(contract: Contract): ScheduleItem | undefined {
  return contract.schedule.find(s => s.status === 'due' || s.status === 'overdue')
}

// "today − the due date of the oldest unpaid item" per the doc.
export function getOverdueDays(contract: Contract): number {
  const oldestUnpaid = contract.schedule.find(s => s.status === 'overdue')
  if (!oldestUnpaid) return 0
  return Math.max(0, dayjs().diff(dayjs(oldestUnpaid.dueDate), 'day'))
}

// Merchant Admin/Owner-only list column: product cost recovered vs. still
// outstanding, per the doc's `product cost - collected balance`.
export function getNetPosition(contract: Contract, productCost: number): number {
  return productCost - getCollectedAmount(contract)
}

// Real contract-number generation, per the merchant's own contractFormat/
// contractPrefix (set up in the Merchant module — see mockMerchants.ts's
// previewContractNumber, which shows what this would look like before any
// contracts exist). auto_running resets its sequence every month; random
// is a non-traceable UUID, same rule previewContractNumber documents.
export function generateContractNumber(
  merchant: Pick<Merchant, 'contractFormat' | 'contractPrefix'>,
  existingContracts: Contract[],
): string {
  if (merchant.contractFormat === 'random') {
    const uuid = crypto.randomUUID().toUpperCase()
    return merchant.contractPrefix ? `${merchant.contractPrefix}-${uuid}` : uuid
  }
  const now = dayjs()
  const yyyy = now.format('YYYY')
  const mm = now.format('MM')
  const dd = now.format('DD')
  const createdThisMonth = existingContracts.filter(c => dayjs(c.createdAt).format('YYYY-MM') === now.format('YYYY-MM')).length
  const seq = String(createdThisMonth + 1).padStart(6, '0')
  return merchant.contractPrefix ? `${merchant.contractPrefix}-${yyyy}${mm}${dd}-${seq}` : `${yyyy}${mm}${dd}-${seq}`
}

// Generates the down-payment-plus-installments schedule at activation, per
// the doc ("Payment schedule — generated at activation"). Down payment is
// recorded as already paid (it's what triggers the transition into Active
// in the first place); every installment starts as a future row.
export function buildActivationSchedule(
  financing: FinancingTerms,
  downPaymentReceivedBy: string,
): { schedule: ScheduleItem[]; payments: ContractPaymentRecord[] } {
  const today = dayjs().format('YYYY-MM-DD')
  const schedule: ScheduleItem[] = [
    { period: 0, label: 'Down Payment', dueDate: today, amount: financing.downPaymentAmount, paidDate: today, status: 'paid' },
  ]
  for (let i = 1; i <= financing.paymentTermMonths; i++) {
    const dueDate = dayjs().add(i, 'month').format('YYYY-MM-DD')
    schedule.push({
      period: i,
      label: `Installment ${i}`,
      dueDate,
      amount: financing.installmentAmount,
      paidDate: null,
      status: i === 1 ? 'due' : 'future',
    })
  }
  const payments: ContractPaymentRecord[] = [
    { id: `pay-${Date.now()}`, period: 0, paymentDate: today, amount: financing.downPaymentAmount, method: 'transfer', receivedBy: downPaymentReceivedBy, note: 'Down payment' },
  ]
  return { schedule, payments }
}

// The single source of truth for every installment item's status and the
// contract's own status — derived fresh from the (non-voided) payment
// records each time, rather than hand-patching individual items as each
// payment/void happens. This is what makes voiding simple: mark the record
// voided and call this again, and its effect just isn't there anymore,
// with every downstream cascade (excess carryover, Settled) recomputed
// correctly instead of needing its own reversal logic.
//
// Per the doc: full/over payment → item Paid (or Paid (Late) if the
// payment date is after the due date) with any excess carrying over to
// the next item(s); a partial payment is logged but leaves the item
// Due/Overdue; the contract becomes Overdue once an unpaid item's due
// date has passed, Settled once every installment is paid, Active
// otherwise. Period 0 (the down payment) is untouched here — it's always
// paid at activation and isn't part of this recalculation.
// Fresh, deterministic penalty accrual for one schedule item — a pure
// function of "how many days past its grace period has this item's due
// date been," never a hand-incremented running total. This is what the
// Penalty doc's own non-functional requirement ("the same input data must
// always produce the same calculation result") calls for, and it's also
// what keeps voiding a payment trivially correct: nothing was ever added
// that now needs subtracting, it just gets recomputed from whatever
// payment history remains. Capped at the template snapshot's own maxCap.
export function calcAccruedPenalty(item: ScheduleItem | undefined, penalty: PenaltyRule): number {
  if (!item) return 0
  const graceEnd = dayjs(item.dueDate).add(penalty.graceDays, 'day')
  const today = dayjs()
  if (!today.isAfter(graceEnd, 'day')) return 0
  const daysOverdue = today.diff(graceEnd, 'day')
  const monthsOverdue = daysOverdue / 30
  const raw = penalty.type === 'fixed_rate'
    ? item.amount * ((penalty.ratePercent ?? 0) / 100) * monthsOverdue
    // A flat fee is charged per month (or partial month) overdue, so a
    // fee that just started its first day still owes one full month's fee.
    : Math.ceil(daysOverdue / 30) * (penalty.flatFeeAmount ?? 0)
  return Math.min(Math.round(raw), penalty.maxCap)
}

export function getActiveCollectionFeeTotal(contract: Contract): number {
  return contract.collectionFees
    .filter(f => !f.voided && !f.waived)
    .reduce((sum, f) => sum + f.amount, 0)
}

function getPenaltyDiscountTotal(contract: Contract): number {
  return contract.penaltyAdjustments
    .filter(a => !a.voided)
    .reduce((sum, a) => sum + a.amount, 0)
}

export function recalculateSchedule(contract: Contract): void {
  // No-op before activation (schedule is only ever generated at that
  // point — see buildActivationSchedule) — calling this defensively on
  // every page load, say, must never invent an "active" status for a
  // Draft/Approved/etc. contract that simply has no installments yet.
  if (!contract.schedule.some(s => s.period > 0)) return

  const orderedPayments = contract.payments
    .filter(p => p.period > 0 && !p.voided)
    .slice()
    .sort((a, b) => a.paymentDate.localeCompare(b.paymentDate) || a.id.localeCompare(b.id))

  contract.schedule.forEach(item => {
    if (item.period > 0) {
      item.status = 'future'
      item.paidDate = null
    }
  })

  // Penalty/collection-fee targets, fixed once per call against the
  // schedule's first still-open installment — i.e. the one a fresh replay
  // would treat as "the" overdue item before any of this contract's own
  // payments are applied. A deliberate simplification for a prototype with
  // no real day-by-day ledger: only one installment is ever genuinely "the"
  // overdue one at a time in the scenarios this app needs to handle, so
  // using its due date as the basis is stable in every realistic case.
  const firstOpenIdx = contract.schedule.findIndex(s => s.period === 1)
  const penaltyBasisItem = firstOpenIdx !== -1 ? contract.schedule[firstOpenIdx] : undefined
  const penaltyTarget = calcAccruedPenalty(penaltyBasisItem, contract.template.penalty)
  const collectionFeeTarget = getActiveCollectionFeeTotal(contract)

  let idx = firstOpenIdx
  let carry = 0
  let penaltyPaidTotal = 0
  let collectionFeePaidTotal = 0
  for (const payment of orderedPayments) {
    let remaining = payment.amount + carry
    carry = 0
    while (remaining > 0 && idx !== -1 && idx < contract.schedule.length) {
      const item = contract.schedule[idx]
      if (remaining < item.amount) break
      item.status = dayjs(payment.paymentDate).isAfter(dayjs(item.dueDate), 'day') ? 'paid_late' : 'paid'
      item.paidDate = payment.paymentDate
      remaining -= item.amount
      idx++
    }
    // Payment Waterfall, per the Penalty doc: installment first (above),
    // then penalty, then collection fee — only once both of those are
    // satisfied does anything left over carry forward to pre-pay a future
    // installment (unchanged `carry` behavior from before this rework).
    if (remaining > 0) {
      const penaltyPayoff = Math.min(remaining, Math.max(0, penaltyTarget - penaltyPaidTotal))
      penaltyPaidTotal += penaltyPayoff
      remaining -= penaltyPayoff
    }
    if (remaining > 0) {
      const feePayoff = Math.min(remaining, Math.max(0, collectionFeeTarget - collectionFeePaidTotal))
      collectionFeePaidTotal += feePayoff
      remaining -= feePayoff
    }
    carry = remaining
  }

  const today = dayjs().format('YYYY-MM-DD')
  let contractHasOverdue = false
  let nextUnpaidFound = false
  for (const item of contract.schedule) {
    if (item.period === 0 || item.status === 'paid' || item.status === 'paid_late') continue
    if (!nextUnpaidFound) {
      nextUnpaidFound = true
      if (item.dueDate < today) {
        item.status = 'overdue'
        contractHasOverdue = true
      } else {
        item.status = 'due'
      }
    } else {
      item.status = 'future'
    }
  }

  contract.penaltyChargedTotal = penaltyTarget
  contract.penaltyBalance = Math.max(0, penaltyTarget - penaltyPaidTotal - getPenaltyDiscountTotal(contract))
  contract.collectionFeeBalance = Math.max(0, collectionFeeTarget - collectionFeePaidTotal)

  const installments = contract.schedule.filter(s => s.period > 0)
  const allSettled = installments.length > 0 && installments.every(s => s.status === 'paid' || s.status === 'paid_late')
  if (allSettled) {
    contract.status = 'settled'
    if (!contract.settledAt) contract.settledAt = new Date().toISOString()
  } else if (contractHasOverdue) {
    contract.status = 'overdue'
  } else {
    contract.status = 'active'
  }
}

// Add a Collection Fee — per the doc, manually added by Admin/Owner against
// an overdue contract, kept as its own balance (never counted toward the
// Max Penalty Cap — see recalculateSchedule, which sums this into its own
// target entirely separately from the penalty one).
export function addCollectionFee(contract: Contract, amount: number, reason: string | undefined, actorId: string): void {
  const record: CollectionFeeRecord = {
    id: `cfee-${Date.now()}`,
    amount,
    reason,
    addedBy: actorId,
    addedAt: new Date().toISOString(),
    waived: false,
    waivedBy: null,
    waivedAt: null,
    waiveReason: null,
    voided: false,
    voidReason: null,
    voidedBy: null,
    voidedAt: null,
  }
  contract.collectionFees.push(record)
  recalculateSchedule(contract)
}

export function waiveCollectionFee(contract: Contract, feeId: string, reason: string, actorId: string): void {
  const fee = contract.collectionFees.find(f => f.id === feeId)
  if (!fee) return
  fee.waived = true
  fee.waivedBy = actorId
  fee.waivedAt = new Date().toISOString()
  fee.waiveReason = reason
  recalculateSchedule(contract)
}

export function voidCollectionFee(contract: Contract, feeId: string, reason: string, actorId: string): void {
  const fee = contract.collectionFees.find(f => f.id === feeId)
  if (!fee) return
  fee.voided = true
  fee.voidReason = reason
  fee.voidedBy = actorId
  fee.voidedAt = new Date().toISOString()
  recalculateSchedule(contract)
}

// Penalty Discount — the doc's "Penalty Discount" adjustment. Penalty has
// no discrete record of its own to void the way a payment or collection
// fee does (it's a live-recomputed balance — see calcAccruedPenalty), so a
// discount is its own append-only record, reducing the balance by its
// amount until/unless voided.
export function addPenaltyDiscount(contract: Contract, amount: number, reason: string, actorId: string): void {
  const adjustment: PenaltyAdjustment = {
    id: `pdisc-${Date.now()}`,
    amount,
    reason,
    createdBy: actorId,
    createdAt: new Date().toISOString(),
    voided: false,
    voidReason: null,
    voidedBy: null,
    voidedAt: null,
  }
  contract.penaltyAdjustments.push(adjustment)
  recalculateSchedule(contract)
}

export function voidPenaltyDiscount(contract: Contract, adjustmentId: string, reason: string, actorId: string): void {
  const adjustment = contract.penaltyAdjustments.find(a => a.id === adjustmentId)
  if (!adjustment) return
  adjustment.voided = true
  adjustment.voidReason = reason
  adjustment.voidedBy = actorId
  adjustment.voidedAt = new Date().toISOString()
  recalculateSchedule(contract)
}

export interface RecordPaymentInput {
  amount: number
  method: ContractPaymentRecord['method']
  paymentDate: string
  note?: string
  slipPhotos: string[]
}

// Logs a new payment record against the contract's current Due/Overdue
// item and re-derives everything from it via recalculateSchedule — see
// that function's own comment for why record+recalculate (not a bespoke
// mutation per call) is the shape this takes.
export function recordPayment(contract: Contract, input: RecordPaymentInput, actorId: string): void {
  const target = getNextDue(contract)
  contract.payments.push({
    id: `pay-${Date.now()}`,
    period: target?.period ?? 0,
    paymentDate: input.paymentDate,
    amount: input.amount,
    method: input.method,
    receivedBy: actorId,
    note: input.note,
    slipPhotos: input.slipPhotos,
  })
  recalculateSchedule(contract)
}

// Marks a record voided (kept for the audit trail, per the doc's own
// "all edits and deletions must be auditable" requirement — never actually
// removed) and re-derives the schedule without it.
export function voidPaymentRecord(contract: Contract, paymentId: string, reason: string, actorId: string): void {
  const record = contract.payments.find(p => p.id === paymentId)
  if (!record) return
  record.voided = true
  record.voidReason = reason
  record.voidedBy = actorId
  record.voidedAt = new Date().toISOString()
  recalculateSchedule(contract)
}
