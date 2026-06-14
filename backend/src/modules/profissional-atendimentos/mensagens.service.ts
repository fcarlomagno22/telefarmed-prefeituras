import { randomUUID } from 'node:crypto'
import { supabaseAdmin } from '../../db/supabase.js'
import { ANEXO_BUCKET, createAnexoSignedUrl } from './clinical-data.service.js'
import { ProfissionalAtendimentosError } from './errors.js'
import { sanitizeFileName } from './formatters.js'
import { listConsultaMensagensApi } from './mensagens-query.service.js'
import {
  assertConsultaEmAndamento,
  assertConsultaOwnedByProfissional,
  assertConsultaReadableByProfissional,
  loadConsultaById,
} from './ownership.js'
import type { ProfissionalMensagemApi } from './schemas.js'

const MAX_ANEXO_BYTES = 10 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
])

type MensagemAnexoFile = {
  buffer: Buffer
  mimeType: string
  fileName: string
}

export async function listProfissionalMensagens(
  profissionalId: string,
  consultaId: string,
): Promise<ProfissionalMensagemApi[]> {
  const consulta = await loadConsultaById(consultaId)
  await assertConsultaReadableByProfissional(profissionalId, consulta)
  return listConsultaMensagensApi(consultaId)
}

export async function enviarProfissionalMensagem(
  profissionalId: string,
  consultaId: string,
  conteudo: string,
): Promise<void> {
  const consulta = await loadConsultaById(consultaId)
  await assertConsultaOwnedByProfissional(profissionalId, consulta)
  await assertConsultaEmAndamento(consulta)

  await insertConsultaMensagem({
    consultaId,
    remetenteTipo: 'profissional',
    remetenteId: profissionalId,
    conteudo: conteudo.trim(),
  })
}

export async function uploadProfissionalMensagemAnexo(
  profissionalId: string,
  consultaId: string,
  file: MensagemAnexoFile,
  conteudo?: string,
): Promise<void> {
  const consulta = await loadConsultaById(consultaId)
  await assertConsultaOwnedByProfissional(profissionalId, consulta)
  await assertConsultaEmAndamento(consulta)

  await uploadConsultaMensagemAnexo({
    consultaId,
    remetenteTipo: 'profissional',
    remetenteId: profissionalId,
    file,
    conteudo,
  })
}

export async function uploadPublicMensagemAnexo(
  consultaId: string,
  pacienteId: string,
  file: MensagemAnexoFile,
  conteudo?: string,
): Promise<void> {
  await uploadConsultaMensagemAnexo({
    consultaId,
    remetenteTipo: 'paciente',
    remetenteId: pacienteId,
    file,
    conteudo,
  })
}

export async function enviarPublicMensagemPaciente(
  consultaId: string,
  pacienteId: string,
  conteudo: string,
): Promise<void> {
  await insertConsultaMensagem({
    consultaId,
    remetenteTipo: 'paciente',
    remetenteId: pacienteId,
    conteudo: conteudo.trim(),
  })
}

async function insertConsultaMensagem(input: {
  consultaId: string
  remetenteTipo: 'paciente' | 'profissional' | 'sistema'
  remetenteId?: string | null
  conteudo: string
  anexoNome?: string
  anexoStoragePath?: string
}): Promise<void> {
  const conteudo = input.conteudo.trim()
  const anexoStoragePath = input.anexoStoragePath?.trim() ?? ''
  const anexoNome = input.anexoNome?.trim() ?? ''

  if (!conteudo && !anexoStoragePath) {
    throw new ProfissionalAtendimentosError('Mensagem vazia.', 'INVALID_DATA', 400)
  }

  let anexoUrl = ''
  if (anexoStoragePath) {
    anexoUrl = (await createAnexoSignedUrl(anexoStoragePath)) || ''
  }

  const { error } = await supabaseAdmin.from('consulta_mensagens').insert({
    consulta_id: input.consultaId,
    remetente_tipo: input.remetenteTipo,
    remetente_id: input.remetenteId ?? null,
    conteudo,
    anexo_nome: anexoNome,
    anexo_url: anexoUrl,
    anexo_storage_path: anexoStoragePath,
  })

  if (error) throw error
}

async function uploadConsultaMensagemAnexo(input: {
  consultaId: string
  remetenteTipo: 'paciente' | 'profissional'
  remetenteId: string
  file: MensagemAnexoFile
  conteudo?: string
}): Promise<void> {
  validateMensagemAnexoFile(input.file)

  const safeName = sanitizeFileName(input.file.fileName || 'anexo')
  const storagePath = `${input.consultaId}/chat/${randomUUID()}-${safeName}`

  const { error: uploadError } = await supabaseAdmin.storage
    .from(ANEXO_BUCKET)
    .upload(storagePath, input.file.buffer, {
      contentType: input.file.mimeType,
      upsert: false,
    })

  if (uploadError) throw uploadError

  await insertConsultaMensagem({
    consultaId: input.consultaId,
    remetenteTipo: input.remetenteTipo,
    remetenteId: input.remetenteId,
    conteudo: input.conteudo?.trim() ?? '',
    anexoNome: safeName,
    anexoStoragePath: storagePath,
  })
}

function validateMensagemAnexoFile(file: MensagemAnexoFile): void {
  if (file.buffer.length === 0) {
    throw new ProfissionalAtendimentosError('Arquivo vazio.', 'INVALID_DATA', 400)
  }
  if (file.buffer.length > MAX_ANEXO_BYTES) {
    throw new ProfissionalAtendimentosError('Arquivo excede 10 MB.', 'INVALID_DATA', 400)
  }
  if (!ALLOWED_MIME_TYPES.has(file.mimeType)) {
    throw new ProfissionalAtendimentosError('Tipo de arquivo não permitido.', 'INVALID_DATA', 400)
  }
}

export async function assertMensagemOwnedByConsulta(
  consultaId: string,
  mensagemId: string,
): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('consulta_mensagens')
    .select('id')
    .eq('id', mensagemId)
    .eq('consulta_id', consultaId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new ProfissionalAtendimentosError('Mensagem não encontrada.', 'NOT_FOUND', 404)
  }
}

export { MAX_ANEXO_BYTES as MAX_MENSAGEM_ANEXO_BYTES, ALLOWED_MIME_TYPES as MENSAGEM_ANEXO_MIME_TYPES }
