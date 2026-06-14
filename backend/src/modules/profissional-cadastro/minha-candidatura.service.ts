import { normalizeCpf } from '../../lib/cpf.js'
import { supabaseAdmin } from '../../db/supabase.js'
import { ProfissionalCadastroError } from './errors.js'
import {
  buildDocumentUpload,
  createCandidaturaDocumentSignedUrl,
  inferDocumentPreviewType,
  replaceCandidaturaDocumento,
  tipoToFieldId,
} from './documentos.service.js'

type CandidaturaAccessRow = {
  id: string
  cpf: string
  nome_completo: string
  email: string
  telefone: string | null
  formacao: string
  conselho_sigla: string
  conselho_numero: string
  conselho_uf: string
  rqe: string | null
  status: string
  enviada_em: string | null
  criado_em: string
  especialidade_nome?: string
}

type DocumentoRow = {
  id: string
  tipo: string
  rotulo: string
  nome_arquivo: string
  mime_type: string | null
  storage_path: string
  status: 'pendente' | 'aprovado' | 'reprovado'
  motivo_reprovacao: string | null
  complemento_solicitado_em: string | null
  criado_em: string
}

type TimelineRow = {
  titulo: string
  detalhe: string | null
  autor_nome: string
  criado_em: string
}

type CorrectionContext = {
  correctionTime: string
  dataNote?: string
  documentNotes: Record<string, string>
  dataPending: boolean
}

const STATUS_LABEL: Record<string, string> = {
  pendente: 'Aguardando análise',
  em_analise: 'Em análise',
  correcao_solicitada: 'Correção necessária',
  aprovada: 'Aprovada',
  reprovada: 'Não aprovada',
}

export type MinhaCandidaturaDocumentoDto = {
  id: string
  label: string
  instruction?: string
  fieldId: string
  fileName: string
  previewType: 'image' | 'pdf'
  previewUrl?: string
}

export type MinhaCandidaturaEditableProfileDto = {
  email: string
  phone: string
  councilNumber: string
  councilUf: string
  councilLabel: string
  rqe?: string
}

export type MinhaCandidaturaDto = {
  id: string
  fullName: string
  status: string
  statusLabel: string
  hasPendingCorrections: boolean
  dataCorrectionNote?: string
  editableProfile?: MinhaCandidaturaEditableProfileDto
  documents: MinhaCandidaturaDocumentoDto[]
}

export type CorrigirDadosMinhaCandidaturaInput = {
  email?: string
  telefone?: string
  conselhoNumero?: string
  conselhoUf?: string
  rqe?: string
}

export type EnviarCorrecoesDocumentoInput = {
  documentoId: string
  buffer: Buffer
  mimeType: string
  fileName: string
}

async function loadCandidaturaByAccess(
  cpf: string,
  birthDateIso: string,
): Promise<CandidaturaAccessRow> {
  const normalizedCpf = normalizeCpf(cpf)

  const { data, error } = await supabaseAdmin
    .from('candidaturas_profissionais')
    .select(
      `
      id,
      cpf,
      nome_completo,
      email,
      telefone,
      formacao,
      conselho_sigla,
      conselho_numero,
      conselho_uf,
      rqe,
      status,
      enviada_em,
      criado_em,
      config_especialidades!candidaturas_profissionais_especialidade_id_fkey ( nome )
    `,
    )
    .eq('cpf', normalizedCpf)
    .eq('data_nascimento', birthDateIso)
    .order('criado_em', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new ProfissionalCadastroError(
      'Não encontramos candidatura com este CPF e data de nascimento.',
      'INVALID_DATA',
      404,
    )
  }

  const row = data as CandidaturaAccessRow & {
    config_especialidades: { nome: string } | { nome: string }[] | null
  }

  const join = row.config_especialidades
  const especialidadeNome = Array.isArray(join) ? join[0]?.nome : join?.nome

  return {
    ...row,
    especialidade_nome: especialidadeNome ? String(especialidadeNome) : '',
  }
}

function parseCorrectionMessage(message: string) {
  const documentNotes: Record<string, string> = {}
  let dataNote: string | undefined

  for (const part of message.split(/\n\n+/)) {
    const separatorIndex = part.indexOf(':\n')
    if (separatorIndex === -1) continue

    const title = part.slice(0, separatorIndex).trim()
    const note = part.slice(separatorIndex + 2).trim()
    if (!note) continue

    if (title === 'Dados pessoais') {
      dataNote = note
    } else {
      documentNotes[title] = note
    }
  }

  return { dataNote, documentNotes }
}

function wasDocumentReuploadedAfter(
  ctx: CorrectionContext,
  timeline: TimelineRow[],
  rotulo: string,
): boolean {
  return timeline.some(
    (item) =>
      (item.titulo === 'Documento reenviado' || item.titulo === 'Correções enviadas') &&
      item.criado_em > ctx.correctionTime &&
      (item.detalhe?.includes(rotulo) ?? false),
  )
}

