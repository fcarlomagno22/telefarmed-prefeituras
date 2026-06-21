export type PendenciaCatalogEntry = {
  kind: string
  category: 'paciente' | 'profissional' | 'consulta' | 'procedimento'
  gravidade: 'bloqueante' | 'aviso'
  title: string
  reason: string
  impact: string
  recommendedAction: string
  primaryAction:
    | 'corrigir_cadastro'
    | 'editar_profissional'
    | 'abrir_consulta'
    | 'definir_procedimento'
    | 'revisar_regra_sus'
    | 'comparar_consultas'
    | 'solicitar_ajuste_profissional'
}

export const PENDENCIA_CATALOG: Record<string, PendenciaCatalogEntry> = {
  paciente_sem_cns: {
    kind: 'paciente_sem_cns',
    category: 'paciente',
    gravidade: 'bloqueante',
    title: 'Paciente sem CNS',
    reason: 'Cartão Nacional de Saúde não informado no cadastro.',
    impact: 'Esta consulta não pode entrar no fechamento SUS.',
    recommendedAction: 'Completar Cartão SUS no cadastro do paciente.',
    primaryAction: 'corrigir_cadastro',
  },
  paciente_sem_documento: {
    kind: 'paciente_sem_documento',
    category: 'paciente',
    gravidade: 'bloqueante',
    title: 'Paciente sem CPF e sem CNS',
    reason: 'Nenhum documento válido (CPF ou CNS) informado no cadastro.',
    impact: 'Consulta bloqueada para faturamento SUS.',
    recommendedAction: 'Informar CPF ou CNS válido no cadastro do paciente.',
    primaryAction: 'corrigir_cadastro',
  },
  paciente_cpf_cns_simultaneos: {
    kind: 'paciente_cpf_cns_simultaneos',
    category: 'paciente',
    gravidade: 'bloqueante',
    title: 'CPF e CNS simultâneos',
    reason: 'Paciente possui CPF e CNS informados ao mesmo tempo.',
    impact: 'Consulta bloqueada para exportação BPA-I.',
    recommendedAction: 'Manter apenas CPF ou CNS no cadastro do paciente.',
    primaryAction: 'corrigir_cadastro',
  },
  paciente_nome_ausente: {
    kind: 'paciente_nome_ausente',
    category: 'paciente',
    gravidade: 'bloqueante',
    title: 'Nome completo ausente',
    reason: 'Nome completo do paciente não informado.',
    impact: 'Consulta bloqueada para faturamento SUS.',
    recommendedAction: 'Completar nome completo no cadastro.',
    primaryAction: 'corrigir_cadastro',
  },
  paciente_nascimento_ausente: {
    kind: 'paciente_nascimento_ausente',
    category: 'paciente',
    gravidade: 'bloqueante',
    title: 'Data de nascimento ausente',
    reason: 'Data de nascimento não informada no cadastro.',
    impact: 'Consulta bloqueada para faturamento SUS.',
    recommendedAction: 'Informar data de nascimento no cadastro.',
    primaryAction: 'corrigir_cadastro',
  },
  paciente_sexo_ausente: {
    kind: 'paciente_sexo_ausente',
    category: 'paciente',
    gravidade: 'bloqueante',
    title: 'Sexo ausente',
    reason: 'Sexo do paciente não informado.',
    impact: 'Consulta bloqueada para faturamento SUS.',
    recommendedAction: 'Informar sexo no cadastro do paciente.',
    primaryAction: 'corrigir_cadastro',
  },
  paciente_raca_cor_ausente: {
    kind: 'paciente_raca_cor_ausente',
    category: 'paciente',
    gravidade: 'bloqueante',
    title: 'Raça/cor ausente',
    reason: 'Raça/cor do paciente não informada ou inválida.',
    impact: 'Consulta bloqueada para faturamento SUS.',
    recommendedAction: 'Informar raça/cor válida no cadastro.',
    primaryAction: 'corrigir_cadastro',
  },
  profissional_sem_cns: {
    kind: 'profissional_sem_cns',
    category: 'profissional',
    gravidade: 'bloqueante',
    title: 'Profissional sem CNS',
    reason: 'CNS do médico executante não informado.',
    impact: 'Consulta bloqueada para exportação BPA-I.',
    recommendedAction: 'Informar CNS do profissional no cadastro.',
    primaryAction: 'editar_profissional',
  },
  consulta_nao_teleconsulta_medica: {
    kind: 'consulta_nao_teleconsulta_medica',
    category: 'consulta',
    gravidade: 'bloqueante',
    title: 'Consulta fora do escopo BPA teleconsulta',
    reason: 'Apenas teleconsultas médicas em atenção especializada entram no BPA-I.',
    impact: 'Consulta não elegível para este export.',
    recommendedAction: 'Utilizar fluxo adequado ao tipo de atendimento.',
    primaryAction: 'revisar_regra_sus',
  },
  paciente_sem_cpf: {
    kind: 'paciente_sem_cpf',
    category: 'paciente',
    gravidade: 'bloqueante',
    title: 'Paciente sem CPF',
    reason: 'CPF inválido ou ausente no cadastro.',
    impact: 'Consulta bloqueada para faturamento SUS.',
    recommendedAction: 'Regularizar CPF no cadastro do paciente.',
    primaryAction: 'corrigir_cadastro',
  },
  municipio_ausente: {
    kind: 'municipio_ausente',
    category: 'paciente',
    gravidade: 'bloqueante',
    title: 'Município não informado',
    reason: 'Município ou código IBGE não informado no cadastro.',
    impact: 'Consulta bloqueada para faturamento SUS.',
    recommendedAction: 'Informar município de residência com código IBGE.',
    primaryAction: 'corrigir_cadastro',
  },
  profissional_ausente: {
    kind: 'profissional_ausente',
    category: 'profissional',
    gravidade: 'bloqueante',
    title: 'Profissional ausente',
    reason: 'Consulta sem profissional executante identificado.',
    impact: 'Consulta bloqueada para faturamento SUS.',
    recommendedAction: 'Vincular profissional executante à consulta.',
    primaryAction: 'editar_profissional',
  },
  profissional_sem_conselho: {
    kind: 'profissional_sem_conselho',
    category: 'profissional',
    gravidade: 'aviso',
    title: 'Conselho profissional ausente',
    reason: 'Registro no conselho profissional não informado.',
    impact: 'Pode gerar glosa no faturamento SUS.',
    recommendedAction: 'Completar dados do conselho no cadastro do profissional.',
    primaryAction: 'editar_profissional',
  },
  profissional_sem_cbo: {
    kind: 'profissional_sem_cbo',
    category: 'profissional',
    gravidade: 'bloqueante',
    title: 'Profissional sem CBO',
    reason: 'CBO do profissional executante não cadastrado.',
    impact: 'Consulta bloqueada para faturamento SUS.',
    recommendedAction: 'Informar CBO compatível com a especialidade.',
    primaryAction: 'editar_profissional',
  },
  profissional_sem_vinculo_cnes: {
    kind: 'profissional_sem_vinculo_cnes',
    category: 'profissional',
    gravidade: 'aviso',
    title: 'Profissional sem vínculo CNES',
    reason: 'Profissional sem vínculo ativo com o CNES da unidade executante.',
    impact: 'Revisar antes do fechamento; pode gerar glosa.',
    recommendedAction: 'Confirmar vínculo do profissional com a unidade.',
    primaryAction: 'editar_profissional',
  },
  cbo_incompativel_procedimento: {
    kind: 'cbo_incompativel',
    category: 'procedimento',
    gravidade: 'bloqueante',
    title: 'CBO incompatível com procedimento',
    reason: 'O CBO do profissional não está autorizado para o procedimento SIGTAP.',
    impact: 'Consulta bloqueada para faturamento SUS.',
    recommendedAction: 'Selecionar procedimento compatível com o CBO.',
    primaryAction: 'definir_procedimento',
  },
  procedimento_sigtap_ausente: {
    kind: 'procedimento_ausente',
    category: 'procedimento',
    gravidade: 'bloqueante',
    title: 'Procedimento SIGTAP ausente',
    reason: 'Nenhum procedimento SUS vinculado à consulta.',
    impact: 'Consulta bloqueada para faturamento SUS.',
    recommendedAction: 'Definir procedimento SIGTAP para a consulta.',
    primaryAction: 'definir_procedimento',
  },
  unidade_sem_cnes: {
    kind: 'unidade_sem_cnes',
    category: 'consulta',
    gravidade: 'bloqueante',
    title: 'Unidade sem CNES válido',
    reason: 'CNES da unidade executante inválido ou ausente.',
    impact: 'Consulta bloqueada para faturamento SUS.',
    recommendedAction: 'Regularizar CNES da unidade de saúde.',
    primaryAction: 'revisar_regra_sus',
  },
  sigtap_nao_importado: {
    kind: 'procedimento_fora_competencia',
    category: 'procedimento',
    gravidade: 'bloqueante',
    title: 'SIGTAP não importado',
    reason: 'Catálogo SIGTAP da competência não está disponível no sistema.',
    impact: 'Consultas não podem ser validadas para faturamento.',
    recommendedAction: 'Importar tabela SIGTAP da competência.',
    primaryAction: 'revisar_regra_sus',
  },
  consulta_nao_finalizada: {
    kind: 'consulta_nao_finalizada',
    category: 'consulta',
    gravidade: 'bloqueante',
    title: 'Consulta não finalizada',
    reason: 'Atendimento realizado sem fechamento do prontuário ou registro incompleto.',
    impact: 'Consulta bloqueada para faturamento SUS.',
    recommendedAction: 'Encerrar prontuário e registrar horário de término.',
    primaryAction: 'abrir_consulta',
  },
  consulta_sem_horario_fim: {
    kind: 'consulta_sem_horario_fim',
    category: 'consulta',
    gravidade: 'bloqueante',
    title: 'Horário de término ausente',
    reason: 'Horário de encerramento não registrado no atendimento.',
    impact: 'Consulta bloqueada para faturamento SUS.',
    recommendedAction: 'Registrar horário de término da consulta.',
    primaryAction: 'abrir_consulta',
  },
  cid_ausente: {
    kind: 'cid_ausente',
    category: 'procedimento',
    gravidade: 'aviso',
    title: 'CID não informado',
    reason: 'CID principal não foi registrado no prontuário.',
    impact: 'Campo opcional; não bloqueia o faturamento.',
    recommendedAction: 'Informar CID quando disponível no prontuário.',
    primaryAction: 'solicitar_ajuste_profissional',
  },
  duplicidade_consulta: {
    kind: 'duplicidade_consulta',
    category: 'consulta',
    gravidade: 'bloqueante',
    title: 'Duplicidade de consulta',
    reason: 'Duas consultas faturáveis no mesmo dia para o mesmo paciente.',
    impact: 'Consulta bloqueada para faturamento SUS.',
    recommendedAction: 'Comparar consultas e resolver duplicidade.',
    primaryAction: 'comparar_consultas',
  },
}

