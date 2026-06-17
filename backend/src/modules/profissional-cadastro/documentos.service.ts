import { randomUUID } from 'node:crypto'
import { supabaseAdmin } from '../../db/supabase.js'
import { ProfissionalCadastroError } from './errors.js'
import type { CandidaturaDocumentoUpload, TipoDocumentoCandidatura } from './types.js'

const DOCUMENTS_BUCKET = 'candidaturas-documentos'
const SIGNED_URL_TTL_SECONDS = 60 * 60
const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
])

const DOCUMENT_FIELD_MAP: Record<
  string,
  { tipo: TipoDocumentoCandidatura; rotulo: string }
> = {
  'doc-conselho': { tipo: 'crm', rotulo: 'Registro no conselho de classe' },
  'doc-identidade': { tipo: 'identidade', rotulo: 'Documento de identidade' },
  'doc-profissional': { tipo: 'outro', rotulo: 'Comprovante profissional' },
  'doc-endereco': { tipo: 'comprovante', rotulo: 'Comprovante de endereço' },
}

const REQUIRED_DOCUMENT_FIELDS = Object.keys(DOCUMENT_FIELD_MAP)

function extensionForMime(mime: string): 'pdf' | 'jpg' | 'png' | 'webp' {
  if (mime === 'application/pdf') return 'pdf'
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  return 'jpg'
}

function sanitizeFileName(name: string): string {
  const base = name.replace(/[/\\]/g, '').replace(/\.\./g, '').trim()
  return base.slice(0, 120) || 'documento'
}

function detectMimeFromBuffer(buffer: Buffer, declaredMime: string): string | null {
  if (buffer.length < 4) return null

  if (buffer.subarray(0, 4).toString('ascii') === '%PDF') {
    return 'application/pdf'
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg'
  }

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png'
  }

  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp'
  }

  return ALLOWED_MIME_TYPES.has(declaredMime) ? declaredMime : null
}

const TIPO_TO_FIELD_ID: Record<TipoDocumentoCandidatura, string> = {
  crm: 'doc-conselho',
  identidade: 'doc-identidade',
  comprovante: 'doc-endereco',
  outro: 'doc-profissional',
}

export function tipoToFieldId(tipo: string): string {
  if (tipo in TIPO_TO_FIELD_ID) {
    return TIPO_TO_FIELD_ID[tipo as TipoDocumentoCandidatura]
  }
  return 'doc-profissional'
}

export function getRequiredDocumentFieldIds(): string[] {
  return [...REQUIRED_DOCUMENT_FIELDS]
}

export async function createCandidaturaDocumentSignedUrl(
  storagePath: string,
): Promise<string | undefined> {
  const { data, error } = await supabaseAdmin.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS)

  if (error || !data?.signedUrl) return undefined
  return data.signedUrl
}

export function inferDocumentPreviewType(mimeType: string | null | undefined): 'image' | 'pdf' {
  if (mimeType?.startsWith('image/')) return 'image'
  return 'pdf'
}

export function buildDocumentUpload(
  fieldId: string,
  buffer: Buffer,
  declaredMime: string,
  originalName: string,
): CandidaturaDocumentoUpload {
  const mapping = DOCUMENT_FIELD_MAP[fieldId]
  if (!mapping) {
    throw new ProfissionalCadastroError('Documento inválido.', 'DOCUMENT_INVALID', 400)
  }

  if (buffer.length === 0) {
    throw new ProfissionalCadastroError('Arquivo vazio.', 'DOCUMENT_INVALID', 400)
  }

  if (buffer.length > MAX_DOCUMENT_BYTES) {
    throw new ProfissionalCadastroError(
      'Arquivo excede o limite de 8 MB.',
      'DOCUMENT_INVALID',
      400,
    )
  }

  const mimeType = detectMimeFromBuffer(buffer, declaredMime)
  if (!mimeType || !ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new ProfissionalCadastroError(
      'Formato de arquivo não permitido. Use PDF, JPG ou PNG.',
      'DOCUMENT_INVALID',
      400,
    )
  }

  return {
    fieldId,
    tipo: mapping.tipo,
    rotulo: mapping.rotulo,
    buffer,
    mimeType,
    nomeArquivo: sanitizeFileName(originalName),
    tamanhoBytes: buffer.length,
  }
}

