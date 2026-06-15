import {
  formatLocalTimestampAsIso,
  resolveTurnFromTime,
} from '../../lib/escalaDateTime.js'
import { parseRepasseRule } from './repasseRule.js'
import type {
  AdminEscalaShiftDto,
  AdminEscalaShiftExecutionSummaryDto,
  ClaimCaptureRow,
  EscalaScopePrefeitura,
  EscalaScopeUbt,
  SlotListagemRow,
} from './types.js'

const TURN_LABEL: Record<'manha' | 'tarde' | 'noite', string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
}

export function escapeIlikeTerm(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&')
}

function parseScopePrefeitura(raw: unknown): EscalaScopePrefeitura {
  if (!raw || typeof raw !== 'object') {
    return { mode: 'all', prefeituraIds: [] }
  }
  const obj = raw as Record<string, unknown>
  const mode = obj.mode === 'selected' ? 'selected' : 'all'
  const prefeituraIds = Array.isArray(obj.prefeituraIds)
    ? obj.prefeituraIds.map(String).filter(Boolean)
    : []
  const contratosPorPrefeitura =
    obj.contratosPorPrefeitura && typeof obj.contratosPorPrefeitura === 'object'
      ? Object.fromEntries(
          Object.entries(obj.contratosPorPrefeitura as Record<string, unknown>).map(([key, value]) => [
            String(key),
            String(value),
          ]),
        )
      : undefined
  return { mode, prefeituraIds, ...(contratosPorPrefeitura ? { contratosPorPrefeitura } : {}) }
}

function parseScopeUbt(raw: unknown): EscalaScopeUbt {
  if (!raw || typeof raw !== 'object') {
    return { mode: 'all', ubtIds: [] }
  }
  const obj = raw as Record<string, unknown>
  const mode =
    obj.mode === 'selected' || obj.mode === 'tele_only' ? obj.mode : 'all'
  const ubtIds = Array.isArray(obj.ubtIds) ? obj.ubtIds.map(String).filter(Boolean) : []
  return { mode, ubtIds }
}

function parseBackupIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.map(String).filter(Boolean)
}

function mapSlotStatus(status: SlotListagemRow['status']): AdminEscalaShiftDto['status'] {
  if (status === 'cancelada') return 'cancelada'
  if (status === 'rascunho') return 'rascunho'
  return 'publicada'
}

export function formatSlotRow(
  row: SlotListagemRow,
  captures: ClaimCaptureRow[] = [],
  execution: AdminEscalaShiftExecutionSummaryDto = {
    executionStatus: 'na',
    realizadoCount: 0,
    confirmadoCount: 0,
    totalPlantoes: 0,
  },
): AdminEscalaShiftDto {
  const assignmentMode = row.modo_atribuicao
  const totalVacancies = assignmentMode === 'open' ? row.vagas : 0
  const vacancies = assignmentMode === 'open' ? row.vagas_disponiveis : 0
  const timing = resolveTurnFromTime(row.hora_inicio)

  return {
    id: row.id,
    batchId: row.lote_id ?? undefined,
    contratoEntidadeId: row.contrato_entidade_id,
    assignmentMode,
    primaryDoctorId: row.profissional_titular_id ?? '',
    backupDoctorIds: parseBackupIds(row.fila_reserva),
    specialtyId: row.especialidade_id,
    specialty: row.especialidade_nome,
    modality: row.modalidade,
    startAt: formatLocalTimestampAsIso(row.inicio_em),
    endAt: formatLocalTimestampAsIso(row.fim_em),
    turn: timing.turn,
    turnLabel: TURN_LABEL[timing.turn] ?? timing.turnLabel,
    prefeituraScope: parseScopePrefeitura(row.escopo_prefeitura),
    ubtScope: parseScopeUbt(row.escopo_ubt),
    status: mapSlotStatus(row.status),
    vacancies,
    totalVacancies,
    amountCents: row.valor_centavos,
    repasseRule: parseRepasseRule(row.repasse_regra, row.valor_centavos),
    unitName: row.unidade_nome,
    city: row.cidade,
    cityUf: row.cidade_uf,
    fullAddress: row.endereco_completo,
    claimedCaptures: captures.map((capture) => ({
      doctorId: capture.profissional_id,
      doctorName: capture.profissional_nome,
      claimedAt: capture.confirmado_em,
    })),
    notes: row.notas,
    createdAt: row.criado_em,
    updatedAt: row.atualizado_em,
    executionStatus: execution.executionStatus,
    realizadoCount: execution.realizadoCount,
    confirmadoCount: execution.confirmadoCount,
    totalPlantoes: execution.totalPlantoes,
  }
}

export function groupCapturesBySlot(rows: ClaimCaptureRow[]): Map<string, ClaimCaptureRow[]> {
  const map = new Map<string, ClaimCaptureRow[]>()
  for (const row of rows) {
    const current = map.get(row.slot_id) ?? []
    current.push(row)
    map.set(row.slot_id, current)
  }
  return map
}

const CONTRATO_STATUS_LABEL: Record<string, string> = {
  ativo: 'Ativo',
  encerrado: 'Encerrado',
  suspenso: 'Suspenso',
  implantacao: 'Implantação',
}

export function formatContratoStatusLabel(status: string): string {
  return CONTRATO_STATUS_LABEL[status] ?? status
}

export function formatUbtStatus(status: string): 'ativa' | 'manutencao' | 'inativa' {
  if (status === 'manutencao') return 'manutencao'
  if (status === 'inativa' || status === 'inativo') return 'inativa'
  return 'ativa'
}
