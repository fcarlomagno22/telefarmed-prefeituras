import { randomInt } from 'node:crypto'
import { hashPassword } from '../../lib/password.js'
import { supabaseAdmin } from '../../db/supabase.js'
import { createCandidaturaDocumentSignedUrl } from './documentos.service.js'
import { loadCandidaturaEspecialidadesMap } from './especialidades.service.js'
import { ProfissionaisError } from './errors.js'
import {
  dbStatusFromUiFilter,
  escapeIlikeTerm,
  formatCandidaturaDetail,
  formatCandidaturaDocumento,
  formatCandidaturaListItem,
} from './formatters.js'
import type {
  ListCandidaturasQuery,
  ReprovarCandidaturaBody,
  ReviewDocumentoBody,
  SolicitarCorrecaoBody,
} from './schemas.js'
import type {
  CandidaturaDocumentoRow,
  CandidaturaEmpresaRow,
  CandidaturaListagemRow,
  CandidaturaTimelineRow,
} from './types.js'

const CODE_EXPIRY_DAYS = 10
const MAX_CODE_ATTEMPTS = 12

async function loadCandidaturaListagem(id: string): Promise<CandidaturaListagemRow> {
  const { data, error } = await supabaseAdmin
    .from('vw_admin_candidaturas_listagem')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new ProfissionaisError('Candidatura não encontrada.', 'NOT_FOUND', 404)
  }

  return data as CandidaturaListagemRow
}

async function loadCandidaturaDocumentos(candidaturaId: string): Promise<CandidaturaDocumentoRow[]> {
  const { data, error } = await supabaseAdmin
    .from('candidatura_documentos')
    .select('*')
    .eq('candidatura_id', candidaturaId)
    .order('criado_em', { ascending: true })

  if (error) throw error
  return (data ?? []) as CandidaturaDocumentoRow[]
}

async function loadCandidaturaEmpresa(candidaturaId: string): Promise<CandidaturaEmpresaRow | null> {
  const { data, error } = await supabaseAdmin
    .from('candidatura_empresa_pj')
    .select('status, cnpj, razao_social, municipio, uf')
    .eq('candidatura_id', candidaturaId)
    .maybeSingle()

  if (error) throw error
  return (data as CandidaturaEmpresaRow | null) ?? null
}

async function loadCandidaturaTimeline(candidaturaId: string): Promise<CandidaturaTimelineRow[]> {
  const { data, error } = await supabaseAdmin
    .from('candidatura_timeline')
    .select('id, candidatura_id, titulo, detalhe, autor_nome, criado_em')
    .eq('candidatura_id', candidaturaId)
    .order('criado_em', { ascending: false })

  if (error) throw error
  return (data ?? []) as CandidaturaTimelineRow[]
}

async function buildCandidaturaDetail(id: string) {
  const [row, documentos, empresa, timeline, especialidadesMap] = await Promise.all([
    loadCandidaturaListagem(id),
    loadCandidaturaDocumentos(id),
    loadCandidaturaEmpresa(id),
    loadCandidaturaTimeline(id),
    loadCandidaturaEspecialidadesMap([id]),
  ])

  const documentosDto = await Promise.all(
    documentos.map(async (doc) => {
      const fileUrl = await createCandidaturaDocumentSignedUrl(doc.storage_path)
      return formatCandidaturaDocumento(doc, fileUrl)
    }),
  )

  return formatCandidaturaDetail(
    row,
    documentosDto,
    empresa,
    timeline,
    especialidadesMap.get(id) ?? [],
  )
}

async function insertTimeline(
  candidaturaId: string,
  titulo: string,
  detalhe: string | null,
  adminId: string,
  adminNome: string,
): Promise<void> {
  const { error } = await supabaseAdmin.from('candidatura_timeline').insert({
    candidatura_id: candidaturaId,
    titulo,
    detalhe,
    autor_nome: adminNome,
    autor_admin_id: adminId,
  })

  if (error) throw error
}

async function generateUniqueAccessCode(): Promise<string> {
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
    const code = String(randomInt(100000, 1000000))

    const { data, error } = await supabaseAdmin
      .from('candidaturas_profissionais')
      .select('id')
      .eq('codigo_acesso', code)
      .is('finalizada_em', null)
      .maybeSingle()

    if (error) throw error
    if (!data) return code
  }

  throw new ProfissionaisError(
    'Não foi possível gerar o código de acesso. Tente novamente.',
    'CONFLICT',
    409,
  )
}

export async function listCandidaturas(params: ListCandidaturasQuery) {
  let query = supabaseAdmin.from('vw_admin_candidaturas_listagem').select('*')

  if (params.status && params.status !== 'all') {
    const dbStatus = dbStatusFromUiFilter(params.status)
    if (dbStatus) query = query.eq('status', dbStatus)
  } else {
    query = query.neq('status', 'aprovada')
  }

  if (params.search) {
    const term = escapeIlikeTerm(params.search.trim())
    query = query.or(
      `nome_completo.ilike.%${term}%,email.ilike.%${term}%,especialidade_nome.ilike.%${term}%`,
    )
  }

  query = query.order('enviada_em', { ascending: false, nullsFirst: false })

  const { data, error } = await query
  if (error) throw error

  const rows = (data ?? []) as CandidaturaListagemRow[]
  const especialidadesMap = await loadCandidaturaEspecialidadesMap(rows.map((row) => row.id))

  return rows.map((row) =>
    formatCandidaturaListItem(row, especialidadesMap.get(row.id) ?? []),
  )
}

export async function getCandidaturaDetail(id: string) {
  return buildCandidaturaDetail(id)
}

