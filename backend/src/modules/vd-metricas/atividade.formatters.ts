import type { AtividadeDayRecordDto, PacienteMetricasLeituraRow } from './types.js'
import { VdMetricasError } from './errors.js'
import { formatDateKeyInAppTz } from './peso.formatters.js'

/** Alinhado a app_cidades/src/data/mockStepsHistory.ts */
export const ATIVIDADE_STRIDE_KM = 0.000762
export const ATIVIDADE_STEPS_PER_MINUTE_ESTIMATE = 110
export const ATIVIDADE_CORRIDA_STEPS_PER_MINUTE_ESTIMATE = 170
export const ATIVIDADE_CORRIDA_CAMINHADA_STEPS_PER_MINUTE_ESTIMATE = 140

export type AtividadeLeituraKind = 'caminhada' | 'corrida' | 'corrida-caminhada'

const ATIVIDADE_STEPS_PER_MINUTE_BY_KIND: Record<AtividadeLeituraKind, number> = {
  caminhada: ATIVIDADE_STEPS_PER_MINUTE_ESTIMATE,
  corrida: ATIVIDADE_CORRIDA_STEPS_PER_MINUTE_ESTIMATE,
  'corrida-caminhada': ATIVIDADE_CORRIDA_CAMINHADA_STEPS_PER_MINUTE_ESTIMATE,
}

export function resolveAtividadeStepsPerMinuteEstimate(kind: AtividadeLeituraKind): number {
  return ATIVIDADE_STEPS_PER_MINUTE_BY_KIND[kind]
}

export function formatAtividadeSteps(value: number): number {
  return Math.round(Math.max(0, value))
}

export function formatAtividadeDistanceKm(value: number): number {
  return Number(Math.max(0, value).toFixed(3))
}

export function deriveDistanceKmFromSteps(steps: number): number {
  return formatAtividadeDistanceKm(steps * ATIVIDADE_STRIDE_KM)
}

export function deriveStepsFromDistanceKm(distanceKm: number): number {
  return formatAtividadeSteps(distanceKm / ATIVIDADE_STRIDE_KM)
}

export function deriveStepsFromDurationMinutes(
  durationMinutes: number,
  kind: AtividadeLeituraKind = 'caminhada',
): number {
  return formatAtividadeSteps(
    durationMinutes * resolveAtividadeStepsPerMinuteEstimate(kind),
  )
}

export function resolveAtividadeMetrics(
  input: {
    steps?: number
    distanceKm?: number
    durationMinutes?: number
  },
  kind: AtividadeLeituraKind = 'caminhada',
): {
  steps: number
  distanceKm: number
  distanceKmExplicit: boolean
  durationMinutes?: number
} {
  let steps = input.steps != null ? formatAtividadeSteps(input.steps) : undefined
  let distanceKm =
    input.distanceKm != null ? formatAtividadeDistanceKm(input.distanceKm) : undefined
  const distanceKmExplicit = input.distanceKm != null

  if (steps == null && input.durationMinutes != null) {
    steps = deriveStepsFromDurationMinutes(input.durationMinutes, kind)
  }

  if (steps == null && distanceKm != null) {
    steps = deriveStepsFromDistanceKm(distanceKm)
  }

  if (steps == null || steps <= 0) {
    throw new VdMetricasError('Informe passos, distância ou duração válidos.', 'INVALID_DATA')
  }

  if (distanceKm == null) {
    distanceKm = deriveDistanceKmFromSteps(steps)
  }

  return {
    steps,
    distanceKm,
    distanceKmExplicit,
    durationMinutes: input.durationMinutes,
  }
}

/** @deprecated Use resolveAtividadeMetrics */
export function resolveCaminhadaMetrics(input: {
  steps?: number
  distanceKm?: number
  durationMinutes?: number
}) {
  return resolveAtividadeMetrics(input, 'caminhada')
}

export function buildAtividadeDayId(dateKey: string): string {
  return `activity-${dateKey}`
}

type DailyAtividadeAggregate = {
  steps: number
  distanceKm: number
  hasManual: boolean
  sourceLabel?: string
}

function readDistanceKmContribution(row: PacienteMetricasLeituraRow): number {
  if (row.tipo === 'distancia') {
    return formatAtividadeDistanceKm(Number(row.valor))
  }

  const metadataDistance = row.metadados.distanceKm
  if (typeof metadataDistance === 'number' && Number.isFinite(metadataDistance)) {
    return formatAtividadeDistanceKm(metadataDistance)
  }

  return deriveDistanceKmFromSteps(formatAtividadeSteps(Number(row.valor)))
}

function readSourceLabel(row: PacienteMetricasLeituraRow): string | undefined {
  const raw = row.metadados.sourceLabel
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined
}

export function aggregateAtividadeLeituras(
  rows: PacienteMetricasLeituraRow[],
): AtividadeDayRecordDto[] {
  const byDate = new Map<string, DailyAtividadeAggregate>()

  for (const row of rows) {
    const dateKey = formatDateKeyInAppTz(row.registrado_em)
    const current = byDate.get(dateKey) ?? {
      steps: 0,
      distanceKm: 0,
      hasManual: false,
    }

    if (row.tipo === 'passos') {
      current.steps += formatAtividadeSteps(Number(row.valor))
    }

    current.distanceKm = formatAtividadeDistanceKm(
      current.distanceKm + readDistanceKmContribution(row),
    )

    if (row.origem === 'manual') {
      current.hasManual = true
    } else {
      const label = readSourceLabel(row)
      if (label) current.sourceLabel = label
    }

    byDate.set(dateKey, current)
  }

  return [...byDate.entries()]
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([date, aggregate]) => {
      const day: AtividadeDayRecordDto = {
        id: buildAtividadeDayId(date),
        date,
        steps: aggregate.steps,
        distanceKm:
          aggregate.distanceKm > 0
            ? aggregate.distanceKm
            : deriveDistanceKmFromSteps(aggregate.steps),
      }

      if (aggregate.hasManual) {
        day.source = 'manual'
      } else if (aggregate.sourceLabel) {
        day.source = 'integracao'
        day.sourceLabel = aggregate.sourceLabel
      }

      return day
    })
}

export function leituraToAtividadeDayRecord(
  rows: PacienteMetricasLeituraRow[],
): AtividadeDayRecordDto | null {
  const [day] = aggregateAtividadeLeituras(rows)
  return day ?? null
}
