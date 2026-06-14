import { hashPassword, verifyPassword } from '../../lib/password.js'
import { supabaseAdmin } from '../../db/supabase.js'
import { ProfissionalCadastroError } from './errors.js'
import type { FormacaoCandidatura } from './types.js'

let dummyAccessCodeHashPromise: Promise<string> | null = null

async function getDummyAccessCodeHash(): Promise<string> {
  if (!dummyAccessCodeHashPromise) {
    dummyAccessCodeHashPromise = hashPassword('000000')
  }
  return dummyAccessCodeHashPromise
}

export type CandidaturaAprovadaRow = {
  id: string
  cpf: string
  nome_completo: string
  email: string
  telefone: string | null
  data_nascimento: string
  formacao: FormacaoCandidatura
  especialidade_id: string
  conselho_sigla: string
  conselho_numero: string
  conselho_uf: string
  rqe: string | null
  descricao_profissional: string
  endereco: Record<string, unknown>
  status: string
  finalizada_em: string | null
  codigo_acesso_hash: string | null
  codigo_acesso_expira_em: string | null
  especialidade_nome?: string
}

const INVALID_ACCESS_CODE_MESSAGE = 'Código de acesso inválido ou expirado.'

export function normalizeAccessCode(value: string): string {
  return value.replace(/\D/g, '')
}

async function verifyAccessCodeSecret(code: string, hash: string | null): Promise<boolean> {
  const targetHash = hash ?? (await getDummyAccessCodeHash())
  return verifyPassword(code, targetHash)
}

export async function loadCandidaturaByAccessCode(code: string): Promise<CandidaturaAprovadaRow> {
  const normalized = normalizeAccessCode(code)
  if (normalized.length !== 6) {
    await verifyAccessCodeSecret(normalized, null)
    throw new ProfissionalCadastroError(INVALID_ACCESS_CODE_MESSAGE, 'INVALID_DATA', 404)
  }

  const { data, error } = await supabaseAdmin
    .from('candidaturas_profissionais')
    .select(
      `
      id,
      cpf,
      nome_completo,
      email,
      telefone,
      data_nascimento,
      formacao,
      especialidade_id,
      conselho_sigla,
      conselho_numero,
      conselho_uf,
      rqe,
      descricao_profissional,
      endereco,
      status,
      finalizada_em,
      codigo_acesso_hash,
      codigo_acesso_expira_em
    `,
    )
    .eq('codigo_acesso', normalized)
    .is('finalizada_em', null)
    .maybeSingle()

  if (error) throw error

  const hashToVerify = data ? String(data.codigo_acesso_hash ?? '') || null : null
  const codeValid = await verifyAccessCodeSecret(normalized, hashToVerify)

  if (!data || !codeValid) {
    throw new ProfissionalCadastroError(INVALID_ACCESS_CODE_MESSAGE, 'INVALID_DATA', 404)
  }

  const row = data as CandidaturaAprovadaRow

  if (row.status !== 'aprovada') {
    throw new ProfissionalCadastroError(INVALID_ACCESS_CODE_MESSAGE, 'INVALID_DATA', 404)
  }

  if (row.codigo_acesso_expira_em && Date.parse(row.codigo_acesso_expira_em) < Date.now()) {
    throw new ProfissionalCadastroError(
      'Código de acesso expirado. Solicite um novo código à equipe Telefarmed.',
      'INVALID_DATA',
      410,
    )
  }

  const { data: especialidade, error: especialidadeError } = await supabaseAdmin
    .from('config_especialidades')
    .select('nome')
    .eq('id', row.especialidade_id)
    .maybeSingle()

  if (especialidadeError) throw especialidadeError

  return {
    ...row,
    especialidade_nome: especialidade?.nome ? String(especialidade.nome) : '',
  }
}
