import { supabaseAdmin } from '../../db/supabase.js'
import {
  buildDocumentUpload,
  createCandidaturaDocumentSignedUrl,
  replaceCandidaturaDocumento,
} from '../profissional-cadastro/documentos.service.js'
import { ProfissionalPerfilError } from './errors.js'
import { mapDocumentRow } from './formatters.js'
import type { ProfissionalPerfilContext, ProfissionalPerfilDocumentDto } from './types.js'

async function loadOwnedCandidaturaId(profissionalId: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('candidaturas_profissionais')
    .select('id')
    .eq('profissional_id', profissionalId)
    .order('criado_em', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data?.id) {
    throw new ProfissionalPerfilError(
      'Nenhuma candidatura vinculada ao profissional.',
      'NOT_FOUND',
      404,
    )
  }
  return String(data.id)
}

export async function listProfissionalPerfilDocumentos(
  ctx: ProfissionalPerfilContext,
): Promise<ProfissionalPerfilDocumentDto[]> {
  const candidaturaId = await loadOwnedCandidaturaId(ctx.profissionalId)

  const { data, error } = await supabaseAdmin
    .from('candidatura_documentos')
    .select('id, tipo, rotulo, nome_arquivo, criado_em, status')
    .eq('candidatura_id', candidaturaId)
    .order('criado_em', { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapDocumentRow)
}

export async function getProfissionalDocumentoPreviewUrl(
  ctx: ProfissionalPerfilContext,
  documentoId: string,
): Promise<{ previewUrl: string; previewType: 'image' | 'pdf' }> {
  const candidaturaId = await loadOwnedCandidaturaId(ctx.profissionalId)

  const { data, error } = await supabaseAdmin
    .from('candidatura_documentos')
    .select('storage_path, mime_type')
    .eq('id', documentoId)
    .eq('candidatura_id', candidaturaId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new ProfissionalPerfilError('Documento não encontrado.', 'NOT_FOUND', 404)
  }

  const previewUrl = await createCandidaturaDocumentSignedUrl(String(data.storage_path))
  if (!previewUrl) {
    throw new ProfissionalPerfilError('Não foi possível gerar preview.', 'PREVIEW_FAILED', 500)
  }

  const mime = String(data.mime_type ?? '')
  return {
    previewUrl,
    previewType: mime.startsWith('image/') ? 'image' : 'pdf',
  }
}

export async function replaceProfissionalDocumento(
  ctx: ProfissionalPerfilContext,
  documentoId: string,
  file: { buffer: Buffer; mimeType: string; fileName: string },
): Promise<ProfissionalPerfilDocumentDto> {
  const candidaturaId = await loadOwnedCandidaturaId(ctx.profissionalId)

  const { data: existing, error: existingError } = await supabaseAdmin
    .from('candidatura_documentos')
    .select('id, tipo')
    .eq('id', documentoId)
    .eq('candidatura_id', candidaturaId)
    .maybeSingle()

  if (existingError) throw existingError
  if (!existing) {
    throw new ProfissionalPerfilError('Documento não encontrado.', 'NOT_FOUND', 404)
  }

  const fieldId =
    existing.tipo === 'crm'
      ? 'doc-conselho'
      : existing.tipo === 'identidade'
        ? 'doc-identidade'
        : existing.tipo === 'comprovante'
          ? 'doc-endereco'
          : 'doc-profissional'

  const upload = buildDocumentUpload(fieldId, file.buffer, file.mimeType, file.fileName)
  await replaceCandidaturaDocumento(candidaturaId, documentoId, upload)

  const { data, error } = await supabaseAdmin
    .from('candidatura_documentos')
    .select('id, tipo, rotulo, nome_arquivo, criado_em, status')
    .eq('id', documentoId)
    .single()

  if (error) throw error
  return mapDocumentRow(data)
}
