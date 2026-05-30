import type { ProfissionalBillingShift } from '../../types/profissionalFinanceiro'

export type ProfissionalFinanceiroStats = {
  totalShifts: number
  realizedCount: number
  scheduledCount: number
  canceledCount: number
  forecastCents: number
  potentialCents: number
}

export function computeProfissionalFinanceiroStats(
  shifts: ProfissionalBillingShift[],
): ProfissionalFinanceiroStats {
  const realized = shifts.filter((s) => s.status === 'realizado')
  const scheduled = shifts.filter((s) => s.status === 'previsto')
  const canceled = shifts.filter((s) => s.status === 'cancelado')

  const forecastCents = realized.reduce((sum, s) => sum + s.amountCents, 0)
  const potentialCents = shifts
    .filter((s) => s.status !== 'cancelado')
    .reduce((sum, s) => sum + s.amountCents, 0)

  return {
    totalShifts: shifts.length,
    realizedCount: realized.length,
    scheduledCount: scheduled.length,
    canceledCount: canceled.length,
    forecastCents,
    potentialCents,
  }
}
