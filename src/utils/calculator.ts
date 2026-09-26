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
