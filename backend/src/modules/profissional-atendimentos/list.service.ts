import { supabaseAdmin } from '../../db/supabase.js'
import { isMissingSupabaseResource } from '../../lib/supabaseErrors.js'
import { mapUiStatusToDbStatus } from './formatters.js'
import { mapOperacionalRowsToRecords } from './clinical-data.service.js'
import { listConsultaIdsForProfissionalHistorico } from './historico-query.service.js'
import type { ConsultaOperacionalFullRow } from './types.js'
import type { ListAtendimentosQuery, ProfissionalAtendimentosListApi } from './schemas.js'

const OPERACIONAL_LIST_SELECT = `
  id,
  codigo_atendimento,
  paciente_id,
  profissional_id,
  especialidade_id,
  status,
  triagem_resumo,
  notas_clinicas,
  iniciada_em,
  finalizada_em,
  duracao_minutos,
  criado_em,
  paciente_nome,
  paciente_cpf,
  paciente_sexo,
  paciente_data_nascimento,
  paciente_endereco,
  paciente_foto_url,
  profissional_nome,
  profissional_conselho_sigla,
  profissional_conselho_numero,
  profissional_conselho_uf,
  especialidade_nome,
  unidade_nome
`

function periodBounds(periodStart: string, periodEnd: string): { startIso: string; endIso: string } {
  return {
    startIso: `${periodStart}T00:00:00.000Z`,
    endIso: `${periodEnd}T23:59:59.999Z`,
  }
}

export async function listProfissionalAtendimentos(
  profissionalId: string,
  query: ListAtendimentosQuery,
): Promise<ProfissionalAtendimentosListApi> {
  const { startIso, endIso } = periodBounds(query.periodStart, query.periodEnd)
  const statuses = query.status
    ? [mapUiStatusToDbStatus(query.status)]
    : ['concluida', 'interrompida']

  const consultaIds = await listConsultaIdsForProfissionalHistorico(profissionalId)
  const page = query.page
  const pageSize = query.pageSize

  if (consultaIds.length === 0) {
    return {
      records: [],
      pagination: { page, pageSize, total: 0, totalPages: 1 },
    }
  }

  let dbQuery = supabaseAdmin
    .from('vw_consultas_operacional')
    .select(OPERACIONAL_LIST_SELECT, { count: 'exact' })
    .in('id', consultaIds)
    .in('status', statuses)
    .gte('finalizada_em', startIso)
    .lte('finalizada_em', endIso)
    .order('finalizada_em', { ascending: false })

  if (query.specialty.trim()) {
    dbQuery = dbQuery.eq('especialidade_nome', query.specialty.trim())
  }

  const search = query.generalSearch.trim()
  if (search) {
    const escaped = search.replace(/[%_]/g, '\\$&')
    dbQuery = dbQuery.or(
      `paciente_nome.ilike.%${escaped}%,codigo_atendimento.ilike.%${escaped}%`,
    )
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await dbQuery.range(from, to)

  if (error) {
    if (isMissingSupabaseResource(error, 'vw_consultas_operacional')) {
      return {
        records: [],
        pagination: { page, pageSize, total: 0, totalPages: 1 },
      }
    }
    throw error
  }

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const records = await mapOperacionalRowsToRecords((data ?? []) as ConsultaOperacionalFullRow[])

  return {
    records,
    pagination: {
      page: Math.min(page, totalPages),
      totalPages,
      pageSize,
      total,
    },
  }
}