export async function registerCandidaturaDocumentoFromPending(
  candidaturaId: string,
  documento: CandidaturaDocumentoUpload,
  pendingStoragePath: string,
): Promise<string> {
  const extension = extensionForMime(documento.mimeType)
  const storagePath = `${candidaturaId}/${documento.tipo}/${randomUUID()}.${extension}`

  const { error: moveError } = await supabaseAdmin.storage
    .from(DOCUMENTS_BUCKET)
    .move(pendingStoragePath, storagePath)

  if (moveError) throw moveError

  const { error: insertError } = await supabaseAdmin.from('candidatura_documentos').insert({
    candidatura_id: candidaturaId,
    tipo: documento.tipo,
    rotulo: documento.rotulo,
    nome_arquivo: documento.nomeArquivo,
    mime_type: documento.mimeType,
    tamanho_bytes: documento.tamanhoBytes,
    storage_path: storagePath,
    status: 'pendente',
  })

  if (insertError) {
    await supabaseAdmin.storage.from(DOCUMENTS_BUCKET).remove([storagePath])
    throw insertError
  }

  return storagePath
}

export type PendingDocumentUploadRequest = {
  fieldId: string
  fileName: string
  mimeType: string
}

export type PendingDocumentReference = {
  fieldId: string
  storagePath: string
  fileName: string
  mimeType: string
}

function normalizeStoragePath(path: string): string {
  return path.trim().replace(/^\/+/, '')
}

function pendingCandidaturaDocumentPrefix(submissionId: string, fieldId: string): string {
  return `pending-candidatura/${submissionId}/${fieldId}/`
}

export async function createPendingCandidaturaDocumentUploadUrls(
  submissionId: string,
  documents: PendingDocumentUploadRequest[],
): Promise<Array<{ fieldId: string; signedUrl: string; storagePath: string; token: string }>> {
  if (!/^[0-9a-f-]{36}$/i.test(submissionId)) {
    throw new ProfissionalCadastroError('Identificador de envio inválido.', 'INVALID_DATA', 400)
  }

  const uploads: Array<{ fieldId: string; signedUrl: string; storagePath: string; token: string }> =
    []

  for (const document of documents) {
    if (!DOCUMENT_FIELD_MAP[document.fieldId]) {
      throw new ProfissionalCadastroError('Documento inválido.', 'DOCUMENT_INVALID', 400)
    }

    const mimeType = document.mimeType.toLowerCase().split(';')[0]?.trim() ?? ''
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new ProfissionalCadastroError(
        'Formato de arquivo não permitido. Use PDF, JPG ou PNG.',
        'DOCUMENT_INVALID',
        400,
      )
    }

    const extension = extensionForMime(mimeType)
    const storagePath = `${pendingCandidaturaDocumentPrefix(submissionId, document.fieldId)}${randomUUID()}.${extension}`

    const { data, error } = await supabaseAdmin.storage
      .from(DOCUMENTS_BUCKET)
      .createSignedUploadUrl(storagePath, { upsert: true })

    if (error || !data?.signedUrl) {
      throw new ProfissionalCadastroError(
        'Não foi possível preparar o envio dos documentos.',
        'INVALID_DATA',
        500,
      )
    }

    uploads.push({
      fieldId: document.fieldId,
      signedUrl: data.signedUrl,
      storagePath,
      token: data.token,
    })
  }

  return uploads
}

export async function buildDocumentUploadFromPending(
  submissionId: string,
  reference: PendingDocumentReference,
): Promise<{ documento: CandidaturaDocumentoUpload; pendingStoragePath: string }> {
  const storagePath = normalizeStoragePath(reference.storagePath)
  const prefix = pendingCandidaturaDocumentPrefix(submissionId, reference.fieldId)
  if (!storagePath.startsWith(prefix) || storagePath.includes('..')) {
    throw new ProfissionalCadastroError('Documento inválido.', 'DOCUMENT_INVALID', 400)
  }

  const { data, error } = await supabaseAdmin.storage
    .from(DOCUMENTS_BUCKET)
    .download(storagePath)

  if (error || !data) {
    throw new ProfissionalCadastroError(
      'Documento não encontrado no storage. Envie os arquivos novamente.',
      'DOCUMENT_REQUIRED',
      400,
    )
  }

  const buffer = Buffer.from(await data.arrayBuffer())
  const documento = buildDocumentUpload(
    reference.fieldId,
    buffer,
    reference.mimeType || data.type,
    reference.fileName,
  )

  return { documento, pendingStoragePath: storagePath }
}

