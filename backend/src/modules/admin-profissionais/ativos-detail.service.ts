import { supabaseAdmin } from '../../db/supabase.js'
import { isMissingSupabaseResource } from '../../lib/supabaseErrors.js'
import { mapOperacionalRowsToRecords } from '../profissional-atendimentos/clinical-data.service.js'
import { listConsultaIdsForProfissionalHistorico } from '../profissional-atendimentos/historico-query.service.js'
import type { ConsultaOperacionalFullRow } from '../profissional-atendimentos/types.js'
import { formatRelativeReviewLabel } from '../profissional-avaliacao/formatters.js'
import { loadProfissionalReviews } from '../profissional-avaliacao/query.service.js'
import type { AdminDoctorAttendanceDto, AdminDoctorReviewDto } from './formatters.js'

type AdminConsultaOperacionalRow = ConsultaOperacionalFullRow & {
  entidade_contratante_id?: string | null
}

const ADMIN_ATTENDANCE_LIMIT = 50
const ADMIN_REVIEW_LIMIT = 20
const CHUNK_SIZE = 150

const ADMIN_OPERACIONAL_SELECT = `
  id,
  codigo_atendimento,
  entidade_contratante_id,
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

export type AdminProfissionalDetailExtras = {
  attendances: AdminDoctorAttendanceDto[]
  reviews: AdminDoctorReviewDto[]
  totalConsultations: number
  completedConsultations: number
  completionRate: number
}

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

async function loadEntidadeCityById(ids: string[]): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(ids.filter(Boolean))]
  const result = new Map<string, string>()
  if (uniqueIds.length === 0) return result

  const { data, error } = await supabaseAdmin
    .from('entidades_contratantes')
    .select('id, municipio, uf')
    .in('id', uniqueIds)

  if (error) {
    if (isMissingSupabaseResource(error, 'entidades_contratantes')) return result
    throw error
  }

  for (const row of data ?? []) {
    const municipio = String(row.municipio ?? '').trim()
    const uf = String(row.uf ?? '').trim()
    if (municipio && uf) {
      result.set(String(row.id), `${municipio}/${uf}`)
    } else if (municipio) {
      result.set(String(row.id), municipio)
    }
  }

  return result
}

async function loadConsultationStatusById(
  consultaIds: string[],
): Promise<Map<string, string>> {
  const rows = await fetchInChunks(consultaIds, async (chunk) => {
    const { data, error } = await supabaseAdmin
      .from('consultas')
      .select('id, status')
      .in('id', chunk)

    if (error) {
      if (isMissingSupabaseResource(error, 'consultas')) return []
      throw error
    }

    return (data ?? []) as Array<{ id: string; status: string }>
  })

  return new Map(rows.map((row) => [String(row.id), String(row.status)]))
}

async function loadOperacionalRowsForAdmin(
  consultaIds: string[],
): Promise<AdminConsultaOperacionalRow[]> {
  const rows = await fetchInChunks(consultaIds, async (chunk) => {
    const { data, error } = await supabaseAdmin
      .from('vw_consultas_operacional')
      .select(ADMIN_OPERACIONAL_SELECT)
      .in('id', chunk)

    if (error) {
      if (isMissingSupabaseResource(error, 'vw_consultas_operacional')) return []
      throw error
    }

    return (data ?? []) as AdminConsultaOperacionalRow[]
  })

  return rows.sort((left, right) => {
    const leftTime = new Date(left.finalizada_em ?? left.iniciada_em ?? left.criado_em).getTime()
    const rightTime = new Date(right.finalizada_em ?? right.iniciada_em ?? right.criado_em).getTime()
    return rightTime - leftTime
  })
}

export async function loadAdminProfissionalDetailExtras(
  profissionalId: string,
): Promise<AdminProfissionalDetailExtras> {
  const consultaIds = await listConsultaIdsForProfissionalHistorico(profissionalId)

  if (consultaIds.length === 0) {
    return {
      attendances: [],
      reviews: [],
      totalConsultations: 0,
      completedConsultations: 0,
      completionRate: 0,
    }
  }

  const [statusById, operacionalRows, reviewRows] = await Promise.all([
    loadConsultationStatusById(consultaIds),
    loadOperacionalRowsForAdmin(consultaIds),
    loadProfissionalReviews(profissionalId, { criticos: false, limit: ADMIN_REVIEW_LIMIT, offset: 0 }),
  ])

  const totalConsultations = consultaIds.length
  const completedConsultations = consultaIds.filter(
    (id) => statusById.get(id) === 'concluida',
  ).length
  const completionRate =
    totalConsultations > 0
      ? Math.round((completedConsultations / totalConsultations) * 100)
      : 0

  const limitedRows = operacionalRows.slice(0, ADMIN_ATTENDANCE_LIMIT)
  const entidadeCityById = await loadEntidadeCityById(
    limitedRows.map((row) => String(row.entidade_contratante_id ?? '')),
  )
  const attendanceRecords = await mapOperacionalRowsToRecords(
    limitedRows as ConsultaOperacionalFullRow[],
  )

  const attendances: AdminDoctorAttendanceDto[] = attendanceRecords.map((record, index) => {
    const operacional = limitedRows[index]
    const entidadeId = operacional ? String(operacional.entidade_contratante_id ?? '') : ''
    const contractCity =
      entidadeCityById.get(entidadeId) ||
      operacional?.unidade_nome?.trim() ||
      '—'

    return {
      id: record.id,
      dateTimeLabel: record.dateTimeLabel,
      contractCity,
      patientName: record.patientName,
      durationMinutes: record.durationMinutes,
      documents: record.issuedDocuments.map((document) => ({
        id: document.id,
        label: document.title,
        fileName: document.fileName,
      })),
    }
  })

  const reviews: AdminDoctorReviewDto[] = reviewRows.slice(0, ADMIN_REVIEW_LIMIT).map((review) => ({
    id: review.id,
    rating: review.rating,
    author: review.patientName,
    comment: review.comment,
    createdAtLabel: formatRelativeReviewLabel(review.createdAtIso),
  }))

  return {
    attendances,
    reviews,
    totalConsultations,
    completedConsultations,
    completionRate,
  }
}
