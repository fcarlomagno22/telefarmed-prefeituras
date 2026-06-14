import {
  formatLocalTimestampAsIso,
  resolveTurnFromTime,
} from '../../lib/escalaDateTime.js'
import { parseRepasseRule } from '../admin-escala/repasseRule.js'
import type {
  ProfissionalEscalaModalityApi,
  ProfissionalEscalaSlotDto,
  ProfissionalPlantaoDto,
  ProfissionalSlotDisponivelRow,
} from './types.js'

const TELEMEDICINE_LABEL = 'Telemedicina'

function mapModality(
  modalidade: ProfissionalSlotDisponivelRow['modalidade'],
): { modality: ProfissionalEscalaModalityApi; modalityLabel: string } {
  if (modalidade === 'presencial_ubt') {
    return { modality: 'presencial', modalityLabel: 'Presencial' }
  }
  if (modalidade === 'hibrido') {
    return { modality: 'tele', modalityLabel: 'Híbrido' }
  }
  return { modality: 'tele', modalityLabel: TELEMEDICINE_LABEL }
}

export function formatProfissionalSlotRow(
  row: ProfissionalSlotDisponivelRow,
  options?: {
    status?: ProfissionalEscalaSlotDto['status']
    inscricaoId?: string
    plantaoId?: string
  },
): ProfissionalEscalaSlotDto {
  const timing = resolveTurnFromTime(row.hora_inicio)
  const { modality, modalityLabel } = mapModality(row.modalidade)
  const city = row.cidade?.trim() || null

  return {
    id: String(row.id),
    specialty: String(row.especialidade_nome),
    startAt: formatLocalTimestampAsIso(String(row.inicio_em)),
    endAt: formatLocalTimestampAsIso(String(row.fim_em)),
    turn: timing.turn,
    turnLabel: timing.turnLabel,
    modality,
    modalityLabel,
    unitName: row.unidade_nome?.trim() || null,
    municipalityName: city,
    city,
    cityUf: row.cidade_uf?.trim() || null,
    fullAddress: modality === 'presencial' ? row.endereco_completo?.trim() || null : null,
    distanceKm: null,
    amountCents: Number(row.valor_centavos ?? 0),
    vacancies: Number(row.vagas_disponiveis ?? 0),
    repasseRule: parseRepasseRule(row.repasse_regra, Number(row.valor_centavos ?? 0)),
    status: options?.status ?? 'disponivel',
    notes: row.notas?.trim() || null,
    ...(options?.inscricaoId ? { inscricaoId: options.inscricaoId } : {}),
    ...(options?.plantaoId ? { plantaoId: options.plantaoId } : {}),
  }
}

export function formatProfissionalPlantao(
  slot: ProfissionalEscalaSlotDto,
  plantao: { id: string; status: string; confirmadoEm: string; inscricaoId?: string | null },
): ProfissionalPlantaoDto {
  return {
    ...slot,
    status: 'reservado_mim',
    plantaoId: plantao.id,
    plantaoStatus: plantao.status,
    confirmadoEm: plantao.confirmadoEm,
    inscricaoId: plantao.inscricaoId ?? undefined,
  }
}
