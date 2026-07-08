import type {
  ContextoFrequenciaCardiacaPaciente,
  HeartRateHistoryEntryDto,
  OrigemMetricaPaciente,
  PacienteMetricasLeituraRow,
} from './types.js'

export function formatFrequenciaBpm(value: number): number {
  return Math.round(Math.max(0, value))
}

function readHeartRateContext(
  row: PacienteMetricasLeituraRow,
): ContextoFrequenciaCardiacaPaciente {
  const raw = row.metadados.context
  if (
    raw === 'resting' ||
    raw === 'workout' ||
    raw === 'sleep' ||
    raw === 'manual'
  ) {
    return raw
  }

  return row.origem === 'integracao' ? 'resting' : 'manual'
}

function readHeartRateSourceLabel(row: PacienteMetricasLeituraRow): string | undefined {
  const raw = row.metadados.sourceLabel
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined
}

function mapOrigemToApiSource(origem: OrigemMetricaPaciente): HeartRateHistoryEntryDto['source'] {
  return origem === 'integracao' ? 'integracao' : 'manual'
}

export function leituraToHeartRateHistoryEntry(
  row: PacienteMetricasLeituraRow,
): HeartRateHistoryEntryDto {
  const entry: HeartRateHistoryEntryDto = {
    id: row.id,
    recordedAt: row.registrado_em,
    bpm: formatFrequenciaBpm(Number(row.valor)),
    source: mapOrigemToApiSource(row.origem),
    context: readHeartRateContext(row),
  }

  const sourceLabel = readHeartRateSourceLabel(row)
  if (sourceLabel) {
    entry.sourceLabel = sourceLabel
  }

  return entry
}

export function mapFrequenciaCardiacaLeituras(
  rows: PacienteMetricasLeituraRow[],
): HeartRateHistoryEntryDto[] {
  return rows.map(leituraToHeartRateHistoryEntry)
}
