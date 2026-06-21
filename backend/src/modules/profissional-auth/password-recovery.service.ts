import { invalidateAuthSessionCache } from '../../lib/cache/authSessionCache.js'
import { randomInt } from 'node:crypto'
import { supabaseAdmin } from '../../db/supabase.js'
import { normalizeCpf } from '../../lib/cpf.js'
import {
  buildUbtPasswordRecoveryEmailHtml,
  buildUbtPasswordRecoveryEmailText,
} from '../../lib/email/ubtPasswordRecoveryTemplate.js'
import { sendMail } from '../../lib/email/smtp.js'
import {
  createOpaqueToken,
  hashOpaqueToken,
  hashPassword,
  verifyPassword,
} from '../../lib/password.js'
import { validatePortalPassword } from '../../lib/passwordPolicy.js'

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
  throw new ProfissionalPasswordRecoveryError('Código inválido ou expirado.', 'INVALID_CODE')
}

export class ProfissionalPasswordRecoveryError extends Error {
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
      | 'USER_INACTIVE',
    readonly statusCode = 400,
  ) {
    super(message)
    this.name = 'ProfissionalPasswordRecoveryError'
  }
}

type RecoveryRow = {
  id: string
  usuario_profissional_id: string
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

async function findProfissionalUserByCpf(cpf: string): Promise<{
  id: string
  email: string | null
  status: string
} | null> {
  const { data, error } = await supabaseAdmin
    .from('usuarios_profissionais')
    .select('id, email, status')
    .eq('cpf', cpf)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    id: String(data.id),
    email: data.email == null ? null : String(data.email).trim().toLowerCase(),
    status: String(data.status),
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

async function invalidatePendingRecoveries(userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('profissional_recuperacao_senha')
    .delete()
    .eq('usuario_profissional_id', userId)
    .is('concluido_em', null)

  if (error) throw error
}

async function purgeExpiredRecoveries(): Promise<void> {
  const { error } = await supabaseAdmin
    .from('profissional_recuperacao_senha')
    .delete()
    .lt('expira_em', new Date().toISOString())
    .is('concluido_em', null)

  if (error) throw error
}

async function sendRecoveryCodeEmail(to: string, code: string): Promise<void> {
  await sendMail({
    to,
    subject: 'Seu código de verificação — Telefarmed',
    html: buildUbtPasswordRecoveryEmailHtml(code),
    text: buildUbtPasswordRecoveryEmailText(code),
  })
}

export async function requestProfissionalPasswordRecovery(cpfInput: string): Promise<{
  resetToken: string
  sentTo: string
  expiresInMinutes: number
  sentAt: string
}> {
  let cpf: string
  try {
    cpf = normalizeCpf(cpfInput)
  } catch {
    throw new ProfissionalPasswordRecoveryError('Informe um CPF válido.', 'INVALID_CPF')
  }

  const user = await findProfissionalUserByCpf(cpf)
  if (!user) {
    throw new ProfissionalPasswordRecoveryError(
      'CPF não encontrado entre os profissionais da rede.',
      'CPF_NOT_FOUND',
      404,
    )
  }

  if (user.status !== 'ativo') {
    throw new ProfissionalPasswordRecoveryError(
      'Este acesso profissional está inativo. Entre em contato com o suporte.',
      'USER_INACTIVE',
      403,
    )
  }

  if (!user.email) {
    throw new ProfissionalPasswordRecoveryError(
      'Não há e-mail cadastrado para este profissional. Atualize seu cadastro ou fale com o suporte.',
      'EMAIL_NOT_CONFIGURED',
      400,
    )
  }

  const sentAt = new Date().toISOString()
  const resetToken = createOpaqueToken()

  await purgeExpiredRecoveries()
  await invalidatePendingRecoveries(user.id)

  const code = generateRecoveryCode()
  const codeHash = await hashPassword(code)
  const resetTokenHash = hashOpaqueToken(resetToken)

  const { error } = await supabaseAdmin.from('profissional_recuperacao_senha').insert({
    usuario_profissional_id: user.id,
    hash_token_reset: resetTokenHash,
    hash_codigo: codeHash,
    expira_em: recoveryExpiresAt(CODE_TTL_MINUTES),
  })

  if (error) throw error

  try {
    await sendRecoveryCodeEmail(user.email, code)
  } catch (mailError) {
    await supabaseAdmin
      .from('profissional_recuperacao_senha')
      .delete()
      .eq('hash_token_reset', resetTokenHash)
      .is('concluido_em', null)

    console.error('[profissional-password-recovery] Falha ao enviar e-mail:', mailError)
    throw new ProfissionalPasswordRecoveryError(
      'Não foi possível enviar o código por e-mail. Tente novamente em instantes.',
      'EMAIL_SEND_FAILED',
      503,
    )
  }

  return {
    resetToken,
    sentTo: maskEmailForResponse(user.email),
    expiresInMinutes: CODE_TTL_MINUTES,
    sentAt,
  }
}

async function findOpenRecoveryByResetToken(resetToken: string): Promise<RecoveryRow | null> {
  const tokenHash = hashOpaqueToken(resetToken)
  const { data, error } = await supabaseAdmin
    .from('profissional_recuperacao_senha')
    .select(
      'id, usuario_profissional_id, hash_codigo, expira_em, verificado_em, concluido_em, tentativas_codigo',
    )
    .eq('hash_token_reset', tokenHash)
    .is('concluido_em', null)
    .is('verificado_em', null)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    id: String(data.id),
    usuario_profissional_id: String(data.usuario_profissional_id),
    hash_codigo: String(data.hash_codigo),
    expira_em: String(data.expira_em),
    verificado_em: data.verificado_em ? String(data.verificado_em) : null,
    concluido_em: data.concluido_em ? String(data.concluido_em) : null,
    tentativas_codigo: Number(data.tentativas_codigo ?? 0),
  }
}

export async function verifyProfissionalPasswordRecoveryCode(input: {
  resetToken: string
  code: string
}): Promise<{ verificationToken: string }> {
  const startedAt = Date.now()

  try {
    const normalizedCode = normalizeRecoveryCode(input.code)
    if (normalizedCode.length !== CODE_LENGTH) {
      throw new ProfissionalPasswordRecoveryError('Código inválido ou expirado.', 'INVALID_CODE')
    }

    const recovery = await findOpenRecoveryByResetToken(input.resetToken)
    if (!recovery) {
      await verifyPassword(normalizedCode, await getDummyCodeHash())
      return rejectInvalidRecoveryCode()
    }

    if (new Date(recovery.expira_em).getTime() <= Date.now()) {
      await supabaseAdmin.from('profissional_recuperacao_senha').delete().eq('id', recovery.id)
      await verifyPassword(normalizedCode, recovery.hash_codigo)
      return rejectInvalidRecoveryCode()
    }

    if (recovery.tentativas_codigo >= MAX_CODE_ATTEMPTS) {
      await supabaseAdmin.from('profissional_recuperacao_senha').delete().eq('id', recovery.id)
      throw new ProfissionalPasswordRecoveryError(
        'Número máximo de tentativas excedido. Solicite um novo código.',
        'TOO_MANY_ATTEMPTS',
      )
    }

    const codeOk = await verifyPassword(normalizedCode, recovery.hash_codigo)
    if (!codeOk) {
      const nextAttempts = recovery.tentativas_codigo + 1
      if (nextAttempts >= MAX_CODE_ATTEMPTS) {
        await supabaseAdmin.from('profissional_recuperacao_senha').delete().eq('id', recovery.id)
        throw new ProfissionalPasswordRecoveryError(
          'Número máximo de tentativas excedido. Solicite um novo código.',
          'TOO_MANY_ATTEMPTS',
        )
      }

      await supabaseAdmin
        .from('profissional_recuperacao_senha')
        .update({ tentativas_codigo: nextAttempts })
        .eq('id', recovery.id)

      throw new ProfissionalPasswordRecoveryError('Código inválido ou expirado.', 'INVALID_CODE')
    }

    const verificationToken = createOpaqueToken()
    const verificationTokenHash = hashOpaqueToken(verificationToken)
    const now = new Date().toISOString()

    const { error } = await supabaseAdmin
      .from('profissional_recuperacao_senha')
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
    .from('profissional_recuperacao_senha')
    .select(
      'id, usuario_profissional_id, hash_codigo, expira_em, verificado_em, concluido_em, tentativas_codigo',
    )
    .eq('hash_token_verificacao', tokenHash)
    .not('verificado_em', 'is', null)
    .is('concluido_em', null)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    id: String(data.id),
    usuario_profissional_id: String(data.usuario_profissional_id),
    hash_codigo: String(data.hash_codigo),
    expira_em: String(data.expira_em),
    verificado_em: data.verificado_em ? String(data.verificado_em) : null,
    concluido_em: data.concluido_em ? String(data.concluido_em) : null,
    tentativas_codigo: Number(data.tentativas_codigo ?? 0),
  }
}

export async function completeProfissionalPasswordRecovery(input: {
  verificationToken: string
  password: string
}): Promise<void> {
  const passwordError = validatePortalPassword(input.password)
  if (passwordError) {
    throw new ProfissionalPasswordRecoveryError(
      'A nova senha não atende aos requisitos de segurança.',
      'WEAK_PASSWORD',
    )
  }

  const recovery = await findVerifiedRecoveryByToken(input.verificationToken)
  if (!recovery) {
    throw new ProfissionalPasswordRecoveryError(
      'Não foi possível concluir a redefinição. Tente novamente.',
      'INVALID_VERIFICATION_TOKEN',
    )
  }

  if (new Date(recovery.expira_em).getTime() <= Date.now()) {
    await supabaseAdmin.from('profissional_recuperacao_senha').delete().eq('id', recovery.id)
    throw new ProfissionalPasswordRecoveryError(
      'Não foi possível concluir a redefinição. Tente novamente.',
      'INVALID_VERIFICATION_TOKEN',
    )
  }

  const { data: userRow, error: userError } = await supabaseAdmin
    .from('usuarios_profissionais')
    .select('id, status')
    .eq('id', recovery.usuario_profissional_id)
    .maybeSingle()

  if (userError) throw userError
  if (!userRow || userRow.status !== 'ativo') {
    throw new ProfissionalPasswordRecoveryError(
      'Não foi possível concluir a redefinição. Tente novamente.',
      'INVALID_VERIFICATION_TOKEN',
    )
  }

  const passwordHash = await hashPassword(input.password)
  const now = new Date().toISOString()

  const { error: userUpdateError } = await supabaseAdmin
    .from('usuarios_profissionais')
    .update({
      senha_hash: passwordHash,
      senha_alterada_em: now,
      tentativas_login_falhas: 0,
      bloqueado_ate: null,
      atualizado_em: now,
    })
    .eq('id', recovery.usuario_profissional_id)

  if (userUpdateError) throw userUpdateError

  const { error: recoveryUpdateError } = await supabaseAdmin
    .from('profissional_recuperacao_senha')
    .update({ concluido_em: now })
    .eq('id', recovery.id)
    .is('concluido_em', null)

  if (recoveryUpdateError) throw recoveryUpdateError

  const { error: revokeSessionsError } = await supabaseAdmin
    .from('sessoes_refresh_profissional')
    .update({ revogado_em: now })
    .eq('usuario_id', recovery.usuario_profissional_id)
    .is('revogado_em', null)

  if (revokeSessionsError) throw revokeSessionsError

  invalidateAuthSessionCache('profissional', String(recovery.usuario_profissional_id))
}

export function mapProfissionalPasswordRecoveryError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string }
} {
  if (error instanceof ProfissionalPasswordRecoveryError) {
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
