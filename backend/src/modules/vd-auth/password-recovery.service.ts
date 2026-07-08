import { invalidateAuthSessionCache } from '../../lib/cache/authSessionCache.js'
import { randomInt } from 'node:crypto'
import { supabaseAdmin } from '../../db/supabase.js'
import { normalizeCpf } from '../../lib/cpf.js'
import {
  buildUbtPasswordRecoveryEmailHtml,
  buildUbtPasswordRecoveryEmailText,
  type PasswordRecoveryEmailBranding,
} from '../../lib/email/ubtPasswordRecoveryTemplate.js'
import {
  TELEFARMED_BRAND_NAME,
  TELEFARMED_DEFAULT_LOGO_URL,
  TELEFARMED_DEFAULT_PRIMARY_COLOR,
} from '../../lib/email/telefarmedBrand.js'
import { sendMail } from '../../lib/email/smtp.js'
import { getEntidadeBrandingById } from '../../lib/entidadeBranding/branding.service.js'
import { resolveVdUrlForEntidade } from '../../lib/tenant/transactionalUrls.js'
import {
  createOpaqueToken,
  hashOpaqueToken,
  hashPassword,
  verifyPassword,
} from '../../lib/password.js'
import { validatePortalPassword } from '../../lib/passwordPolicy.js'
import type { VdCadastroEntidadeScope } from '../vd-cadastro/types.js'

const CODE_LENGTH = 8
const CODE_TTL_MINUTES = 15
const PASSWORD_STEP_TTL_MINUTES = 15
const MAX_CODE_ATTEMPTS = 5
const MIN_VERIFY_MS = 250

let dummyCodeHashPromise: Promise<string> | null = null

function getDummyCodeHash(): Promise<string> {
  if (!dummyCodeHashPromise) {
    dummyCodeHashPromise = hashPassword('00000000')
  }
  return dummyCodeHashPromise
}

async function rejectInvalidRecoveryCode(): Promise<never> {
  throw new VdPasswordRecoveryError('Código inválido ou expirado.', 'INVALID_CODE')
}

export class VdPasswordRecoveryError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'INVALID_CPF'
      | 'CPF_NOT_FOUND'
      | 'EMAIL_NOT_CONFIGURED'
      | 'EMAIL_SEND_FAILED'
      | 'INVALID_RESET_TOKEN'
      | 'INVALID_CODE'
      | 'TOO_MANY_ATTEMPTS'
      | 'INVALID_VERIFICATION_TOKEN'
      | 'WEAK_PASSWORD'
      | 'USER_INACTIVE'
      | 'TENANT_REQUIRED',
    readonly statusCode = 400,
  ) {
    super(message)
    this.name = 'VdPasswordRecoveryError'
  }
}

type RecoveryRow = {
  id: string
  credencial_id: string
  hash_codigo: string
  expira_em: string
  verificado_em: string | null
  concluido_em: string | null
  tentativas_codigo: number
}

function maskEmailForResponse(email: string): string {
  const normalized = email.trim().toLowerCase()
  const [local, domain] = normalized.split('@')
  if (!local || !domain) return normalized
  if (local.length <= 2) return `${local[0] ?? '*'}***@${domain}`
  return `${local.slice(0, 2)}${'*'.repeat(Math.min(local.length - 2, 4))}@${domain}`
}

