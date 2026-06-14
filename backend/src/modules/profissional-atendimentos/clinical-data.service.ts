import { supabaseAdmin } from '../../db/supabase.js'
import { createProfissionalFotoSignedUrl } from '../admin-profissionais/documentos.service.js'
import {
  mapAnexoToDocument,
  mapAnexoToPatientUpload,
  mapOperacionalToAttendanceRecord,
} from './formatters.js'
import type {
  ConsultaAnexoRow,
  ConsultaOperacionalFullRow,
  ConsultaPrescricaoRow,
  ConsultaSolicitacaoExameRow,
} from './types.js'
import type { ProfissionalIssuedDocumentApi } from './schemas.js'

const ANEXO_BUCKET = 'consultas-anexos'
const ANEXO_SIGNED_URL_TTL = 60 * 60
const SIGNED_URL_CACHE_TTL_MS = 50 * 60 * 1000

const signedUrlCache = new Map<string, { url: string; expiresAt: number }>()

const OPERACIONAL_SELECT = `
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

export async function loadConsultaClinicaData(consultaIds: string[]): Promise<{
  prescricoesByConsulta: Map<string, ConsultaPrescricaoRow[]>
  examesByConsulta: Map<string, ConsultaSolicitacaoExameRow[]>
  anexosByConsulta: Map<string, ConsultaAnexoRow[]>
  examNames: Map<string, string>
  signedUrlsByConsulta: Map<string, Map<string, string>>
}> {
  if (consultaIds.length === 0) {
    return {
      prescricoesByConsulta: new Map(),
      examesByConsulta: new Map(),
      anexosByConsulta: new Map(),
      examNames: new Map(),
      signedUrlsByConsulta: new Map(),
    }
  }

  const [prescricoesResult, examesResult, anexosResult] = await Promise.all([
    supabaseAdmin
      .from('consulta_prescricoes')
      .select('id, consulta_id, medicamento_nome, dosagem, via, frequencia, duracao, observacoes, criado_em')
      .in('consulta_id', consultaIds)
      .order('criado_em', { ascending: true }),
    supabaseAdmin
      .from('consulta_solicitacoes_exame')
      .select('id, consulta_id, exame_id, observacoes, criado_em')
      .in('consulta_id', consultaIds)
      .order('criado_em', { ascending: true }),
    supabaseAdmin
      .from('consulta_anexos')
      .select('id, consulta_id, tipo, titulo, arquivo_nome, arquivo_url, storage_path, origem, criado_em, codigo_verificacao, metadata')
      .in('consulta_id', consultaIds)
      .order('criado_em', { ascending: true }),
  ])

  if (prescricoesResult.error) throw prescricoesResult.error
  if (examesResult.error) throw examesResult.error
  if (anexosResult.error) throw anexosResult.error

  const examIds = [
    ...new Set(
      ((examesResult.data ?? []) as Array<{ exame_id: string }>).map((row) => String(row.exame_id)),
    ),
  ]

  const examNames = new Map<string, string>()
  if (examIds.length > 0) {
    const { data: examRows, error: examError } = await supabaseAdmin
      .from('config_exames')
      .select('id, nome')
      .in('id', examIds)

    if (examError) throw examError
    for (const row of examRows ?? []) {
      examNames.set(String(row.id), String(row.nome))
    }
  }

  const prescricoesByConsulta = groupByConsultaId(
    (prescricoesResult.data ?? []) as Array<ConsultaPrescricaoRow & { consulta_id: string }>,
  )
  const examesByConsulta = groupByConsultaId(
    (examesResult.data ?? []) as Array<ConsultaSolicitacaoExameRow & { consulta_id: string }>,
  )
  const anexosByConsulta = groupByConsultaId(
    (anexosResult.data ?? []) as Array<ConsultaAnexoRow & { consulta_id: string }>,
  )

  const signedUrlsByConsulta = new Map<string, Map<string, string>>()
  for (const consultaId of consultaIds) {
    const anexos = anexosByConsulta.get(consultaId) ?? []
    const profissionalAnexos = anexos.filter((row) => row.origem === 'profissional')
    signedUrlsByConsulta.set(consultaId, await resolveAnexoSignedUrls(profissionalAnexos))
  }

  return { prescricoesByConsulta, examesByConsulta, anexosByConsulta, examNames, signedUrlsByConsulta }
}

function groupByConsultaId<T extends { consulta_id: string }>(rows: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const row of rows) {
    const consultaId = String(row.consulta_id)
    const current = map.get(consultaId) ?? []
    current.push(row)
    map.set(consultaId, current)
  }
  return map
}

export async function createAnexoSignedUrl(storagePath: string): Promise<string> {
  if (!storagePath?.trim()) return ''

  const cached = signedUrlCache.get(storagePath)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url
  }

  const { data, error } = await supabaseAdmin.storage
    .from(ANEXO_BUCKET)
    .createSignedUrl(storagePath, ANEXO_SIGNED_URL_TTL)

  if (error || !data?.signedUrl) return ''

  signedUrlCache.set(storagePath, {
    url: data.signedUrl,
    expiresAt: Date.now() + SIGNED_URL_CACHE_TTL_MS,
  })

  return data.signedUrl
}

export async function resolveAnexoSignedUrls(
  anexos: ConsultaAnexoRow[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  await Promise.all(
    anexos.map(async (anexo) => {
      const path = anexo.storage_path?.trim()
      if (!path) return
      const url = await createAnexoSignedUrl(path)
      if (url) map.set(anexo.id, url)
    }),
  )
  return map
}

export function buildIssuedDocuments(
  data: {
    anexosProfissional: ConsultaAnexoRow[]
    signedUrls: Map<string, string>
  },
): ProfissionalIssuedDocumentApi[] {
  const docs: ProfissionalIssuedDocumentApi[] = []

  for (const row of data.anexosProfissional) {
    const signedUrl = data.signedUrls.get(row.id) ?? ''
    if (!row.storage_path?.trim() && !signedUrl?.trim()) continue
    docs.push(mapAnexoToDocument(row, signedUrl))
  }

  return docs
}

export async function buildPatientUploads(
  anexosPaciente: ConsultaAnexoRow[],
): Promise<ReturnType<typeof mapAnexoToPatientUpload>[]> {
  const signedUrls = await resolveAnexoSignedUrls(anexosPaciente)
  return anexosPaciente.map((row) =>
    mapAnexoToPatientUpload(row, signedUrls.get(row.id) ?? ''),
  )
}

export async function mapOperacionalRowsToRecords(
  rows: ConsultaOperacionalFullRow[],
): Promise<ReturnType<typeof mapOperacionalToAttendanceRecord>[]> {
  const consultaIds = rows.map((row) => String(row.id))
  const clinical = await loadConsultaClinicaData(consultaIds)

  const allPatientAnexos = consultaIds.flatMap((id) => {
    const anexos = clinical.anexosByConsulta.get(id) ?? []
    return anexos.filter((row) => row.origem === 'paciente')
  })
  const signedUrls = await resolveAnexoSignedUrls(allPatientAnexos)

  return rows.map((row) => {
    const consultaId = String(row.id)
    const anexos = clinical.anexosByConsulta.get(consultaId) ?? []
    const anexosProfissional = anexos.filter((item) => item.origem === 'profissional')
    const anexosPaciente = anexos.filter((item) => item.origem === 'paciente')

    const issuedDocuments = buildIssuedDocuments({
      anexosProfissional,
      signedUrls: clinical.signedUrlsByConsulta.get(consultaId) ?? new Map(),
    })

    const patientUploads = anexosPaciente.map((anexo) =>
      mapAnexoToPatientUpload(anexo, signedUrls.get(anexo.id) ?? ''),
    )

    return mapOperacionalToAttendanceRecord(row, issuedDocuments, patientUploads)
  })
}

export async function loadOperacionalRowById(
  consultaId: string,
): Promise<ConsultaOperacionalFullRow | null> {
  const { data, error } = await supabaseAdmin
    .from('vw_consultas_operacional')
    .select(OPERACIONAL_SELECT)
    .eq('id', consultaId)
    .maybeSingle()

  if (error) throw error
  return (data as ConsultaOperacionalFullRow | null) ?? null
}

type ConsultaOperacionalJoinRow = {
  id: string
  codigo_atendimento: string
  paciente_id: string
  profissional_id: string | null
  especialidade_id: string
  status: string
  triagem_resumo: string | null
  notas_clinicas: string | null
  iniciada_em: string | null
  finalizada_em: string | null
  duracao_minutos: number | null
  criado_em: string
  pacientes: {
    nome: string
    cpf: string | null
    sexo: string | null
    data_nascimento: string | null
    endereco: Record<string, unknown> | null
    foto_url: string | null
  } | null
  config_especialidades: { nome: string } | null
  unidades_ubt: { nome: string } | null
  usuarios_profissionais: {
    nome: string | null
    conselho_sigla: string | null
    conselho_numero: string | null
    conselho_uf: string | null
  } | null
}

function mapConsultaJoinToOperacionalRow(
  row: ConsultaOperacionalJoinRow,
): ConsultaOperacionalFullRow {
  const profissional = row.usuarios_profissionais
  const paciente = row.pacientes

  return {
    id: String(row.id),
    codigo_atendimento: String(row.codigo_atendimento),
    paciente_id: String(row.paciente_id),
    profissional_id: row.profissional_id ? String(row.profissional_id) : null,
    especialidade_id: String(row.especialidade_id),
    status: String(row.status),
    triagem_resumo: row.triagem_resumo?.trim() ?? '',
    notas_clinicas: row.notas_clinicas?.trim() ?? '',
    iniciada_em: row.iniciada_em,
    finalizada_em: row.finalizada_em,
    duracao_minutos: row.duracao_minutos,
    criado_em: String(row.criado_em),
    paciente_nome: String(paciente?.nome ?? '—'),
    paciente_cpf: String(paciente?.cpf ?? ''),
    paciente_sexo: String(paciente?.sexo ?? ''),
    paciente_data_nascimento: paciente?.data_nascimento ?? null,
    paciente_endereco: paciente?.endereco ?? null,
    paciente_foto_url: paciente?.foto_url ?? null,
    profissional_nome: profissional?.nome ?? null,
    profissional_conselho_sigla: profissional?.conselho_sigla ?? null,
    profissional_conselho_numero: profissional?.conselho_numero ?? null,
    profissional_conselho_uf: profissional?.conselho_uf ?? null,
    especialidade_nome: String(row.config_especialidades?.nome ?? 'Teleconsulta'),
    unidade_nome: String(row.unidades_ubt?.nome ?? 'Teleatendimento'),
  }
}

async function loadOperacionalRowFromConsultasJoin(
  codigoAtendimento: string,
): Promise<ConsultaOperacionalFullRow | null> {
  const { data, error } = await supabaseAdmin
    .from('consultas')
    .select(
      `
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
      pacientes!inner (
        nome,
        cpf,
        sexo,
        data_nascimento,
        endereco,
        foto_url
      ),
      config_especialidades!inner ( nome ),
      unidades_ubt!inner ( nome ),
      usuarios_profissionais (
        nome,
        conselho_sigla,
        conselho_numero,
        conselho_uf
      )
    `,
    )
    .eq('codigo_atendimento', codigoAtendimento.trim())
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const row = data as unknown as ConsultaOperacionalJoinRow
  const paciente = Array.isArray(row.pacientes) ? row.pacientes[0] : row.pacientes
  const especialidade = Array.isArray(row.config_especialidades)
    ? row.config_especialidades[0]
    : row.config_especialidades
  const unidade = Array.isArray(row.unidades_ubt) ? row.unidades_ubt[0] : row.unidades_ubt
  const profissional = Array.isArray(row.usuarios_profissionais)
    ? row.usuarios_profissionais[0]
    : row.usuarios_profissionais

  return mapConsultaJoinToOperacionalRow({
    ...row,
    pacientes: paciente ?? null,
    config_especialidades: especialidade ?? null,
    unidades_ubt: unidade ?? null,
    usuarios_profissionais: profissional ?? null,
  })
}

export async function loadOperacionalRowByCodigo(
  codigoAtendimento: string,
): Promise<ConsultaOperacionalFullRow | null> {
  const { data, error } = await supabaseAdmin
    .from('vw_consultas_operacional')
    .select(OPERACIONAL_SELECT)
    .eq('codigo_atendimento', codigoAtendimento.trim())
    .maybeSingle()

  if (error) throw error
  if (data) return data as ConsultaOperacionalFullRow

  return loadOperacionalRowFromConsultasJoin(codigoAtendimento)
}

export async function loadProfissionalPhotoUrl(profissionalId: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('usuarios_profissionais')
    .select('foto_storage_path')
    .eq('id', profissionalId)
    .maybeSingle()

  if (error) throw error
  return (await createProfissionalFotoSignedUrl(data?.foto_storage_path)) ?? ''
}

export { OPERACIONAL_SELECT, ANEXO_BUCKET, ANEXO_SIGNED_URL_TTL }
