import { monthLabel, todayIsoInBrazil } from './cycle.js'

const SP_OFFSET = '-03:00'

export function contractStartIso(dataAssinatura: string): string {
  return `${dataAssinatura}T00:00:00.000${SP_OFFSET}`
}

export function contractEndIso(dataEncerramento: string | null): string | null {
  if (!dataEncerramento) return null
  return `${dataEncerramento}T23:59:59.999${SP_OFFSET}`
}

export function monthFromIsoDate(isoDate: string): { year: number; month: number } {
  const [yearStr, monthStr] = isoDate.split('-')
  return { year: Number(yearStr), month: Number(monthStr) }
}

export type ContractHistoryMonth = {
  key: string
  year: number
  month: number
  label: string
}


function isBeforeContractMonth(
  year: number,
  month: number,
  contractStart: { year: number; month: number },
): boolean {
  return year < contractStart.year || (year === contractStart.year && month < contractStart.month)
}

function incrementMonth(year: number, month: number): { year: number; month: number } {
  if (month >= 12) return { year: year + 1, month: 1 }
  return { year, month: month + 1 }
}

function isAfterContractMonth(
  year: number,
  month: number,
  contractEnd: { year: number; month: number },
): boolean {
  return year > contractEnd.year || (year === contractEnd.year && month > contractEnd.month)
}

/** Todos os meses civis da vigência: do mês de assinatura ao mês de encerramento. */
export function resolveContractHistoryMonths(input: {
  dataAssinatura: string
  dataEncerramento: string | null
}): ContractHistoryMonth[] {
  const contractStart = monthFromIsoDate(input.dataAssinatura)
  const contractEnd = monthFromIsoDate(
    input.dataEncerramento ?? input.dataAssinatura,
  )

  const months: ContractHistoryMonth[] = []
  let year = contractStart.year
  let month = contractStart.month

  while (!isAfterContractMonth(year, month, contractEnd)) {
    months.push({
      key: `${year}-${String(month).padStart(2, '0')}`,
      year,
      month,
      label: monthLabel(year, month),
    })

    ;({ year, month } = incrementMonth(year, month))
    if (months.length > 120) break
  }

  return months
}

/** Meses da vigência já iniciados (mês atual inclusive), excluindo meses futuros. */
export function filterElapsedContractMonths(
  months: ContractHistoryMonth[],
  reference = new Date(),
): ContractHistoryMonth[] {
  const today = todayIsoInBrazil(reference)
  const currentKey = `${today.slice(0, 4)}-${today.slice(5, 7)}`
  return months.filter((month) => month.key <= currentKey)
}

export function computeAvulsoCount(
  performed: number,
  contracted: number,
  permiteUltrapassar: boolean,
): number {
  if (!permiteUltrapassar || contracted <= 0 || performed <= contracted) return 0
  return performed - contracted
}

export function buildMonthOutcome(
  performed: number,
  contracted: number,
  avulsoCount: number,
): 'within' | 'reached' | 'exceeded' {
  if (avulsoCount > 0) return 'exceeded'
  if (contracted > 0 && performed >= contracted) return 'reached'
  return 'within'
}

export function isMonthWithinContract(input: {
  year: number
  month: number
  dataAssinatura: string
  dataEncerramento: string | null
  status: 'active' | 'expired'
}): boolean {
  const contractStart = monthFromIsoDate(input.dataAssinatura)
  if (isBeforeContractMonth(input.year, input.month, contractStart)) {
    return false
  }

  if (input.dataEncerramento) {
    const contractEnd = monthFromIsoDate(input.dataEncerramento)
    if (isAfterContractMonth(input.year, input.month, contractEnd)) {
      return false
    }
  }

  return true
}

export function clampIsoRange(
  startIso: string,
  endIso: string,
  contractStartIsoValue: string,
  contractEndIsoValue: string | null,
): { startIso: string; endIso: string } {
  let effectiveStart = startIso
  let effectiveEnd = endIso

  if (contractStartIsoValue > effectiveStart) {
    effectiveStart = contractStartIsoValue
  }

  if (contractEndIsoValue && contractEndIsoValue < effectiveEnd) {
    effectiveEnd = contractEndIsoValue
  }

  return { startIso: effectiveStart, endIso: effectiveEnd }
}
