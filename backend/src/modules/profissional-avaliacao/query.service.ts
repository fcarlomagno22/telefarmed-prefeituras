import { supabaseAdmin } from '../../db/supabase.js'
import { isMissingSupabaseResource } from '../../lib/supabaseErrors.js'
import { listConsultaIdsForProfissionalHistorico } from '../profissional-atendimentos/historico-query.service.js'
import {
  isCriticalRating,
  resolveReviewComment,
  resolveReviewRating,
} from './formatters.js'
import type { ListAvaliacoesQuery } from './schemas.js'
import type {
  ConsultaAvaliacaoRow,
  ConsultaOperacionalAvaliacaoRow,
  ProfissionalReviewRow,
} from './types.js'

const CHUNK_SIZE = 150

const AVALIACAO_SELECT = `
  id,
  consulta_id,
  nota,
  comentario,
  avaliado_em,
  nota_profissional,
  comentario_profissional
`

const OPERACIONAL_SELECT = `
  id,
  codigo_atendimento,
  paciente_nome,
  paciente_foto_url
`

async function fetchInChunks<T>(
  ids: string[],
  fetcher: (chunk: string[]) => Promise<T[]>,
): Promise<T[]> {
  if (ids.length === 0) return []

  const results: T[] = []
  for (let index = 0; index < ids.length; index += CHUNK_SIZE) {
    const chunk = ids.slice(index, index + CHUNK_SIZE)
    const rows = await fetcher(chunk)
    results.push(...rows)
  }
  return results
}

function periodBounds(query: ListAvaliacoesQuery): { startIso?: string; endIso?: string } {
  return {
    startIso: query.periodFrom ? `${query.periodFrom}T00:00:00.000Z` : undefined,
    endIso: query.periodTo ? `${query.periodTo}T23:59:59.999Z` : undefined,
  }
}

async function fetchAvaliacoesForConsultas(
  consultaIds: string[],
  query: ListAvaliacoesQuery,
): Promise<ConsultaAvaliacaoRow[]> {
  const { startIso, endIso } = periodBounds(query)

  return fetchInChunks(consultaIds, async (chunk) => {
    let dbQuery = supabaseAdmin
      .from('consulta_avaliacoes')
      .select(AVALIACAO_SELECT)
      .in('consulta_id', chunk)
      .order('avaliado_em', { ascending: false })

    if (startIso) dbQuery = dbQuery.gte('avaliado_em', startIso)
    if (endIso) dbQuery = dbQuery.lte('avaliado_em', endIso)

    const { data, error } = await dbQuery
    if (error) {
      if (isMissingSupabaseResource(error, 'consulta_avaliacoes')) return []
      throw error
    }

    return (data ?? []) as ConsultaAvaliacaoRow[]
  })
}

async function fetchOperacionalByConsultaIds(
  consultaIds: string[],
): Promise<Map<string, ConsultaOperacionalAvaliacaoRow>> {
  const rows = await fetchInChunks(consultaIds, async (chunk) => {
    const { data, error } = await supabaseAdmin
      .from('vw_consultas_operacional')
      .select(OPERACIONAL_SELECT)
      .in('id', chunk)

    if (error) {
      if (isMissingSupabaseResource(error, 'vw_consultas_operacional')) return []
      throw error
    }

    return (data ?? []) as ConsultaOperacionalAvaliacaoRow[]
  })

  return new Map(rows.map((row) => [String(row.id), row]))
}

function applyClientFilters(
  reviews: ProfissionalReviewRow[],
  query: ListAvaliacoesQuery,
): ProfissionalReviewRow[] {
  let rows = reviews

  if (query.criticos) {
    rows = rows.filter((review) => isCriticalRating(review.rating))
  }

  if (query.notaMinima != null) {
    rows = rows.filter((review) => review.rating >= query.notaMinima!)
  }

  const search = query.search?.trim().toLowerCase()
  if (search) {
    rows = rows.filter(
      (review) =>
        review.patientName.toLowerCase().includes(search) ||
        review.comment.toLowerCase().includes(search) ||
        review.consultaRef.toLowerCase().includes(search),
    )
  }

  return rows
}

export async function loadProfissionalReviews(
  profissionalId: string,
  query: ListAvaliacoesQuery,
): Promise<ProfissionalReviewRow[]> {
  const consultaIds = await listConsultaIdsForProfissionalHistorico(profissionalId)
  if (consultaIds.length === 0) return []

  const avaliacoes = await fetchAvaliacoesForConsultas(consultaIds, query)
  if (avaliacoes.length === 0) return []

  const consultaIdsWithReview = [...new Set(avaliacoes.map((row) => String(row.consulta_id)))]
  const operacionalById = await fetchOperacionalByConsultaIds(consultaIdsWithReview)

  const reviews = avaliacoes
    .map((row) => {
      const consultaId = String(row.consulta_id)
      const operacional = operacionalById.get(consultaId)
      if (!operacional) return null

      return {
        id: String(row.id),
        consultaId,
        consultaRef: String(operacional.codigo_atendimento ?? consultaId),
        rating: resolveReviewRating(row),
        patientName: operacional.paciente_nome?.trim() || 'Paciente',
        patientPhotoUrl: operacional.paciente_foto_url?.trim() || '',
        comment: resolveReviewComment(row),
        createdAtIso: String(row.avaliado_em),
      } satisfies ProfissionalReviewRow
    })
    .filter((row): row is ProfissionalReviewRow => row != null)
    .sort(
      (left, right) =>
        new Date(right.createdAtIso).getTime() - new Date(left.createdAtIso).getTime(),
    )

  return applyClientFilters(reviews, query)
}
