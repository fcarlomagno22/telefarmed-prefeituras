import type { ContratoModalidade } from './contract-modality.js'
import { monthlyContractedQuota } from './contract-modality.js'
import { buildMonthOutcome, computeAvulsoCount } from './contract-period.js'
import type { ContractHistoryMonth } from './contract-period.js'
import { monthKeyFromTimestamp } from './cycle.js'

export type MonthlyRowDto = {
  key: string
  year: number
  month: number
  label: string
  contracted: number
  performed: number
  avulsoCount: number
  outcome: 'within' | 'reached' | 'exceeded'
}

type ConsultaHistoryRow = {
  finalizada_em: string | null
}

function buildPacoteFechadoOutcome(
  cumulativePerformed: number,
  packageTotal: number,
  monthAvulsoCount: number,
): MonthlyRowDto['outcome'] {
  if (monthAvulsoCount > 0) return 'exceeded'
  if (packageTotal > 0 && cumulativePerformed >= packageTotal) return 'reached'
  return 'within'
}

export function aggregateMonthlyHistory(
  rows: ConsultaHistoryRow[],
  packageTotal: number,
  modalidade: ContratoModalidade,
  permiteUltrapassar: boolean,
  historyMonths: ContractHistoryMonth[],
): MonthlyRowDto[] {
  const counts = new Map<string, number>()

  for (const row of rows) {
    if (!row.finalizada_em) continue
    const key = monthKeyFromTimestamp(row.finalizada_em)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const monthlyQuota = monthlyContractedQuota(modalidade, packageTotal)
  let cumulativePerformed = 0

  return historyMonths.map((month) => {
    const performed = counts.get(month.key) ?? 0
    const prevCumulative = cumulativePerformed
    cumulativePerformed += performed

    let avulsoCount = 0
    if (modalidade === 'mensal') {
      avulsoCount = computeAvulsoCount(performed, packageTotal, permiteUltrapassar)
    } else if (modalidade === 'pacote_fechado' && packageTotal > 0 && permiteUltrapassar) {
      const remainingBefore = Math.max(0, packageTotal - prevCumulative)
      avulsoCount = Math.max(0, performed - remainingBefore)
    }

    const outcome =
      modalidade === 'pacote_fechado'
        ? buildPacoteFechadoOutcome(cumulativePerformed, packageTotal, avulsoCount)
        : buildMonthOutcome(performed, packageTotal, avulsoCount)

    return {
      key: month.key,
      year: month.year,
      month: month.month,
      label: month.label,
      contracted: monthlyQuota,
      performed,
      avulsoCount,
      outcome,
    }
  })
}

export function patchMonthlyRow(
  rows: MonthlyRowDto[],
  monthKey: string,
  performed: number,
  packageTotal: number,
  modalidade: ContratoModalidade,
  permiteUltrapassar: boolean,
): MonthlyRowDto[] {
  const index = rows.findIndex((row) => row.key === monthKey)
  if (index < 0) return rows

  const next = [...rows]
  const prevCumulative = rows
    .slice(0, index)
    .reduce((sum, row) => sum + row.performed, 0)

  let avulsoCount = 0
  if (modalidade === 'mensal') {
    avulsoCount = computeAvulsoCount(performed, packageTotal, permiteUltrapassar)
  } else if (modalidade === 'pacote_fechado' && packageTotal > 0 && permiteUltrapassar) {
    const remainingBefore = Math.max(0, packageTotal - prevCumulative)
    avulsoCount = Math.max(0, performed - remainingBefore)
  }

  const cumulativePerformed = prevCumulative + performed
  const outcome =
    modalidade === 'pacote_fechado'
      ? buildPacoteFechadoOutcome(cumulativePerformed, packageTotal, avulsoCount)
      : buildMonthOutcome(performed, packageTotal, avulsoCount)

  next[index] = {
    ...next[index]!,
    performed,
    avulsoCount,
    outcome,
  }

  return next
}