function buildCorrectionContext(
  timeline: TimelineRow[],
  candidaturaStatus: string,
): CorrectionContext | null {
  if (candidaturaStatus === 'aprovada' || candidaturaStatus === 'reprovada') {
    return null
  }

  const correctionEvent = timeline.find((item) => item.titulo === 'Correção solicitada')
  if (!correctionEvent?.detalhe?.trim()) return null

  const correctionTime = correctionEvent.criado_em
  const { dataNote, documentNotes } = parseCorrectionMessage(correctionEvent.detalhe.trim())

  const batchSubmitted = timeline.some(
    (item) => item.titulo === 'Correções enviadas' && item.criado_em > correctionTime,
  )
  if (batchSubmitted) return null

  const dataCorrected = timeline.some(
    (item) => item.titulo === 'Dados corrigidos' && item.criado_em > correctionTime,
  )

  return {
    correctionTime,
    dataNote,
    documentNotes,
    dataPending: Boolean(dataNote) && !dataCorrected,
  }
}

function isDocumentPendingCorrection(
  doc: DocumentoRow,
  ctx: CorrectionContext,
  timeline: TimelineRow[],
): boolean {
  if (wasDocumentReuploadedAfter(ctx, timeline, doc.rotulo)) return false
  if (doc.status === 'reprovado') return true
  if (ctx.documentNotes[doc.rotulo]) return true
  if (doc.complemento_solicitado_em && doc.complemento_solicitado_em >= ctx.correctionTime) {
    return true
  }
  return false
}

function listPendingDocumentos(
  documentos: DocumentoRow[],
  ctx: CorrectionContext,
  timeline: TimelineRow[],
): DocumentoRow[] {
  return documentos.filter((doc) => isDocumentPendingCorrection(doc, ctx, timeline))
}

async function formatPendingDocumento(
  doc: DocumentoRow,
  ctx: CorrectionContext,
  _timeline: TimelineRow[],
): Promise<MinhaCandidaturaDocumentoDto> {
  const instruction =
    ctx.documentNotes[doc.rotulo] ?? doc.motivo_reprovacao?.trim() ?? undefined
  const previewUrl = await createCandidaturaDocumentSignedUrl(doc.storage_path)

  return {
    id: doc.id,
    label: doc.rotulo,
    fieldId: tipoToFieldId(doc.tipo),
    fileName: doc.nome_arquivo,
    previewType: inferDocumentPreviewType(doc.mime_type),
    ...(previewUrl ? { previewUrl } : {}),
    ...(instruction ? { instruction } : {}),
  }
}

function buildEditableProfile(candidatura: CandidaturaAccessRow): MinhaCandidaturaEditableProfileDto {
  return {
    email: String(candidatura.email),
    phone: candidatura.telefone ?? '',
    councilNumber: candidatura.conselho_numero,
    councilUf: candidatura.conselho_uf,
    councilLabel: candidatura.conselho_sigla,
    ...(candidatura.rqe ? { rqe: candidatura.rqe } : {}),
  }
}

async function loadCandidaturaContext(candidaturaId: string) {
  const [documentosResult, timelineResult] = await Promise.all([
    supabaseAdmin
      .from('candidatura_documentos')
      .select(
        'id, tipo, rotulo, nome_arquivo, mime_type, storage_path, status, motivo_reprovacao, complemento_solicitado_em, criado_em',
      )
      .eq('candidatura_id', candidaturaId)
      .order('criado_em', { ascending: true }),
    supabaseAdmin
      .from('candidatura_timeline')
      .select('titulo, detalhe, autor_nome, criado_em')
      .eq('candidatura_id', candidaturaId)
      .order('criado_em', { ascending: false })
      .limit(20),
  ])

  if (documentosResult.error) throw documentosResult.error
  if (timelineResult.error) throw timelineResult.error

  return {
    documentos: (documentosResult.data ?? []) as DocumentoRow[],
    timeline: (timelineResult.data ?? []) as TimelineRow[],
  }
}

export async function consultarMinhaCandidatura(
  cpf: string,
  birthDateIso: string,
): Promise<MinhaCandidaturaDto> {
  const candidatura = await loadCandidaturaByAccess(cpf, birthDateIso)
  const { documentos, timeline } = await loadCandidaturaContext(candidatura.id)
  const ctx = buildCorrectionContext(timeline, candidatura.status)

  const pendingDocumentos = ctx ? listPendingDocumentos(documentos, ctx, timeline) : []
  const documentsDto = await Promise.all(
    pendingDocumentos.map((doc) => formatPendingDocumento(doc, ctx!, timeline)),
  )

  const pendingDataCorrection = Boolean(ctx?.dataPending)
  const hasPendingCorrections = pendingDataCorrection || documentsDto.length > 0

  return {
    id: candidatura.id,
    fullName: candidatura.nome_completo,
    status: candidatura.status,
    statusLabel: STATUS_LABEL[candidatura.status] ?? candidatura.status,
    hasPendingCorrections,
    ...(pendingDataCorrection && ctx?.dataNote ? { dataCorrectionNote: ctx.dataNote } : {}),
    ...(pendingDataCorrection ? { editableProfile: buildEditableProfile(candidatura) } : {}),
    documents: documentsDto,
  }
}

