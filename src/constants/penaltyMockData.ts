export interface PenaltyRule {
  type: 'flat_fee' | 'percent_per_day'
  flatFeeAmount: number
  percentPerDay: number
  gracePeriodDays: number
}

export interface PenaltyAuditLog {
  id: string
  changedBy: string
  changedAt: string
  field: string
  oldValue: string
  newValue: string
}

export const DEFAULT_PENALTY_RULE: PenaltyRule = {
  type: 'percent_per_day',
  flatFeeAmount: 200,
  percentPerDay: 1.5,
  gracePeriodDays: 3,
}

export const MOCK_AUDIT_LOGS: PenaltyAuditLog[] = [
  {
    id: 'log-001',
    changedBy: 'Admin User',
    changedAt: '2024-03-15 14:22:01',
    field: 'Penalty Type',
    oldValue: 'Flat Fee',
    newValue: 'Percent Per Day',
  },
  {
    id: 'log-002',
    changedBy: 'Admin User',
    changedAt: '2024-03-15 14:22:01',
    field: 'Percent Per Day',
    oldValue: '1.0%',
    newValue: '1.5%',
  },
  {
    id: 'log-003',
    changedBy: 'Admin User',
    changedAt: '2024-02-10 09:05:33',
    field: 'Grace Period',
    oldValue: '5 days',
    newValue: '3 days',
  },
  {
    id: 'log-004',
    changedBy: 'Admin User',
    changedAt: '2024-01-20 11:48:17',
    field: 'Flat Fee Amount',
    oldValue: '฿150',
    newValue: '฿200',
  },
]