export async function uploadCandidaturaDocumento(
  candidaturaId: string,
  documento: CandidaturaDocumentoUpload,
): Promise<string> {
  const extension = extensionForMime(documento.mimeType)
  const storagePath = `${candidaturaId}/${documento.tipo}/${randomUUID()}.${extension}`

  const { error: uploadError } = await supabaseAdmin.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, documento.buffer, {
      contentType: documento.mimeType,
      upsert: false,
    })

  if (uploadError) throw uploadError

  const { error: insertError } = await supabaseAdmin.from('candidatura_documentos').insert({
    candidatura_id: candidaturaId,
    tipo: documento.tipo,
    rotulo: documento.rotulo,
    nome_arquivo: documento.nomeArquivo,
    mime_type: documento.mimeType,
    tamanho_bytes: documento.tamanhoBytes,
    storage_path: storagePath,
    status: 'pendente',
  })

  if (insertError) {
    await supabaseAdmin.storage.from(DOCUMENTS_BUCKET).remove([storagePath])
    throw insertError
  }

  return storagePath
}

export async function removeCandidaturaStoragePaths(paths: string[]): Promise<void> {
  if (paths.length === 0) return
  await supabaseAdmin.storage.from(DOCUMENTS_BUCKET).remove(paths)
}

export async function replaceCandidaturaDocumento(
  candidaturaId: string,
  documentoId: string,
  documento: CandidaturaDocumentoUpload,
): Promise<void> {
  const { data: existing, error: existingError } = await supabaseAdmin
    .from('candidatura_documentos')
    .select('id, storage_path, tipo')
    .eq('id', documentoId)
    .eq('candidatura_id', candidaturaId)
    .maybeSingle()

  if (existingError) throw existingError
  if (!existing) {
    throw new ProfissionalCadastroError('Documento não encontrado.', 'INVALID_DATA', 404)
  }

  const extension = extensionForMime(documento.mimeType)
  const storagePath = `${candidaturaId}/${existing.tipo}/${randomUUID()}.${extension}`

  const { error: uploadError } = await supabaseAdmin.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, documento.buffer, {
      contentType: documento.mimeType,
      upsert: false,
    })

  if (uploadError) throw uploadError

  const { error: updateError } = await supabaseAdmin
    .from('candidatura_documentos')
    .update({
      nome_arquivo: documento.nomeArquivo,
      mime_type: documento.mimeType,
      tamanho_bytes: documento.tamanhoBytes,
      storage_path: storagePath,
      status: 'pendente',
      motivo_reprovacao: null,
      complemento_solicitado_em: null,
      revisado_por_admin_id: null,
      revisado_em: null,
    })
    .eq('id', documentoId)

  if (updateError) {
    await supabaseAdmin.storage.from(DOCUMENTS_BUCKET).remove([storagePath])
    throw updateError
  }

  const oldPath = String(existing.storage_path)
  if (oldPath !== storagePath) {
    await removeCandidaturaStoragePaths([oldPath])
  }
}

export async function deleteCandidaturaCascade(candidaturaId: string): Promise<void> {
  const { data: docs, error: docsError } = await supabaseAdmin
    .from('candidatura_documentos')
    .select('storage_path')
    .eq('candidatura_id', candidaturaId)

  if (docsError) throw docsError

  const paths = (docs ?? []).map((row) => String(row.storage_path))
  await removeCandidaturaStoragePaths(paths)

  const { error } = await supabaseAdmin
    .from('candidaturas_profissionais')
    .delete()
    .eq('id', candidaturaId)

  if (error) throw error
}
