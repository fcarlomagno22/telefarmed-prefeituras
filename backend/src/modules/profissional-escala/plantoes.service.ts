import { supabaseAdmin } from '../../db/supabase.js'
import { formatLocalTimestampAsIso } from '../../lib/escalaDateTime.js'
import { formatProfissionalPlantao, formatProfissionalSlotRow } from './formatters.js'
import type { ProfissionalEscalaContext, ProfissionalPlantaoDto, ProfissionalSlotDisponivelRow } from './types.js'

async function loadSlotRowsByIds(slotIds: string[]): Promise<Map<string, ProfissionalSlotDisponivelRow>> {
  if (slotIds.length === 0) return new Map()

  const uniqueIds = [...new Set(slotIds)]
  const { data, error } = await supabaseAdmin
    .from('vw_profissional_escala_slots_disponiveis')
    .select('*')
    .in('id', uniqueIds)

  const fromView = new Map<string, ProfissionalSlotDisponivelRow>()
  if (!error && data) {
    for (const row of data as ProfissionalSlotDisponivelRow[]) {
      fromView.set(String(row.id), row)
    }
  }

  const missingIds = uniqueIds.filter((id) => !fromView.has(id))
  if (missingIds.length === 0) return fromView

  const { data: slotRows, error: slotError } = await supabaseAdmin
    .from('escala_slots')
    .select(
      'id, data, hora_inicio, hora_fim, especialidade_id, modalidade, valor_centavos, repasse_regra, vagas, unidade_nome, cidade, cidade_uf, endereco_completo, notas, escopo_prefeitura, escopo_ubt, publicado_em, config_especialidades!inner(nome)',
    )
    .in('id', missingIds)

  if (slotError) throw slotError

  for (const row of slotRows ?? []) {
    const especialidade = row.config_especialidades as unknown as { nome: string }
    const inicioEm = `${row.data} ${row.hora_inicio}`
    const fimEm = `${row.data} ${row.hora_fim}`
    fromView.set(String(row.id), {
      id: String(row.id),
      data: String(row.data),
      hora_inicio: String(row.hora_inicio),
      hora_fim: String(row.hora_fim),
      inicio_em: inicioEm,
      fim_em: fimEm,
      especialidade_id: String(row.especialidade_id),
      especialidade_nome: String(especialidade?.nome ?? ''),
      modalidade: row.modalidade as ProfissionalSlotDisponivelRow['modalidade'],
      valor_centavos: Number(row.valor_centavos ?? 0),
      repasse_regra: row.repasse_regra,
      vagas: Number(row.vagas ?? 0),
      vagas_disponiveis: 0,
      unidade_nome: row.unidade_nome ? String(row.unidade_nome) : null,
      cidade: row.cidade ? String(row.cidade) : null,
      cidade_uf: row.cidade_uf ? String(row.cidade_uf) : null,
      endereco_completo: row.endereco_completo ? String(row.endereco_completo) : null,
      notas: row.notas ? String(row.notas) : null,
      escopo_prefeitura: row.escopo_prefeitura,
      escopo_ubt: row.escopo_ubt,
      publicado_em: row.publicado_em ? String(row.publicado_em) : null,
    })
  }

  return fromView
}

export async function listProfissionalMeusPlantoes(
  ctx: ProfissionalEscalaContext,
): Promise<ProfissionalPlantaoDto[]> {
  const { data, error } = await supabaseAdmin
    .from('escala_plantoes_confirmados')
    .select('id, slot_id, status, confirmado_em, inscricao_id')
    .eq('profissional_id', ctx.profissionalId)
    .in('status', ['confirmado', 'realizado'])
    .order('confirmado_em', { ascending: false })

  if (error) throw error

  const plantoes = data ?? []
  const slotIds = plantoes.map((row) => String(row.slot_id))
  const slotsById = await loadSlotRowsByIds(slotIds)

  const result: ProfissionalPlantaoDto[] = []

  for (const plantao of plantoes) {
    const slotRow = slotsById.get(String(plantao.slot_id))
    if (!slotRow) continue

    const slot = formatProfissionalSlotRow(slotRow, {
      status: 'reservado_mim',
      plantaoId: String(plantao.id),
      inscricaoId: plantao.inscricao_id ? String(plantao.inscricao_id) : undefined,
    })

    result.push(
      formatProfissionalPlantao(slot, {
        id: String(plantao.id),
        status: String(plantao.status),
        confirmadoEm: formatLocalTimestampAsIso(String(plantao.confirmado_em)),
        inscricaoId: plantao.inscricao_id ? String(plantao.inscricao_id) : null,
      }),
    )
  }

  return result.sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  )
}