function normalizeDadosPayload(payload: CorrigirDadosMinhaCandidaturaInput) {
  const updates: Record<string, string | null> = {}
  if (payload.email) updates.email = payload.email.trim()
  if (payload.telefone) updates.telefone = payload.telefone.trim()
  if (payload.conselhoNumero) updates.conselho_numero = payload.conselhoNumero.trim()
  if (payload.conselhoUf) updates.conselho_uf = payload.conselhoUf.trim().toUpperCase()
  if (payload.rqe !== undefined) updates.rqe = payload.rqe.trim() || null
  return updates
}

async function applyDadosCorrecao(
  candidatura: CandidaturaAccessRow,
  payload: CorrigirDadosMinhaCandidaturaInput,
): Promise<void> {
  const updates = normalizeDadosPayload(payload)
  if (Object.keys(updates).length === 0) {
    throw new ProfissionalCadastroError('Nenhum dado informado para correção.', 'INVALID_DATA', 400)
  }

  const { error: updateError } = await supabaseAdmin
    .from('candidaturas_profissionais')
    .update(updates)
    .eq('id', candidatura.id)

  if (updateError) throw updateError
}

export async function enviarCorrecoesMinhaCandidatura(
  cpf: string,
  birthDateIso: string,
  payload: {
    dados?: CorrigirDadosMinhaCandidaturaInput
    documentos: EnviarCorrecoesDocumentoInput[]
  },
): Promise<MinhaCandidaturaDto> {
  const candidatura = await loadCandidaturaByAccess(cpf, birthDateIso)
  const { documentos, timeline } = await loadCandidaturaContext(candidatura.id)
  const ctx = buildCorrectionContext(timeline, candidatura.status)

  if (!ctx) {
    throw new ProfissionalCadastroError(
      'Não há correções pendentes para enviar.',
      'INVALID_DATA',
      409,
    )
  }

  const pendingDocumentos = listPendingDocumentos(documentos, ctx, timeline)

  if (!ctx.dataPending && pendingDocumentos.length === 0) {
    throw new ProfissionalCadastroError(
      'Não há correções pendentes para enviar.',
      'INVALID_DATA',
      409,
    )
  }

  if (ctx.dataPending) {
    if (!payload.dados) {
      throw new ProfissionalCadastroError(
        'Corrija os dados solicitados antes de enviar.',
        'INVALID_DATA',
        400,
      )
    }
    await applyDadosCorrecao(candidatura, payload.dados)
  }

  const uploadsById = new Map(payload.documentos.map((item) => [item.documentoId, item]))

  for (const doc of pendingDocumentos) {
    const uploadInput = uploadsById.get(doc.id)
    if (!uploadInput) {
      throw new ProfissionalCadastroError(
        `Envie o documento corrigido: ${doc.rotulo}.`,
        'INVALID_DATA',
        400,
      )
    }

    const fieldId = tipoToFieldId(String(doc.tipo))
    const upload = buildDocumentUpload(
      fieldId,
      uploadInput.buffer,
      uploadInput.mimeType,
      uploadInput.fileName,
    )
    await replaceCandidaturaDocumento(candidatura.id, doc.id, upload)
  }

  const { error: statusError } = await supabaseAdmin
    .from('candidaturas_profissionais')
    .update({ status: 'em_analise' })
    .eq('id', candidatura.id)

  if (statusError) throw statusError

  const partes: string[] = []
  if (ctx.dataPending) partes.push('dados pessoais')
  if (pendingDocumentos.length > 0) {
    partes.push(pendingDocumentos.map((doc) => doc.rotulo).join(', '))
  }

  const { error: timelineError } = await supabaseAdmin.from('candidatura_timeline').insert({
    candidatura_id: candidatura.id,
    titulo: 'Correções enviadas',
    detalhe: `O candidato enviou correções de ${partes.join(' e ')}.`,
    autor_nome: candidatura.nome_completo,
  })

  if (timelineError) throw timelineError

  return consultarMinhaCandidatura(cpf, birthDateIso)
}

/** @deprecated Use enviarCorrecoesMinhaCandidatura para envio em lote. */
export async function corrigirDadosMinhaCandidatura(
  cpf: string,
  birthDateIso: string,
  payload: CorrigirDadosMinhaCandidaturaInput,
): Promise<MinhaCandidaturaDto> {
  return enviarCorrecoesMinhaCandidatura(cpf, birthDateIso, {
    dados: payload,
    documentos: [],
  })
}

/** @deprecated Use enviarCorrecoesMinhaCandidatura para envio em lote. */
export async function reenviarDocumentoMinhaCandidatura(
  cpf: string,
  birthDateIso: string,
  documentoId: string,
  buffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<MinhaCandidaturaDto> {
  return enviarCorrecoesMinhaCandidatura(cpf, birthDateIso, {
    documentos: [{ documentoId, buffer, mimeType, fileName }],
  })
}
