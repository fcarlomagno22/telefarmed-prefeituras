import { portalPath } from './portalHost'

/** Paciente mock com histórico clínico completo (triagem + docs + pós-consulta). */
export const PROFISSIONAL_HISTORICO_DEMO_PACIENTE_ID = 'paciente-demo-maria'

/** Registro em Atendimentos que abre o drawer de demonstração. */
export const PROFISSIONAL_HISTORICO_DEMO_RECORD_ID = 'pat-hist-demo'

/** Código de atendimento mock na sala do médico (consulta ativa). ≥16 chars alfanuméricos. */
export const PROFISSIONAL_HISTORICO_DEMO_ATENDIMENTO_CODIGO = 'demoHistorico2026'

/** Slug legado (redirect) — não passa em isValidAttendanceId. */
export const PROFISSIONAL_HISTORICO_DEMO_ATENDIMENTO_CODIGO_LEGACY = 'demo-historico'

export function isProfissionalHistoricoDemoAtendimentoCodigo(codigo: string | undefined): boolean {
  if (!codigo) return false
  return (
    codigo === PROFISSIONAL_HISTORICO_DEMO_ATENDIMENTO_CODIGO ||
    codigo === PROFISSIONAL_HISTORICO_DEMO_ATENDIMENTO_CODIGO_LEGACY
  )
}

export function isProfissionalHistoricoDemoConsultaId(consultaId: string | undefined): boolean {
  if (!consultaId) return false
  return consultaId === `consulta-${PROFISSIONAL_HISTORICO_DEMO_ATENDIMENTO_CODIGO}`
}

export function isProfissionalHistoricoDemoSessionKey(key: string | undefined): boolean {
  return isProfissionalHistoricoDemoAtendimentoCodigo(key) || isProfissionalHistoricoDemoConsultaId(key)
}

export function profissionalHistoricoDemoPath() {
  return portalPath('profissional', '/demo/historico-consultas')
}

export function profissionalHistoricoDemoAtendimentosPath() {
  return `${portalPath('profissional', '/atendimentos')}?abrir=${PROFISSIONAL_HISTORICO_DEMO_RECORD_ID}`
}

export function profissionalHistoricoDemoConsultaPath() {
  return portalPath(
    'profissional',
    `/atendimento/${encodeURIComponent(PROFISSIONAL_HISTORICO_DEMO_ATENDIMENTO_CODIGO)}`,
  )
}