async function findVdCredencialByCpf(
  cpf: string,
  entidadeContratanteId: string,
): Promise<{
  id: string
  pacienteId: string
  email: string | null
  status: string
  pacienteStatus: string
  entidadeContratanteId: string
} | null> {
  const { data, error } = await supabaseAdmin
    .from('paciente_credenciais')
    .select('id, paciente_id, status, entidade_contratante_id')
    .eq('cpf', cpf)
    .eq('entidade_contratante_id', entidadeContratanteId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const { data: paciente, error: pacienteError } = await supabaseAdmin
    .from('pacientes')
    .select('email, status')
    .eq('id', data.paciente_id)
    .maybeSingle()

  if (pacienteError) throw pacienteError

  return {
    id: String(data.id),
    pacienteId: String(data.paciente_id),
    email: paciente?.email == null ? null : String(paciente.email).trim().toLowerCase(),
    status: String(data.status),
    pacienteStatus: paciente?.status ? String(paciente.status) : '',
    entidadeContratanteId: String(data.entidade_contratante_id),
  }
}

function recoveryExpiresAt(minutes: number): string {
  const date = new Date()
  date.setMinutes(date.getMinutes() + minutes)
  return date.toISOString()
}

function generateRecoveryCode(): string {
  return randomInt(0, 10 ** CODE_LENGTH).toString().padStart(CODE_LENGTH, '0')
}

function normalizeRecoveryCode(code: string): string {
  return code.replace(/\D/g, '')
}

async function ensureMinDuration(startedAt: number, minMs: number): Promise<void> {
  const elapsed = Date.now() - startedAt
  if (elapsed < minMs) {
    await new Promise((resolve) => setTimeout(resolve, minMs - elapsed))
  }
}

async function invalidatePendingRecoveries(credencialId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('vd_recuperacao_senha')
    .delete()
    .eq('credencial_id', credencialId)
    .is('concluido_em', null)

  if (error) throw error
}

async function purgeExpiredRecoveries(): Promise<void> {
  const { error } = await supabaseAdmin
    .from('vd_recuperacao_senha')
    .delete()
    .lt('expira_em', new Date().toISOString())
    .is('concluido_em', null)

  if (error) throw error
}

async function resolveVdRecoveryEmailBranding(
  entidadeId: string,
): Promise<PasswordRecoveryEmailBranding> {
  const branding = await getEntidadeBrandingById(entidadeId)

  return {
    logoUrl: branding?.logoUrl?.trim() || TELEFARMED_DEFAULT_LOGO_URL,
    brandName:
      branding?.nomeMarca?.trim() ||
      branding?.entidadeNomeExibicao?.trim() ||
      TELEFARMED_BRAND_NAME,
    accentColor: branding?.corPrimaria?.trim() || TELEFARMED_DEFAULT_PRIMARY_COLOR,
  }
}

async function sendRecoveryCodeEmail(
  to: string,
  code: string,
  portalUrl: string,
  branding: PasswordRecoveryEmailBranding,
): Promise<void> {
  await sendMail({
    to,
    subject: `Seu código de verificação — ${branding.brandName}`,
    html: buildUbtPasswordRecoveryEmailHtml(code, portalUrl, branding),
    text: buildUbtPasswordRecoveryEmailText(code, portalUrl, branding),
  })
}

export async function requestVdPasswordRecovery(
  cpfInput: string,
  scope: VdCadastroEntidadeScope,
): Promise<{
  resetToken: string
  sentTo: string
  expiresInMinutes: number
  sentAt: string
}> {
  let cpf: string
  try {
    cpf = normalizeCpf(cpfInput)
  } catch {
    throw new VdPasswordRecoveryError('Informe um CPF válido.', 'INVALID_CPF')
  }

  const credencial = await findVdCredencialByCpf(cpf, scope.entidadeId)
  if (!credencial) {
    throw new VdPasswordRecoveryError(
      'CPF não encontrado nesta cidade. Verifique o endereço do app ou cadastre-se.',
      'CPF_NOT_FOUND',
      404,
    )
  }

  if (credencial.status !== 'ativo' || credencial.pacienteStatus !== 'ativo') {
    throw new VdPasswordRecoveryError(
      'Esta conta está inativa. Entre em contato com a prefeitura.',
      'USER_INACTIVE',
      403,
    )
  }

  if (!credencial.email) {
    throw new VdPasswordRecoveryError(
      'Não há e-mail cadastrado para este CPF. Atualize seus dados na unidade de saúde.',
      'EMAIL_NOT_CONFIGURED',
      400,
    )
  }

  const sentAt = new Date().toISOString()
  const resetToken = createOpaqueToken()

  await purgeExpiredRecoveries()
  await invalidatePendingRecoveries(credencial.id)

  const code = generateRecoveryCode()
  const codeHash = await hashPassword(code)
  const resetTokenHash = hashOpaqueToken(resetToken)

  const { error } = await supabaseAdmin.from('vd_recuperacao_senha').insert({
    credencial_id: credencial.id,
    hash_token_reset: resetTokenHash,
    hash_codigo: codeHash,
    expira_em: recoveryExpiresAt(CODE_TTL_MINUTES),
  })

  if (error) throw error

  const portalUrl = await resolveVdUrlForEntidade(credencial.entidadeContratanteId, '/login')
  const emailBranding = await resolveVdRecoveryEmailBranding(credencial.entidadeContratanteId)

  try {
    await sendRecoveryCodeEmail(credencial.email, code, portalUrl, emailBranding)
  } catch (mailError) {
    await supabaseAdmin
      .from('vd_recuperacao_senha')
      .delete()
      .eq('hash_token_reset', resetTokenHash)
      .is('concluido_em', null)

    console.error('[vd-password-recovery] Falha ao enviar e-mail:', mailError)
    throw new VdPasswordRecoveryError(
      'Não foi possível enviar o código por e-mail. Tente novamente em instantes.',
      'EMAIL_SEND_FAILED',
      503,
    )
  }

  return {
    resetToken,
    sentTo: maskEmailForResponse(credencial.email),
    expiresInMinutes: CODE_TTL_MINUTES,
    sentAt,
  }
}

async function findOpenRecoveryByResetToken(resetToken: string): Promise<RecoveryRow | null> {
  const tokenHash = hashOpaqueToken(resetToken)
  const { data, error } = await supabaseAdmin
    .from('vd_recuperacao_senha')
    .select(
      'id, credencial_id, hash_codigo, expira_em, verificado_em, concluido_em, tentativas_codigo',
    )
    .eq('hash_token_reset', tokenHash)
    .is('concluido_em', null)
    .is('verificado_em', null)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    id: String(data.id),
    credencial_id: String(data.credencial_id),
    hash_codigo: String(data.hash_codigo),
    expira_em: String(data.expira_em),
    verificado_em: data.verificado_em ? String(data.verificado_em) : null,
    concluido_em: data.concluido_em ? String(data.concluido_em) : null,
    tentativas_codigo: Number(data.tentativas_codigo ?? 0),
  }
}

