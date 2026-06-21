import { normalizeFormacaoForCbo, resolveFormacaoCboSync } from './formacaoCbo.js'

export type ProfissionalExecutanteSus = {
  nome: string
  conselho_sigla: string | null
  conselho_numero: string | null
  conselho_uf: string | null
  formacao: string | null
  cbo_codigo: string | null
  cbo_descricao: string | null
  cns: string | null
  status: string | null
}

type UsuarioProfissionalSusRow = {
  nome?: string | null
  conselho_sigla?: string | null
  conselho_numero?: string | null
  conselho_uf?: string | null
  formacao?: string | null
  cbo_codigo?: string | null
  cbo_descricao?: string | null
  cns?: string | null
  status?: string | null
}

type ProfissionalMtSusRow = {
  nome?: string | null
  conselho_sigla?: string | null
  conselho_numero?: string | null
  conselho_uf?: string | null
  formacao?: string | null
  cbo_codigo?: string | null
  cbo_descricao?: string | null
  cns?: string | null
  especialidade?: string | null
}

function applyCanonicalFormacaoCbo(
  executante: ProfissionalExecutanteSus,
  especialidadeNome?: string | null,
): ProfissionalExecutanteSus {
  const resolved = resolveFormacaoCboSync(executante.formacao, especialidadeNome)
  return {
    ...executante,
    formacao: resolved.formacao,
    cbo_codigo: resolved.codigo,
    cbo_descricao: resolved.descricao,
  }
}

function mapUsuarioProfissional(
  row: UsuarioProfissionalSusRow,
  especialidadeNome?: string | null,
): ProfissionalExecutanteSus {
  return applyCanonicalFormacaoCbo(
    {
      nome: String(row.nome ?? 'Profissional').trim() || 'Profissional',
      conselho_sigla: row.conselho_sigla ? String(row.conselho_sigla) : null,
      conselho_numero: row.conselho_numero ? String(row.conselho_numero) : null,
      conselho_uf: row.conselho_uf ? String(row.conselho_uf) : null,
      formacao: row.formacao ? String(row.formacao) : null,
      cbo_codigo: null,
      cbo_descricao: null,
      cns: row.cns ? String(row.cns) : null,
      status: row.status ? String(row.status) : null,
    },
    especialidadeNome,
  )
}

function mapProfissionalMt(
  row: ProfissionalMtSusRow,
  especialidadeNome?: string | null,
): ProfissionalExecutanteSus {
  const specialtyHint = especialidadeNome ?? row.especialidade ?? null
  return applyCanonicalFormacaoCbo(
    {
      nome: String(row.nome ?? 'Profissional terceirizado').trim() || 'Profissional terceirizado',
      conselho_sigla: row.conselho_sigla ? String(row.conselho_sigla) : null,
      conselho_numero: row.conselho_numero ? String(row.conselho_numero) : null,
      conselho_uf: row.conselho_uf ? String(row.conselho_uf) : null,
      formacao: row.formacao ? String(row.formacao) : null,
      cbo_codigo: null,
      cbo_descricao: null,
      cns: row.cns ? String(row.cns) : null,
      status: 'ativo',
    },
    specialtyHint,
  )
}

export function resolveProfissionalExecutanteSus(params: {
  origemAtendimento: string
  usuarioProfissional: UsuarioProfissionalSusRow | null | undefined
  profissionalMt: ProfissionalMtSusRow | null | undefined
  especialidadeNome?: string | null
}): ProfissionalExecutanteSus | null {
  const especialidadeNome = params.especialidadeNome ?? null

  if (params.origemAtendimento === 'mt' && params.profissionalMt) {
    return mapProfissionalMt(params.profissionalMt, especialidadeNome)
  }

  if (params.usuarioProfissional) {
    return mapUsuarioProfissional(params.usuarioProfissional, especialidadeNome)
  }

  if (params.profissionalMt) {
    return mapProfissionalMt(params.profissionalMt, especialidadeNome)
  }

  return null
}

export function isConsultaMtTerceirizada(origemAtendimento: string): boolean {
  return origemAtendimento === 'mt'
}

export { normalizeFormacaoForCbo, resolveFormacaoCboSync }
