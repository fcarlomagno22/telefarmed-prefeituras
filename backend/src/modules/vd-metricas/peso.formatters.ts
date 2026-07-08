import { VdMetricasError } from './errors.js'
import type { MetricDataPointDto } from './types.js'

const APP_TIMEZONE = 'America/Sao_Paulo'

type PesoLeituraLike = {
  registrado_em: string
  valor: number
}

export function formatPesoValue(value: number): number {
  return Number(Math.max(0, value).toFixed(1))
}

export function formatDateKeyInAppTz(iso: string): string {
  const instant = new Date(iso)
  if (Number.isNaN(instant.getTime())) {
    throw new VdMetricasError('Data de registro inválida.', 'INVALID_DATA')
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant)

  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value

  if (!year || !month || !day) {
    throw new VdMetricasError('Data de registro inválida.', 'INVALID_DATA')
  }

  return `${year}-${month}-${day}`
}

export function getHourInAppTz(iso: string): number {
  const instant = new Date(iso)
  if (Number.isNaN(instant.getTime())) {
    throw new VdMetricasError('Data de registro inválida.', 'INVALID_DATA')
  }

  const hour = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIMEZONE,
    hour: 'numeric',
    hour12: false,
  }).format(instant)

  return Number.parseInt(hour, 10)
}

export function resolvePesoPeriodBounds(input: {
  start?: string
  end?: string
}): { startIso: string; endIso: string } {
  const endDate = input.end ? new Date(input.end) : new Date()
  if (Number.isNaN(endDate.getTime())) {
    throw new VdMetricasError('Período inválido.', 'INVALID_DATA')
  }

  const defaultStart = new Date(endDate)
  defaultStart.setDate(defaultStart.getDate() - 89)
  defaultStart.setHours(0, 0, 0, 0)

  const startDate = input.start ? new Date(input.start) : defaultStart
  if (Number.isNaN(startDate.getTime())) {
    throw new VdMetricasError('Período inválido.', 'INVALID_DATA')
  }

  if (startDate.getTime() > endDate.getTime()) {
    throw new VdMetricasError('Período inválido.', 'INVALID_DATA')
  }

  return {
    startIso: startDate.toISOString(),
    endIso: endDate.toISOString(),
  }
}

export function shouldIncludeHourInPesoSeries(startIso: string, endIso: string): boolean {
  return formatDateKeyInAppTz(startIso) === formatDateKeyInAppTz(endIso)
}

export function leituraToDataPoint(
  row: PesoLeituraLike,
  includeHour: boolean,
): MetricDataPointDto {
  const point: MetricDataPointDto = {
    date: formatDateKeyInAppTz(row.registrado_em),
    value: formatPesoValue(Number(row.valor)),
  }

  if (includeHour) {
    point.hour = getHourInAppTz(row.registrado_em)
  }

  return point
}

/** Agrega leituras diárias (última do dia) ou horárias conforme o período. */
export function aggregatePesoLeituras(
  rows: PesoLeituraLike[],
  includeHour: boolean,
): MetricDataPointDto[] {
  if (includeHour) {
    return rows.map((row) => leituraToDataPoint(row, true))
  }

  const byDate = new Map<string, MetricDataPointDto>()
  for (const row of rows) {
    const point = leituraToDataPoint(row, false)
    byDate.set(point.date, point)
  }

  return [...byDate.values()].sort((left, right) => left.date.localeCompare(right.date))
}