export function catalogForKind(kind: string): PendenciaCatalogEntry {
  return (
    PENDENCIA_CATALOG[kind] ?? {
      kind,
      category: 'consulta',
      gravidade: 'bloqueante',
      title: kind.replace(/_/g, ' '),
      reason: 'Pendência identificada na validação SUS.',
      impact: 'Consulta com restrição para faturamento SUS.',
      recommendedAction: 'Revisar regra SUS e corrigir dados.',
      primaryAction: 'revisar_regra_sus',
    }
  )
}

export function buildPendenciaId(registroSusId: string, kind: string): string {
  return `${registroSusId}__${kind}`
}

export function parsePendenciaId(id: string): { registroSusId: string; kind: string } | null {
  const idx = id.indexOf('__')
  if (idx <= 0) return null
  return {
    registroSusId: id.slice(0, idx),
    kind: id.slice(idx + 2),
  }
}

export function competenciaFromDate(iso: string): string {
  const date = new Date(iso)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export function buildPrincipalRecordId(entidadeId: string, competencia: string): string {
  return `rec-${entidadeId}-${competencia}-principal`
}

export function buildComplementRecordId(
  entidadeId: string,
  competencia: string,
  seq: number,
): string {
  return `rec-${entidadeId}-${competencia}-c${seq}`
}

export function buildLoteIdForRecord(
  competencia: string,
  tipo: 'principal' | 'complementar',
  complementoSeq: number | null,
  existingLoteId?: string | null,
): string {
  if (existingLoteId) return existingLoteId
  if (tipo === 'complementar' && complementoSeq) {
    return `LOTE-SUS-${competencia}-C${String(complementoSeq).padStart(2, '0')}`
  }
  return `LOTE-SUS-${competencia}`
}
