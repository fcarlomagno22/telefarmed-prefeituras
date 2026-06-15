import {
  formatLocalTimestampAsIso,
  resolveShiftTurnLabel,
  resolveSlotTimestampIso,
} from '../../lib/escalaDateTime.js'
import { parseRepasseRule, type EscalaRepasseRule } from '../admin-escala/repasseRule.js'
import type { ProfissionalSlotDisponivelRow } from '../profissional-escala/types.js'
import type { PlantaoAceitePublicoDto, PlantaoAceitePublicoStatus } from './types.js'

const APP_TIMEZONE = 'America/Sao_Paulo'

function mapModality(
  modalidade: ProfissionalSlotDisponivelRow['modalidade'],
): { modality: 'tele' | 'presencial'; modalityLabel: string } {
  if (modalidade === 'presencial_ubt') {
    return { modality: 'presencial', modalityLabel: 'Presencial na UBT' }
  }
  if (modalidade === 'hibrido') {
    return { modality: 'tele', modalityLabel: 'Híbrido' }
  }
  return { modality: 'tele', modalityLabel: 'Telemedicina' }
}

function formatPublishedAtLabel(iso: string | null): string {
  if (!iso) return '—'
  const instant = new Date(iso)
  if (Number.isNaN(instant.getTime())) return iso
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: APP_TIMEZONE,
  }).format(instant)
}

function formatPrazoAceiteLabel(data: string, horaInicio: string): string {
  const instant = new Date(resolveSlotTimestampIso(data, horaInicio))
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: APP_TIMEZONE,
  }).format(instant)
}

function parseReserveQueue(value: unknown): number {
  if (!Array.isArray(value)) return 0
  return value.length
}

function resolveStatus(
  row: ProfissionalSlotDisponivelRow,
  options?: { reserveQueueCount?: number },
): PlantaoAceitePublicoStatus {
  if (Number(row.vagas_disponiveis ?? 0) > 0) return 'disponivel'
  if ((options?.reserveQueueCount ?? 0) >= 0) return 'vagas_esgotadas'
  return 'indisponivel'
}

export function formatPlantaoAceitePublicoFromSlotRow(
  row: ProfissionalSlotDisponivelRow,
  options?: { reserveQueueCount?: number },
): PlantaoAceitePublicoDto {
  const turnLabel = resolveShiftTurnLabel(String(row.hora_inicio), String(row.hora_fim))
  const { modality, modalityLabel } = mapModality(row.modalidade)
  const valorCentavos = Number(row.valor_centavos ?? 0)
  const repasseRule: EscalaRepasseRule = parseRepasseRule(row.repasse_regra, valorCentavos)

  const vacancies = Number(row.vagas_disponiveis ?? 0)
  const reserveQueueCount = options?.reserveQueueCount ?? 0
  const status = resolveStatus(row, { reserveQueueCount })

  return {
    slotId: String(row.id),
    specialty: String(row.especialidade_nome),
    startAt: formatLocalTimestampAsIso(String(row.inicio_em)),
    endAt: formatLocalTimestampAsIso(String(row.fim_em)),
    turnLabel,
    modality,
    modalityLabel,
    unitName: row.unidade_nome?.trim() || null,
    city: row.cidade?.trim() || null,
    cityUf: row.cidade_uf?.trim() || null,
    fullAddress: modality === 'presencial' ? row.endereco_completo?.trim() || null : null,
    vacancies,
    amountCents: valorCentavos,
    repasseRule,
    notes: row.notas?.trim() || null,
    publishedAt: row.publicado_em ? String(row.publicado_em) : new Date().toISOString(),
    publishedAtLabel: formatPublishedAtLabel(row.publicado_em ? String(row.publicado_em) : null),
    prazoAceiteLabel: formatPrazoAceiteLabel(String(row.data), String(row.hora_inicio)),
    status,
    canApplyAsReserve: status === 'vagas_esgotadas',
    reserveQueueCount,
  }
}

export function formatPlantaoAceitePublicoFromSlotRecord(slot: {
  id: string
  data: string
  hora_inicio: string
  hora_fim: string
  especialidade_nome: string
  modalidade: ProfissionalSlotDisponivelRow['modalidade']
  valor_centavos: number
  repasse_regra: unknown
  vagas: number
  vagas_disponiveis: number
  unidade_nome: string | null
  cidade: string | null
  cidade_uf: string | null
  endereco_completo: string | null
  notas: string | null
  publicado_em: string | null
  fila_reserva?: unknown
}, options?: { reserveQueueCount?: number }): PlantaoAceitePublicoDto {
  const row: ProfissionalSlotDisponivelRow = {
    id: slot.id,
    data: slot.data,
    hora_inicio: slot.hora_inicio,
    hora_fim: slot.hora_fim,
    inicio_em: `${slot.data} ${slot.hora_inicio}`,
    fim_em: `${slot.data} ${slot.hora_fim}`,
    especialidade_id: '',
    especialidade_nome: slot.especialidade_nome,
    modalidade: slot.modalidade,
    valor_centavos: slot.valor_centavos,
    repasse_regra: slot.repasse_regra,
    vagas: slot.vagas,
    vagas_disponiveis: slot.vagas_disponiveis,
    unidade_nome: slot.unidade_nome,
    cidade: slot.cidade,
    cidade_uf: slot.cidade_uf,
    endereco_completo: slot.endereco_completo,
    notas: slot.notas,
    escopo_prefeitura: null,
    escopo_ubt: null,
    publicado_em: slot.publicado_em,
  }

  return formatPlantaoAceitePublicoFromSlotRow(row, {
    reserveQueueCount: options?.reserveQueueCount ?? parseReserveQueue(slot.fila_reserva),
  })
}