export async function verifyVdPasswordRecoveryCode(input: {
  resetToken: string
  code: string
}): Promise<{ verificationToken: string }> {
  const startedAt = Date.now()

  try {
    const normalizedCode = normalizeRecoveryCode(input.code)
    if (normalizedCode.length !== CODE_LENGTH) {
      throw new VdPasswordRecoveryError('Código inválido ou expirado.', 'INVALID_CODE')
    }

    const recovery = await findOpenRecoveryByResetToken(input.resetToken)
    if (!recovery) {
      await verifyPassword(normalizedCode, await getDummyCodeHash())
      return rejectInvalidRecoveryCode()
    }

    if (new Date(recovery.expira_em).getTime() <= Date.now()) {
      await supabaseAdmin.from('vd_recuperacao_senha').delete().eq('id', recovery.id)
      await verifyPassword(normalizedCode, recovery.hash_codigo)
      return rejectInvalidRecoveryCode()
    }

    if (recovery.tentativas_codigo >= MAX_CODE_ATTEMPTS) {
      await supabaseAdmin.from('vd_recuperacao_senha').delete().eq('id', recovery.id)
      throw new VdPasswordRecoveryError(
        'Número máximo de tentativas excedido. Solicite um novo código.',
        'TOO_MANY_ATTEMPTS',
      )
    }

    const codeOk = await verifyPassword(normalizedCode, recovery.hash_codigo)
    if (!codeOk) {
      const nextAttempts = recovery.tentativas_codigo + 1
      if (nextAttempts >= MAX_CODE_ATTEMPTS) {
        await supabaseAdmin.from('vd_recuperacao_senha').delete().eq('id', recovery.id)
        throw new VdPasswordRecoveryError(
          'Número máximo de tentativas excedido. Solicite um novo código.',
          'TOO_MANY_ATTEMPTS',
        )
      }

      await supabaseAdmin
        .from('vd_recuperacao_senha')
        .update({ tentativas_codigo: nextAttempts })
        .eq('id', recovery.id)

      throw new VdPasswordRecoveryError('Código inválido ou expirado.', 'INVALID_CODE')
    }

    const verificationToken = createOpaqueToken()
    const verificationTokenHash = hashOpaqueToken(verificationToken)
    const now = new Date().toISOString()

    const { error } = await supabaseAdmin
      .from('vd_recuperacao_senha')
      .update({
        verificado_em: now,
        hash_token_verificacao: verificationTokenHash,
        expira_em: recoveryExpiresAt(PASSWORD_STEP_TTL_MINUTES),
        tentativas_codigo: recovery.tentativas_codigo,
      })
      .eq('id', recovery.id)
      .is('verificado_em', null)

    if (error) throw error

    return { verificationToken }
  } finally {
    await ensureMinDuration(startedAt, MIN_VERIFY_MS)
  }
}

