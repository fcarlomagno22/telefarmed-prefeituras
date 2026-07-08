import type {
  MedidaCorporalPaciente,
  MedidasCorporaisHistoricoDto,
  MetricDataPointDto,
  PacienteMetricasLeituraRow,
} from './types.js'
import { formatDateKeyInAppTz } from './peso.formatters.js'

const MEDIDA_DECIMALS: Record<MedidaCorporalPaciente, number> = {
  abdomen: 0,
  quadril: 0,
  peito: 0,
  cintura: 0,
  coxa: 0,
  braco: 1,
  pescoco: 1,
}

export function formatMedidaCorporalValueCm(
  measurementId: MedidaCorporalPaciente,
  value: number,
): number {
  const decimals = MEDIDA_DECIMALS[measurementId]
  return Number(Math.max(0, value).toFixed(decimals))
}

export function leituraToMedidaCorporalPoint(
  row: PacienteMetricasLeituraRow,
): MetricDataPointDto | null {
  if (!row.medida_corporal) return null

  return {
    date: formatDateKeyInAppTz(row.registrado_em),
    value: formatMedidaCorporalValueCm(row.medida_corporal, Number(row.valor)),
  }
}

/** Agrega leituras por medida, mantendo a última do dia. */
export function aggregateMedidasCorporaisLeituras(
  rows: PacienteMetricasLeituraRow[],
): MedidasCorporaisHistoricoDto['measurements'] {
  const grouped = new Map<MedidaCorporalPaciente, Map<string, MetricDataPointDto>>()

  for (const row of rows) {
    if (!row.medida_corporal) continue

    const point = leituraToMedidaCorporalPoint(row)
    if (!point) continue

    const byDate = grouped.get(row.medida_corporal) ?? new Map<string, MetricDataPointDto>()
    byDate.set(point.date, point)
    grouped.set(row.medida_corporal, byDate)
  }

  const measurements: MedidasCorporaisHistoricoDto['measurements'] = {}
  for (const [measurementId, byDate] of grouped.entries()) {
    measurements[measurementId] = [...byDate.values()].sort((left, right) =>
      left.date.localeCompare(right.date),
    )
  }

  return measurements
}

export function pickMedidasCorporaisHistorico(
  measurements: MedidasCorporaisHistoricoDto['measurements'],
  tipo?: MedidaCorporalPaciente,
): MedidasCorporaisHistoricoDto['measurements'] {
  if (!tipo) return measurements
  const points = measurements[tipo]
  return points ? { [tipo]: points } : {}
}
