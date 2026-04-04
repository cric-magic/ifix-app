import type { ScheduleResult } from '../types/installment'
import dayjs from 'dayjs'

function buildSchedule(monthlyInstallment: number, periods: number) {
  return Array.from({ length: periods }, (_, i) => ({
    period: i + 1,
    dueDate: dayjs().add(i + 1, 'month').format('YYYY-MM-DD'),
    amount: monthlyInstallment,
  }))
}

/**
 * Fix Rate Mode: flat rate interest on principal
 * Total interest = principal × flatRatePercent% × periods
 */
export function calcFixRate(
  principal: number,
  flatRatePercent: number,
  periods: number,
): ScheduleResult {
  const totalInterest = (principal * (flatRatePercent / 100) * periods)
  const totalPayable = principal + totalInterest
  const monthlyInstallment = Math.ceil(totalPayable / periods)

  return {
    monthlyInstallment,
    totalInterest,
    totalPayable,
    flatRatePercent,
    schedule: buildSchedule(monthlyInstallment, periods),
  }
}

/**
 * Easy Mode: reverse-calculate flat rate from desired selling price
 * Implied rate = (totalPayable - loanAmount) / (loanAmount × periods) × 100
 */
export function calcEasyMode(
  sellingPrice: number,
  downPayment: number,
  periods: number,
): ScheduleResult {
  const loanAmount = sellingPrice - downPayment
  // Assume a target monthly installment derived from desired total return of ~15% margin
  const targetTotalPayable = sellingPrice * 1.15
  const totalInterest = targetTotalPayable - loanAmount
  const flatRatePercent = (totalInterest / (loanAmount * periods)) * 100
  const monthlyInstallment = Math.ceil(targetTotalPayable / periods)
  const totalPayable = monthlyInstallment * periods

  return {
    monthlyInstallment,
    totalInterest: totalPayable - loanAmount,
    totalPayable,
    flatRatePercent: Math.round(flatRatePercent * 100) / 100,
    schedule: buildSchedule(monthlyInstallment, periods),
  }
}
