import { supabaseAdmin } from '../../db/supabase.js'
import { signVdPacienteAccessToken } from '../../lib/jwt.js'
import {
  createOpaqueToken,
  hashOpaqueToken,
  hashPassword,
} from '../../lib/password.js'
import { vdRefreshExpiresAt } from '../../lib/vdAuthSession.js'
import { VdCadastroError } from './errors.js'

export type VdPacienteAuthSession = {
  accessToken: string
  refreshToken: string
  credencialId: string
}

export async function createVdPacienteAuthSession(input: {
  pacienteId: string
  cpf: string
  nome: string
  entidadeContratanteId: string
  password: string
  userAgent?: string
  ipAddress?: string
}): Promise<VdPacienteAuthSession> {
  const senhaHash = await hashPassword(input.password)
  const refreshToken = createOpaqueToken()
  const refreshTokenHash = hashOpaqueToken(refreshToken)

  const { data: credencialId, error } = await supabaseAdmin.rpc('vd_criar_credencial_app_sessao', {
    p_paciente_id: input.pacienteId,
    p_senha_hash: senhaHash,
    p_hash_token_refresh: refreshTokenHash,
    p_expira_em: vdRefreshExpiresAt(),
    p_agente_usuario: input.userAgent ?? null,
    p_endereco_ip: input.ipAddress ?? null,
  })

  if (error) {
    const pgCode =
      typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code: unknown }).code)
        : ''

    if (pgCode === '23505') {
      throw new VdCadastroError(
        'Este CPF já possui conta no app. Faça login para continuar.',
        'ALREADY_REGISTERED',
        409,
      )
    }

    throw error
  }

  if (!credencialId) {
    throw new VdCadastroError('Não foi possível concluir o cadastro.', 'CONFLICT', 500)
  }

  const credencialIdString = String(credencialId)
  const accessToken = await signVdPacienteAccessToken({
    sub: credencialIdString,
    pacienteId: input.pacienteId,
    cpf: input.cpf,
    nome: input.nome,
    entidadeContratanteId: input.entidadeContratanteId,
  })

  return {
    accessToken,
    refreshToken,
    credencialId: credencialIdString,
  }
}
