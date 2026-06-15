import { supabaseAdmin } from '../../db/supabase.js'
import { isEscalaSlotHorarioEncerrado } from '../../lib/escalaSlotLifecycle.js'
import { PublicPlantaoAceiteError } from './errors.js'
import { formatPlantaoAceitePublicoFromSlotRow } from './formatters.js'
import { resolveConviteByToken } from './convite.service.js'
import type { PlantaoAceitePublicoResultDto } from './types.js'
import type { ProfissionalSlotDisponivelRow } from '../profissional-escala/types.js'

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

export async function getPlantaoAceitePublicoByToken(
  token: string,
): Promise<PlantaoAceitePublicoResultDto> {
  const convite = await resolveConviteByToken(token)

  const disponivel = await loadSlotRowById(convite.slot_id)
  if (disponivel) {
    return { plantao: formatPlantaoAceitePublicoFromSlotRow(disponivel) }
  }

  const fallback = await loadSlotRecordFallback(convite.slot_id)
  if (!fallback) {
    throw new PublicPlantaoAceiteError(
      'Este link de aceite não foi encontrado ou já expirou.',
      'NOT_FOUND',
      404,
    )
  }

  if (fallback.status !== 'publicada' || fallback.modo_atribuicao !== 'open') {
    throw new PublicPlantaoAceiteError(
      'Este plantão não está mais disponível para aceite.',
      'UNAVAILABLE',
      410,
    )
  }

  if (isEscalaSlotHorarioEncerrado(fallback.data, fallback.hora_fim)) {
    throw new PublicPlantaoAceiteError(
      'O prazo para aceitar este plantão já encerrou.',
      'EXPIRED',
      410,
    )
  }

  const row: ProfissionalSlotDisponivelRow = {
    id: fallback.id,
    data: fallback.data,
    hora_inicio: fallback.hora_inicio,
    hora_fim: fallback.hora_fim,
    inicio_em: `${fallback.data} ${fallback.hora_inicio}`,
    fim_em: `${fallback.data} ${fallback.hora_fim}`,
    especialidade_id: '',
    especialidade_nome: fallback.especialidade_nome,
    modalidade: fallback.modalidade,
    valor_centavos: fallback.valor_centavos,
    repasse_regra: fallback.repasse_regra,
    vagas: fallback.vagas,
    vagas_disponiveis: fallback.vagas_disponiveis,
    unidade_nome: fallback.unidade_nome,
    cidade: fallback.cidade,
    cidade_uf: fallback.cidade_uf,
    endereco_completo: fallback.endereco_completo,
    notas: fallback.notas,
    escopo_prefeitura: null,
    escopo_ubt: null,
    publicado_em: fallback.publicado_em,
  }

  const reserveQueueCount = countReserveQueue(fallback.fila_reserva)
  const plantao = formatPlantaoAceitePublicoFromSlotRow(row, { reserveQueueCount })
  return { plantao }
}

function countReserveQueue(value: unknown): number {
  if (!Array.isArray(value)) return 0
  return value.length
}

export async function loadSlotIdByConviteToken(token: string): Promise<string> {
  const convite = await resolveConviteByToken(token)
  return convite.slot_id
}
