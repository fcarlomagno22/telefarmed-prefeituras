import type { HydrationDayRecordDto, PacienteMetricasLeituraRow } from './types.js'
import { formatDateKeyInAppTz } from './peso.formatters.js'

export function formatHidratacaoMl(value: number): number {
  return Math.round(Math.max(0, value))
}

export function buildHydrationDayId(dateKey: string): string {
  return `hydration-${dateKey}`
}

export function aggregateHidratacaoLeituras(
  rows: PacienteMetricasLeituraRow[],
): HydrationDayRecordDto[] {
  const totalsByDate = new Map<string, number>()

  for (const row of rows) {
    const dateKey = formatDateKeyInAppTz(row.registrado_em)
    const current = totalsByDate.get(dateKey) ?? 0
    totalsByDate.set(dateKey, current + formatHidratacaoMl(Number(row.valor)))
  }

  return [...totalsByDate.entries()]
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([date, totalMl]) => ({
      id: buildHydrationDayId(date),
      date,
      totalMl,
    }))
}
