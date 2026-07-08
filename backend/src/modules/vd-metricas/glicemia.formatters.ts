import { VdMetricasError } from './errors.js'
import type { GlucoseHistoryEntryDto, PacienteMetricasLeituraRow } from './types.js'

export function formatGlicemiaAmountMg(value: number): number {
  return Math.round(Math.max(0, value))
}

export function leituraToGlucoseHistoryEntry(row: PacienteMetricasLeituraRow): GlucoseHistoryEntryDto {
  if (!row.contexto_glicemia) {
    throw new VdMetricasError('Contexto de glicemia ausente na leitura.', 'INVALID_DATA')
  }

  return {
    id: row.id,
    recordedAt: row.registrado_em,
    amountMg: formatGlicemiaAmountMg(Number(row.valor)),
    context: row.contexto_glicemia,
  }
}

export function mapGlicemiaLeituras(rows: PacienteMetricasLeituraRow[]): GlucoseHistoryEntryDto[] {
  return rows.map(leituraToGlucoseHistoryEntry)
}
