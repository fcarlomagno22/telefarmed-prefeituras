import { randomUUID } from 'node:crypto'
import { supabaseAdmin } from '../../db/supabase.js'
import { ProfissionalPerfilError } from './errors.js'
import type { ProfissionalPerfilContext } from './types.js'

const CERT_BUCKET = 'profissionais-certificados'
const MAX_CERT_BYTES = 5 * 1024 * 1024

const CONSELHO_CERT_TITULO: Record<string, string> = {
  medicina: 'Certificado CFM em nuvem',
  psicologia: 'Certificado CFP em nuvem',
  nutricao: 'Certificado CFN em nuvem',
  fonoaudiologia: 'Certificado CFFa em nuvem',
}

function sanitizeFileName(name: string): string {
  return name.replace(/[/\\]/g, '').replace(/\.\./g, '').trim().slice(0, 120) || 'certificado.pfx'
}

export async function vincularCertificadoConselho(
  ctx: ProfissionalPerfilContext,
): Promise<{ certificadoDigital: Record<string, unknown> }> {
  const { data, error } = await supabaseAdmin
    .from('usuarios_profissionais')
    .select('id, nome, formacao')
    .eq('id', ctx.profissionalId)
    .eq('status', 'ativo')
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new ProfissionalPerfilError('Profissional não encontrado.', 'NOT_FOUND', 404)
  }

  const formacao = String(data.formacao ?? 'medicina')
  const titulo = CONSELHO_CERT_TITULO[formacao] ?? 'Certificado do conselho em nuvem'
  const expiresAt = new Date()
  expiresAt.setFullYear(expiresAt.getFullYear() + 2)
  const now = new Date().toISOString()

  const assinatura = {
    modo: 'conselho_nuvem',
    status: 'ativo',
    updatedAt: now,
    expiresAt: expiresAt.toISOString(),
    emissorDescricao: `${titulo} · ICP-Brasil · VALID`,
    arquivoNome: null,
    titularNome: String(data.nome),
  }

  const { error: updateError } = await supabaseAdmin
    .from('usuarios_profissionais')
    .update({ assinatura })
    .eq('id', ctx.profissionalId)

  if (updateError) throw updateError

  return { certificadoDigital: assinatura }
}

export async function uploadCertificadoA1(
  ctx: ProfissionalPerfilContext,
  input: { buffer: Buffer; fileName: string; password: string },
): Promise<{ certificadoDigital: Record<string, unknown> }> {
  if (!input.password.trim()) {
    throw new ProfissionalPerfilError('Informe a senha do certificado.', 'INVALID_DATA', 400)
  }

  if (input.buffer.length === 0 || input.buffer.length > MAX_CERT_BYTES) {
    throw new ProfissionalPerfilError(
      'Arquivo de certificado inválido ou acima de 5 MB.',
      'INVALID_DATA',
      400,
    )
  }

  const lowerName = input.fileName.toLowerCase()
  if (!lowerName.endsWith('.pfx') && !lowerName.endsWith('.p12')) {
    throw new ProfissionalPerfilError('Use arquivo .pfx ou .p12.', 'INVALID_DATA', 400)
  }

  const { data, error } = await supabaseAdmin
    .from('usuarios_profissionais')
    .select('id, nome, assinatura')
    .eq('id', ctx.profissionalId)
    .eq('status', 'ativo')
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new ProfissionalPerfilError('Profissional não encontrado.', 'NOT_FOUND', 404)
  }

  const safeName = sanitizeFileName(input.fileName)
  const storagePath = `${ctx.profissionalId}/${randomUUID()}-${safeName}`

  const { error: uploadError } = await supabaseAdmin.storage
    .from(CERT_BUCKET)
    .upload(storagePath, input.buffer, {
      contentType: 'application/x-pkcs12',
      upsert: false,
    })

  if (uploadError) throw uploadError

  const previous = (data.assinatura && typeof data.assinatura === 'object'
    ? data.assinatura
    : {}) as Record<string, unknown>
  const previousPath = typeof previous.storagePath === 'string' ? previous.storagePath : null

  const now = new Date().toISOString()
  const expiresAt = new Date()
  expiresAt.setFullYear(expiresAt.getFullYear() + 1)

  const assinatura = {
    modo: 'a1_arquivo',
    status: 'ativo',
    updatedAt: now,
    expiresAt: expiresAt.toISOString(),
    emissorDescricao: 'Certificado A1 · ICP-Brasil',
    arquivoNome: safeName,
    titularNome: String(data.nome),
    storagePath,
  }

  const { error: updateError } = await supabaseAdmin
    .from('usuarios_profissionais')
    .update({ assinatura })
    .eq('id', ctx.profissionalId)

  if (updateError) {
    await supabaseAdmin.storage.from(CERT_BUCKET).remove([storagePath])
    throw updateError
  }

  if (previousPath && previousPath !== storagePath) {
    await supabaseAdmin.storage.from(CERT_BUCKET).remove([previousPath])
  }

  return { certificadoDigital: assinatura }
}