export async function reviewCandidaturaDocumento(
  candidaturaId: string,
  documentoId: string,
  adminId: string,
  payload: ReviewDocumentoBody,
) {
  const { data: documento, error: docError } = await supabaseAdmin
    .from('candidatura_documentos')
    .select('id, candidatura_id, status')
    .eq('id', documentoId)
    .eq('candidatura_id', candidaturaId)
    .maybeSingle()

  if (docError) throw docError
  if (!documento) {
    throw new ProfissionaisError('Documento não encontrado.', 'NOT_FOUND', 404)
  }

  if (payload.status === 'reprovado' && !payload.motivoReprovacao?.trim()) {
    throw new ProfissionaisError('Informe o motivo da reprovação.', 'INVALID_DATA', 400)
  }

  const { error: updateDocError } = await supabaseAdmin
    .from('candidatura_documentos')
    .update({
      status: payload.status,
      motivo_reprovacao: payload.status === 'reprovado' ? payload.motivoReprovacao?.trim() : null,
      revisado_por_admin_id: adminId,
      revisado_em: new Date().toISOString(),
    })
    .eq('id', documentoId)

  if (updateDocError) throw updateDocError

  if (payload.status === 'reprovado') {
    const { error: statusError } = await supabaseAdmin
      .from('candidaturas_profissionais')
      .update({ status: 'correcao_solicitada', analista_admin_id: adminId })
      .eq('id', candidaturaId)

    if (statusError) throw statusError
  } else {
    const { error: statusError } = await supabaseAdmin
      .from('candidaturas_profissionais')
      .update({ status: 'em_analise', analista_admin_id: adminId })
      .eq('id', candidaturaId)
      .in('status', ['pendente', 'correcao_solicitada'])

    if (statusError) throw statusError
  }

  return buildCandidaturaDetail(candidaturaId)
}

export async function aprovarCandidatura(
  candidaturaId: string,
  adminId: string,
  adminNome: string,
) {
  const candidatura = await loadCandidaturaListagem(candidaturaId)

  if (!['pendente', 'em_analise', 'correcao_solicitada'].includes(candidatura.status)) {
    throw new ProfissionaisError(
      'Esta candidatura não pode ser aprovada no status atual.',
      'INVALID_STATE',
      409,
    )
  }

  const accessCode = await generateUniqueAccessCode()
  const accessCodeHash = await hashPassword(accessCode)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + CODE_EXPIRY_DAYS)
  const now = new Date().toISOString()

  const { error: updateError } = await supabaseAdmin
    .from('candidaturas_profissionais')
    .update({
      status: 'aprovada',
      analista_admin_id: adminId,
      codigo_acesso: accessCode,
      codigo_acesso_hash: accessCodeHash,
      codigo_acesso_expira_em: expiresAt.toISOString(),
      codigo_acesso_enviado_em: now,
    })
    .eq('id', candidaturaId)

  if (updateError) throw updateError

  const { error: empresaError } = await supabaseAdmin
    .from('candidatura_empresa_pj')
    .update({ status: 'aguardando_finalizacao' })
    .eq('candidatura_id', candidaturaId)

  if (empresaError) throw empresaError

  await insertTimeline(
    candidaturaId,
    'Candidatura aprovada',
    'Código de acesso enviado para finalização do cadastro.',
    adminId,
    adminNome,
  )

  const detail = await buildCandidaturaDetail(candidaturaId)
  return { candidatura: detail, accessCode }
}

export async function reprovarCandidatura(
  candidaturaId: string,
  adminId: string,
  adminNome: string,
  payload: ReprovarCandidaturaBody,
) {
  const candidatura = await loadCandidaturaListagem(candidaturaId)

  if (candidatura.status === 'reprovada') {
    throw new ProfissionaisError(
      'Esta candidatura já foi reprovada.',
      'INVALID_STATE',
      409,
    )
  }

  if (candidatura.finalizada_em) {
    throw new ProfissionaisError(
      'Esta candidatura já foi concluída e não pode ser reprovada.',
      'INVALID_STATE',
      409,
    )
  }

  const { error } = await supabaseAdmin
    .from('candidaturas_profissionais')
    .update({
      status: 'reprovada',
      analista_admin_id: adminId,
      codigo_acesso: null,
      codigo_acesso_hash: null,
      codigo_acesso_expira_em: null,
    })
    .eq('id', candidaturaId)

  if (error) throw error

  await insertTimeline(
    candidaturaId,
    'Candidatura reprovada',
    payload.motivo,
    adminId,
    adminNome,
  )

  return buildCandidaturaDetail(candidaturaId)
}

export async function solicitarCorrecaoCandidatura(
  candidaturaId: string,
  adminId: string,
  adminNome: string,
  payload: SolicitarCorrecaoBody,
) {
  const candidatura = await loadCandidaturaListagem(candidaturaId)

  if (['aprovada', 'reprovada'].includes(candidatura.status)) {
    throw new ProfissionaisError(
      'Esta candidatura não pode receber solicitação de correção no status atual.',
      'INVALID_STATE',
      409,
    )
  }

  const now = new Date().toISOString()

  const { error: statusError } = await supabaseAdmin
    .from('candidaturas_profissionais')
    .update({ status: 'correcao_solicitada', analista_admin_id: adminId })
    .eq('id', candidaturaId)

  if (statusError) throw statusError

  if (payload.documentoIds.length > 0) {
    const { error: docsError } = await supabaseAdmin
      .from('candidatura_documentos')
      .update({ complemento_solicitado_em: now })
      .eq('candidatura_id', candidaturaId)
      .in('id', payload.documentoIds)

    if (docsError) throw docsError
  }

  await insertTimeline(
    candidaturaId,
    'Correção solicitada',
    payload.mensagem,
    adminId,
    adminNome,
  )

  return buildCandidaturaDetail(candidaturaId)
}
