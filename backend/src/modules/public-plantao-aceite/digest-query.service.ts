import { supabaseAdmin } from '../../db/supabase.js'
import { isEscalaSlotHorarioEncerrado } from '../../lib/escalaSlotLifecycle.js'
import { PublicPlantaoAceiteError } from './errors.js'
import {
  formatPlantaoAceitePublicoFromSlotRecord,
  formatPlantaoAceitePublicoFromSlotRow,
} from './formatters.js'
import { resolveDigestByToken } from './digest.service.js'
import type { PlantaoAceitePublicoDto } from './types.js'
import type { ProfissionalSlotDisponivelRow } from '../profissional-escala/types.js'

import type { PlantaoAceiteDigestResultDto } from './types.js'

async function loadSlotRowById(slotId: string): Promise<ProfissionalSlotDisponivelRow | null> {
  const { data, error } = await supabaseAdmin
    .from('vw_profissional_escala_slots_disponiveis')
    .select('*')
    .eq('id', slotId)
    .maybeSingle()

  if (error) throw error
  return data ? (data as ProfissionalSlotDisponivelRow) : null
}

async function loadSlotRecordFallback(slotId: string) {
  const { data, error } = await supabaseAdmin
    .from('escala_slots')
    .select(
      `
      id,
      data,
      hora_inicio,
      hora_fim,
      modalidade,
      valor_centavos,
      repasse_regra,
      vagas,
      unidade_nome,
      cidade,
      cidade_uf,
      endereco_completo,
      notas,
      publicado_em,
      status,
      modo_atribuicao,
      fila_reserva,
      config_especialidades!inner ( nome )
    `,
    )
    .eq('id', slotId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const espRaw = data.config_especialidades as unknown
  const esp = Array.isArray(espRaw) ? espRaw[0] : espRaw

  const { count, error: countError } = await supabaseAdmin
    .from('escala_plantoes_confirmados')
    .select('id', { count: 'exact', head: true })
    .eq('slot_id', slotId)
    .in('status', ['confirmado', 'realizado'])

  if (countError) throw countError

  const vagas = Number(data.vagas ?? 0)
  const vagasDisponiveis = Math.max(0, vagas - Number(count ?? 0))

  return {
    id: String(data.id),
    data: String(data.data),
    hora_inicio: String(data.hora_inicio),
    hora_fim: String(data.hora_fim),
    especialidade_nome: String((esp as { nome?: string })?.nome ?? ''),
    modalidade: data.modalidade as ProfissionalSlotDisponivelRow['modalidade'],
    valor_centavos: Number(data.valor_centavos ?? 0),
    repasse_regra: data.repasse_regra,
    vagas,
    vagas_disponiveis: vagasDisponiveis,
    unidade_nome: data.unidade_nome ? String(data.unidade_nome) : null,
    cidade: data.cidade ? String(data.cidade) : null,
    cidade_uf: data.cidade_uf ? String(data.cidade_uf) : null,
    endereco_completo: data.endereco_completo ? String(data.endereco_completo) : null,
    notas: data.notas ? String(data.notas) : null,
    publicado_em: data.publicado_em ? String(data.publicado_em) : null,
    status: String(data.status),
    modo_atribuicao: String(data.modo_atribuicao),
    fila_reserva: data.fila_reserva,
  }
}

function countReserveQueue(value: unknown): number {
  if (!Array.isArray(value)) return 0
  return value.length
}

async function formatPlantaoFromSlotId(slotId: string): Promise<PlantaoAceitePublicoDto | null> {
  const disponivel = await loadSlotRowById(slotId)
  if (disponivel) {
    return formatPlantaoAceitePublicoFromSlotRow(disponivel)
  }

  const fallback = await loadSlotRecordFallback(slotId)
  if (!fallback) return null

  if (fallback.status !== 'publicada' || fallback.modo_atribuicao !== 'open') {
    return formatPlantaoAceitePublicoFromSlotRecord(fallback, {
      reserveQueueCount: countReserveQueue(fallback.fila_reserva),
    })
  }

  if (isEscalaSlotHorarioEncerrado(fallback.data, fallback.hora_fim)) {
    return formatPlantaoAceitePublicoFromSlotRecord(fallback, {
      reserveQueueCount: countReserveQueue(fallback.fila_reserva),
    })
  }

  return formatPlantaoAceitePublicoFromSlotRecord(fallback, {
    reserveQueueCount: countReserveQueue(fallback.fila_reserva),
  })
}

function sortPlantoes(plantoes: PlantaoAceitePublicoDto[]): PlantaoAceitePublicoDto[] {
  return [...plantoes].sort((a, b) => {
    const startA = new Date(a.startAt).getTime()
    const startB = new Date(b.startAt).getTime()
    return startA - startB
  })
}

export async function getPlantaoAceiteDigestByToken(
  token: string,
): Promise<PlantaoAceiteDigestResultDto> {
  const digest = await resolveDigestByToken(token)

  const plantoes: PlantaoAceitePublicoDto[] = []
  for (const slotId of digest.slot_ids) {
    const plantao = await formatPlantaoFromSlotId(slotId)
    if (plantao) plantoes.push(plantao)
  }

  if (plantoes.length === 0) {
    throw new PublicPlantaoAceiteError(
      'Não há mais vagas disponíveis neste link.',
      'UNAVAILABLE',
      410,
    )
  }

  const sorted = sortPlantoes(plantoes)
  const totalVagas = sorted.reduce((sum, plantao) => {
    if (plantao.status === 'disponivel') return sum + plantao.vacancies
    return sum
  }, 0)

  return {
    totalVagas,
    plantoes: sorted,
  }
}
