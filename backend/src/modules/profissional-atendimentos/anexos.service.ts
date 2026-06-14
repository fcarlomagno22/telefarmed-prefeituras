import { randomUUID } from 'node:crypto'
import { supabaseAdmin } from '../../db/supabase.js'
import { ProfissionalAtendimentosError } from './errors.js'
import { mapAnexoToDocument, parseIssuedDocumentId, sanitizeFileName } from './formatters.js'
import {
  ANEXO_BUCKET,
  createAnexoSignedUrl,
} from './clinical-data.service.js'
import {
  assertConsultaEmAndamento,
  assertConsultaOwnedByProfissional,
  loadConsultaById,
} from './ownership.js'

const MAX_ANEXO_BYTES = 10 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
])

export async function registrarProfissionalAnexoDocumento(
  profissionalId: string,
  consultaId: string,
  body: { tipo: string; titulo: string; arquivoNome?: string },
): Promise<{ documento: ReturnType<typeof mapAnexoToDocument> }> {
  const consulta = await loadConsultaById(consultaId)
  await assertConsultaOwnedByProfissional(profissionalId, consulta)
  await assertConsultaEmAndamento(consulta)

  const { data, error } = await supabaseAdmin
    .from('consulta_anexos')
    .insert({
      consulta_id: consultaId,
      tipo: body.tipo,
      titulo: body.titulo.trim(),
      arquivo_nome: body.arquivoNome?.trim() || `${body.titulo.trim()}.pdf`,
      origem: 'profissional',
    })
    .select('id, tipo, titulo, arquivo_nome, criado_em')
    .single()

  if (error) throw error

  const documento = mapAnexoToDocument({
    id: String(data.id),
    tipo: String(data.tipo),
    titulo: String(data.titulo),
    arquivo_nome: String(data.arquivo_nome),
    arquivo_url: '',
    storage_path: '',
    origem: 'profissional',
    criado_em: String(data.criado_em),
  })

  return { documento }
}

export async function uploadProfissionalAnexo(
  profissionalId: string,
  consultaId: string,
  file: { buffer: Buffer; mimeType: string; fileName: string },
  meta?: { titulo?: string; tipo?: string },
): Promise<{ id: string; name: string; url: string; mimeType: string }> {
  const consulta = await loadConsultaById(consultaId)
  await assertConsultaOwnedByProfissional(profissionalId, consulta)
  await assertConsultaEmAndamento(consulta)

  if (file.buffer.length === 0) {
    throw new ProfissionalAtendimentosError('Arquivo vazio.', 'INVALID_DATA', 400)
  }
  if (file.buffer.length > MAX_ANEXO_BYTES) {
    throw new ProfissionalAtendimentosError('Arquivo excede 10 MB.', 'INVALID_DATA', 400)
  }
  if (!ALLOWED_MIME_TYPES.has(file.mimeType)) {
    throw new ProfissionalAtendimentosError('Tipo de arquivo não permitido.', 'INVALID_DATA', 400)
  }

  const safeName = sanitizeFileName(file.fileName || 'anexo')
  const storagePath = `${consultaId}/${randomUUID()}-${safeName}`

  const { error: uploadError } = await supabaseAdmin.storage
    .from(ANEXO_BUCKET)
    .upload(storagePath, file.buffer, {
      contentType: file.mimeType,
      upsert: false,
    })

  if (uploadError) throw uploadError

  const signedUrl = await createAnexoSignedUrl(storagePath)
  const titulo = meta?.titulo?.trim() || safeName

  const { data, error } = await supabaseAdmin
    .from('consulta_anexos')
    .insert({
      consulta_id: consultaId,
      tipo: meta?.tipo?.trim() || 'outro',
      titulo,
      arquivo_nome: safeName,
      arquivo_url: signedUrl,
      storage_path: storagePath,
      origem: 'profissional',
    })
    .select('id')
    .single()

  if (error) throw error

  return {
    id: String(data.id),
    name: safeName,
    url: signedUrl,
    mimeType: file.mimeType,
  }
}

export async function removerProfissionalAnexo(
  profissionalId: string,
  consultaId: string,
  documentId: string,
): Promise<void> {
  const consulta = await loadConsultaById(consultaId)
  await assertConsultaOwnedByProfissional(profissionalId, consulta)
  await assertConsultaEmAndamento(consulta)

  const parsed = parseIssuedDocumentId(documentId)
  if (!parsed) {
    throw new ProfissionalAtendimentosError('Documento não encontrado.', 'NOT_FOUND', 404)
  }

  if (parsed.table === 'prescricao') {
    const { error } = await supabaseAdmin
      .from('consulta_prescricoes')
      .delete()
      .eq('id', parsed.id)
      .eq('consulta_id', consultaId)
    if (error) throw error
    return
  }

  if (parsed.table === 'solicitacao_exame') {
    const { error } = await supabaseAdmin
      .from('consulta_solicitacoes_exame')
      .delete()
      .eq('id', parsed.id)
      .eq('consulta_id', consultaId)
    if (error) throw error
    return
  }

  const { data: anexo, error: loadError } = await supabaseAdmin
    .from('consulta_anexos')
    .select('id, storage_path, metadata')
    .eq('id', parsed.id)
    .eq('consulta_id', consultaId)
    .maybeSingle()

  if (loadError) throw loadError
  if (!anexo) {
    throw new ProfissionalAtendimentosError('Documento não encontrado.', 'NOT_FOUND', 404)
  }

  const metadata = (anexo.metadata ?? {}) as Record<string, unknown>
  const atestadoId = typeof metadata.atestadoId === 'string' ? metadata.atestadoId : null
  const prescricaoIds = Array.isArray(metadata.prescricaoIds)
    ? metadata.prescricaoIds.filter((item): item is string => typeof item === 'string')
    : []
  const solicitacaoIds = Array.isArray(metadata.solicitacaoIds)
    ? metadata.solicitacaoIds.filter((item): item is string => typeof item === 'string')
    : []

  if (atestadoId) {
    await supabaseAdmin.from('consulta_atestados').delete().eq('id', atestadoId).eq('consulta_id', consultaId)
  }
  if (prescricaoIds.length > 0) {
    await supabaseAdmin.from('consulta_prescricoes').delete().in('id', prescricaoIds).eq('consulta_id', consultaId)
  }
  if (solicitacaoIds.length > 0) {
    await supabaseAdmin
      .from('consulta_solicitacoes_exame')
      .delete()
      .in('id', solicitacaoIds)
      .eq('consulta_id', consultaId)
  }

  if (anexo.storage_path?.trim()) {
    await supabaseAdmin.storage.from(ANEXO_BUCKET).remove([String(anexo.storage_path)])
  }

  const { error } = await supabaseAdmin
    .from('consulta_anexos')
    .delete()
    .eq('id', parsed.id)
    .eq('consulta_id', consultaId)

  if (error) throw error
}
