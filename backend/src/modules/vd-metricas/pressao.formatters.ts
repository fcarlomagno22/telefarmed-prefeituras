import { VdMetricasError } from './errors.js'
import type { BloodPressureHistoryEntryDto, PacienteMetricasLeituraRow } from './types.js'

export function formatPressaoMmHg(value: number): number {
  return Math.round(Math.max(0, value))
}

export function leituraToBloodPressureHistoryEntry(
  row: PacienteMetricasLeituraRow,
): BloodPressureHistoryEntryDto {
  if (row.valor_secundario == null) {
    throw new VdMetricasError('Diastólica ausente na leitura de pressão.', 'INVALID_DATA')
  }

  return {
    id: row.id,
    recordedAt: row.registrado_em,
    systolic: formatPressaoMmHg(Number(row.valor)),
    diastolic: formatPressaoMmHg(Number(row.valor_secundario)),
  }
}

export function mapPressaoLeituras(
  rows: PacienteMetricasLeituraRow[],
): BloodPressureHistoryEntryDto[] {
  return rows.map(leituraToBloodPressureHistoryEntry)
}