async function findVerifiedRecoveryByToken(
  verificationToken: string,
): Promise<RecoveryRow | null> {
  const tokenHash = hashOpaqueToken(verificationToken)
  const { data, error } = await supabaseAdmin
    .from('vd_recuperacao_senha')
    .select(
      'id, credencial_id, hash_codigo, expira_em, verificado_em, concluido_em, tentativas_codigo',
    )
    .eq('hash_token_verificacao', tokenHash)
    .not('verificado_em', 'is', null)
    .is('concluido_em', null)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    id: String(data.id),
    credencial_id: String(data.credencial_id),
    hash_codigo: String(data.hash_codigo),
    expira_em: String(data.expira_em),
    verificado_em: data.verificado_em ? String(data.verificado_em) : null,
    concluido_em: data.concluido_em ? String(data.concluido_em) : null,
    tentativas_codigo: Number(data.tentativas_codigo ?? 0),
  }
}

export async function completeVdPasswordRecovery(input: {
  verificationToken: string
  password: string
}): Promise<void> {
  const passwordError = validatePortalPassword(input.password)
  if (passwordError) {
    throw new VdPasswordRecoveryError(
      'A nova senha não atende aos requisitos de segurança.',
      'WEAK_PASSWORD',
    )
  }

  const recovery = await findVerifiedRecoveryByToken(input.verificationToken)
  if (!recovery) {
    throw new VdPasswordRecoveryError(
      'Não foi possível concluir a redefinição. Tente novamente.',
      'INVALID_VERIFICATION_TOKEN',
    )
  }

  if (new Date(recovery.expira_em).getTime() <= Date.now()) {
    await supabaseAdmin.from('vd_recuperacao_senha').delete().eq('id', recovery.id)
    throw new VdPasswordRecoveryError(
      'Não foi possível concluir a redefinição. Tente novamente.',
      'INVALID_VERIFICATION_TOKEN',
    )
  }

  const { data: credencialRow, error: credencialError } = await supabaseAdmin
    .from('paciente_credenciais')
    .select('id, status, paciente_id')
    .eq('id', recovery.credencial_id)
    .maybeSingle()

  if (credencialError) throw credencialError

  const { data: pacienteRow, error: pacienteError } = credencialRow
    ? await supabaseAdmin
        .from('pacientes')
        .select('status')
        .eq('id', credencialRow.paciente_id)
        .maybeSingle()
    : { data: null, error: null }

  if (pacienteError) throw pacienteError

  if (
    !credencialRow ||
    credencialRow.status !== 'ativo' ||
    pacienteRow?.status !== 'ativo'
  ) {
    throw new VdPasswordRecoveryError(
      'Não foi possível concluir a redefinição. Tente novamente.',
      'INVALID_VERIFICATION_TOKEN',
    )
  }

  const passwordHash = await hashPassword(input.password)
  const now = new Date().toISOString()

  const { error: credencialUpdateError } = await supabaseAdmin
    .from('paciente_credenciais')
    .update({
      senha_hash: passwordHash,
      senha_alterada_em: now,
      tentativas_login_falhas: 0,
      bloqueado_ate: null,
      atualizado_em: now,
    })
    .eq('id', recovery.credencial_id)

  if (credencialUpdateError) throw credencialUpdateError

  const { error: recoveryUpdateError } = await supabaseAdmin
    .from('vd_recuperacao_senha')
    .update({ concluido_em: now })
    .eq('id', recovery.id)
    .is('concluido_em', null)

  if (recoveryUpdateError) throw recoveryUpdateError

  const { error: revokeSessionsError } = await supabaseAdmin
    .from('sessoes_refresh_paciente')
    .update({ revogado_em: now })
    .eq('credencial_id', recovery.credencial_id)
    .is('revogado_em', null)

  if (revokeSessionsError) throw revokeSessionsError

  invalidateAuthSessionCache('vd', String(recovery.credencial_id))
}

export function mapVdPasswordRecoveryError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string }
} {
  if (error instanceof VdPasswordRecoveryError) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message, code: error.code },
    }
  }

  return {
    statusCode: 500,
    body: { error: 'Não foi possível processar a recuperação de senha.' },
  }
}
