import type { PrefeituraFaturamentoPendencia } from '../../../../types/prefeituraFaturamentoPendencias'
import type {
  PrefeituraFaturamentoRegraSusCheckId,
  PrefeituraFaturamentoRegraSusCheckItem,
  PrefeituraFaturamentoRegraSusChecklist,
  PrefeituraFaturamentoRegraSusCheckSection,
  PrefeituraFaturamentoRegraSusCheckStatus,
} from '../../../../types/prefeituraFaturamentoRegraSus'
import {
  formatPendenciaCompetenciaLabel,
  formatPendenciaConsultaDate,
} from './prefeituraFaturamentoPendenciasUi'
import { canCorrectCheck } from './prefeituraFaturamentoCorrecaoConfig'

const CHECK_LABELS: Record<PrefeituraFaturamentoRegraSusCheckId, string> = {
  paciente_cns_valido: 'CNS válido, quando exigido',
  paciente_nome_completo: 'Nome completo',
  paciente_data_nascimento: 'Data de nascimento válida',
  paciente_sexo: 'Sexo informado',
  paciente_nacionalidade: 'Nacionalidade informada',
  paciente_municipio_ibge: 'Município e código IBGE válidos',
  profissional_cns: 'CNS profissional informado',
  profissional_cbo_informado: 'CBO informado',
  profissional_cbo_compativel: 'CBO compatível com o procedimento',
  profissional_ativo: 'Profissional ativo',
  profissional_vinculo_cnes: 'Vínculo com o CNES da unidade',
  profissional_conselho_regular: 'Conselho profissional regular',
  consulta_atendimento_realizado: 'Atendimento efetivamente realizado',
  consulta_horarios_inicio_fim: 'Horários de início e término registrados',
  consulta_prontuario_encerrado: 'Prontuário preenchido e encerrado',
  consulta_profissional_executante: 'Profissional executante identificado',
  consulta_sem_duplicidade: 'Consulta sem duplicidade',
  consulta_nao_cancelada: 'Consulta não cancelada',
  consulta_paciente_nao_falta: 'Paciente não marcado como falta',
  procedimento_sigtap_informado: 'Procedimento SIGTAP informado',
  procedimento_vigente_competencia: 'Procedimento vigente na competência',
  procedimento_instrumento_compativel: 'Instrumento de registro compatível',
  procedimento_idade_sexo: 'Compatibilidade com idade e sexo',
  procedimento_cid_obrigatorio: 'CID principal (opcional)',
  procedimento_quantidade_limite: 'Quantidade dentro do limite',
  procedimento_teleatendimento: 'Compatibilidade com teleatendimento',
  procedimento_permitido_cnes: 'Procedimento permitido para o CNES',
}

const SECTIONS: Array<{
  id: PrefeituraFaturamentoRegraSusCheckSection['id']
  title: string
  checkIds: PrefeituraFaturamentoRegraSusCheckId[]
}> = [
  {
    id: 'paciente',
    title: 'Cadastro do paciente',
    checkIds: [
      'paciente_cns_valido',
      'paciente_nome_completo',
      'paciente_data_nascimento',
      'paciente_sexo',
      'paciente_nacionalidade',
      'paciente_municipio_ibge',
    ],
  },
  {
    id: 'profissional',
    title: 'Profissional',
    checkIds: [
      'profissional_cns',
      'profissional_cbo_informado',
      'profissional_cbo_compativel',
      'profissional_ativo',
      'profissional_vinculo_cnes',
      'profissional_conselho_regular',
    ],
  },
  {
    id: 'consulta',
    title: 'Consulta',
    checkIds: [
      'consulta_atendimento_realizado',
      'consulta_horarios_inicio_fim',
      'consulta_prontuario_encerrado',
      'consulta_profissional_executante',
      'consulta_sem_duplicidade',
      'consulta_nao_cancelada',
      'consulta_paciente_nao_falta',
    ],
  },
  {
    id: 'procedimento',
    title: 'Procedimento SUS',
    checkIds: [
      'procedimento_sigtap_informado',
      'procedimento_vigente_competencia',
      'procedimento_instrumento_compativel',
      'procedimento_idade_sexo',
      'procedimento_cid_obrigatorio',
      'procedimento_quantidade_limite',
      'procedimento_teleatendimento',
      'procedimento_permitido_cnes',
    ],
  },
]

const KIND_FAILURES: Partial<Record<string, PrefeituraFaturamentoRegraSusCheckId[]>> = {
  paciente_sem_cns: ['paciente_cns_valido'],
  municipio_ausente: ['paciente_municipio_ibge'],
  profissional_sem_cbo: ['profissional_cbo_informado', 'profissional_cbo_compativel'],
  cbo_incompativel: ['profissional_cbo_compativel'],
  profissional_sem_vinculo_cnes: ['profissional_vinculo_cnes'],
  consulta_nao_finalizada: [
    'consulta_prontuario_encerrado',
    'consulta_horarios_inicio_fim',
    'consulta_atendimento_realizado',
  ],
  consulta_sem_horario_fim: ['consulta_horarios_inicio_fim'],
  duplicidade_consulta: ['consulta_sem_duplicidade'],
  procedimento_ausente: ['procedimento_sigtap_informado'],
  procedimento_fora_competencia: ['procedimento_vigente_competencia'],
}

const KIND_WARNINGS: Partial<Record<string, PrefeituraFaturamentoRegraSusCheckId[]>> = {
  profissional_sem_vinculo_cnes: ['profissional_vinculo_cnes'],
  procedimento_fora_competencia: ['procedimento_vigente_competencia'],
}

const FAILURE_DETAILS: Partial<Record<PrefeituraFaturamentoRegraSusCheckId, string>> = {
  paciente_cns_valido: 'Cartão SUS ausente ou inválido no cadastro.',
  paciente_municipio_ibge: 'Município de residência ou código IBGE não informado.',
  profissional_cbo_informado: 'CBO do profissional executante não cadastrado.',
  profissional_cbo_compativel: 'CBO não permite o procedimento SIGTAP sugerido.',
  profissional_vinculo_cnes: 'Profissional sem vínculo ativo com o CNES da unidade.',
  consulta_prontuario_encerrado: 'Prontuário não encerrado após o atendimento.',
  consulta_horarios_inicio_fim: 'Horário de término não registrado.',
  consulta_sem_duplicidade: 'Outra consulta faturável no mesmo dia para o mesmo paciente.',
  procedimento_sigtap_informado: 'Nenhum procedimento SUS vinculado à consulta.',
  procedimento_vigente_competencia: 'Procedimento ou data fora da competência selecionada.',
  procedimento_cid_obrigatorio: 'CID principal não informado (campo opcional).',
  procedimento_permitido_cnes: 'CNES da unidade inválido ou sem permissão para o procedimento.',
}

function resolveStatus(
  checkId: PrefeituraFaturamentoRegraSusCheckId,
  item: PrefeituraFaturamentoPendencia,
  failedIds: Set<PrefeituraFaturamentoRegraSusCheckId>,
  warningIds: Set<PrefeituraFaturamentoRegraSusCheckId>,
): PrefeituraFaturamentoRegraSusCheckStatus {
  if (failedIds.has(checkId)) return 'fail'
  if (warningIds.has(checkId)) return 'warning'
  return 'ok'
}

function resolveStatusLabel(status: PrefeituraFaturamentoRegraSusCheckStatus) {
  if (status === 'ok') return 'Conferido'
  if (status === 'warning') return 'Aviso'
  return 'Pendente'
}

function resolveCheckFieldValue(
  checkId: PrefeituraFaturamentoRegraSusCheckId,
  item: PrefeituraFaturamentoPendencia,
): string {
  switch (checkId) {
    case 'paciente_cns_valido':
      if (item.patientCpf?.replace(/\D/g, '').length === 11) {
        return `CPF ${item.patientCpf}`
      }
      return item.patientCns ? `CNS ${item.patientCns}` : 'CNS não informado'
    case 'paciente_nome_completo':
      return item.patientName
    case 'paciente_data_nascimento':
      return 'Data de nascimento cadastrada'
    case 'paciente_sexo':
      return 'Sexo cadastrado'
    case 'paciente_nacionalidade':
      return 'Nacionalidade brasileira'
    case 'paciente_municipio_ibge':
      if (item.patientMunicipality && item.patientMunicipalityIbge) {
        return `${item.patientMunicipality} · IBGE ${item.patientMunicipalityIbge}`
      }
      if (item.patientMunicipalityIbge) {
        return `IBGE ${item.patientMunicipalityIbge}`
      }
      return item.patientMunicipality ?? 'Município / IBGE não informado'
    case 'profissional_cns':
      return 'CNS profissional cadastrado'
    case 'profissional_cbo_informado':
      return item.professionalCboLabel ?? item.professionalCbo ?? 'CBO não informado'
    case 'profissional_cbo_compativel': {
      const cbo = item.professionalCboLabel ?? item.professionalCbo ?? 'CBO não informado'
      const proc = item.suggestedProcedure ?? 'procedimento não informado'
      return `CBO ${cbo} · SIGTAP ${proc}`
    }
    case 'profissional_ativo':
      return item.professionalName
    case 'profissional_vinculo_cnes':
      return `${item.unitName} · CNES ${item.cnes}`
    case 'profissional_conselho_regular':
      return `${item.professionalName} · conselho regular`
    case 'consulta_atendimento_realizado':
      return item.consultaId
    case 'consulta_horarios_inicio_fim':
      return formatPendenciaConsultaDate(item.consultaDate)
    case 'consulta_prontuario_encerrado':
      return item.consultaEncerrada ? 'Prontuário encerrado' : 'Prontuário pendente de encerramento'
    case 'consulta_profissional_executante':
      return item.professionalName
    case 'consulta_sem_duplicidade':
      return item.duplicateConsultaId
        ? `Possível duplicidade com ${item.duplicateConsultaId}`
        : 'Nenhuma duplicidade identificada'
    case 'consulta_nao_cancelada':
      return 'Consulta não cancelada'
    case 'consulta_paciente_nao_falta':
      return `${item.patientName} · presença confirmada`
    case 'procedimento_sigtap_informado':
      return item.suggestedProcedure ? `SIGTAP ${item.suggestedProcedure}` : 'Procedimento não informado'
    case 'procedimento_vigente_competencia':
      return formatPendenciaCompetenciaLabel(item.competencia)
    case 'procedimento_instrumento_compativel':
      return 'Instrumento BPA · teleatendimento'
    case 'procedimento_idade_sexo':
      return 'Paciente compatível com o procedimento'
    case 'procedimento_cid_obrigatorio':
      return item.clinicalCid ? `CID ${item.clinicalCid}` : 'CID não informado (opcional)'
    case 'procedimento_quantidade_limite':
      return 'Quantidade 1 · dentro do limite'
    case 'procedimento_teleatendimento':
      return 'Modalidade teleconsulta'
    case 'procedimento_permitido_cnes':
      return `CNES ${item.cnes}`
    default:
      return '—'
  }
}

function collectFailedChecks(item: PrefeituraFaturamentoPendencia) {
  const failed = new Set<PrefeituraFaturamentoRegraSusCheckId>(KIND_FAILURES[item.kind] ?? [])
  const warnings = new Set<PrefeituraFaturamentoRegraSusCheckId>()

  for (const id of KIND_WARNINGS[item.kind] ?? []) {
    if (item.gravidade === 'aviso') {
      failed.delete(id)
      warnings.add(id)
    }
  }

  const patientCpfDigits = item.patientCpf?.replace(/\D/g, '') ?? ''
  const hasValidCpf = patientCpfDigits.length === 11
  const patientCnsDigits = item.patientCns?.replace(/\D/g, '') ?? ''
  const hasValidCns = patientCnsDigits.length >= 15

  if (!hasValidCpf && !hasValidCns) {
    failed.add('paciente_cns_valido')
  }

  if (!item.patientName.trim() || item.patientName.trim().split(/\s+/).length < 2) {
    failed.add('paciente_nome_completo')
  }

  if (!item.suggestedProcedure) {
    failed.add('procedimento_sigtap_informado')
  }

  if (item.cnes.replace(/\D/g, '').length !== 7) {
    failed.add('procedimento_permitido_cnes')
  }

  if (item.kind === 'consulta_nao_finalizada') {
    failed.add('consulta_prontuario_encerrado')
  }

  if (hasValidCpf || hasValidCns) {
    failed.delete('paciente_cns_valido')
  }
  if (item.patientMunicipalityIbge) {
    failed.delete('paciente_municipio_ibge')
  }
  if (item.professionalCbo) {
    failed.delete('profissional_cbo_informado')
  }
  if (item.procedureCompatibleWithCbo) {
    failed.delete('profissional_cbo_compativel')
  }
  if (item.professionalCbo && item.kind !== 'cbo_incompativel') {
    failed.delete('profissional_cbo_compativel')
  }
  if (item.professionalHasCnesVinculo) {
    failed.delete('profissional_vinculo_cnes')
  }
  if (item.suggestedProcedure) {
    failed.delete('procedimento_sigtap_informado')
  }
  failed.delete('procedimento_cid_obrigatorio')
  if (item.consultaEncerrada) {
    failed.delete('consulta_prontuario_encerrado')
    failed.delete('consulta_horarios_inicio_fim')
    failed.delete('consulta_atendimento_realizado')
  }
  if (item.duplicidadeResolvida) {
    failed.delete('consulta_sem_duplicidade')
  }

  if (item.status === 'validada' || item.status === 'corrigida') {
    for (const id of [...failed]) {
      if (
        id === 'consulta_horarios_inicio_fim' &&
        item.kind === 'consulta_sem_horario_fim' &&
        item.status === 'validada'
      ) {
        failed.delete(id)
      }
      if (id === 'paciente_municipio_ibge' && item.kind === 'municipio_ausente' && item.status === 'corrigida') {
        failed.delete(id)
      }
    }
  }

  return { failed, warnings }
}

export function buildPrefeituraRegraSusChecklist(
  item: PrefeituraFaturamentoPendencia,
): PrefeituraFaturamentoRegraSusChecklist {
  const { failed, warnings } = collectFailedChecks(item)

  const sections: PrefeituraFaturamentoRegraSusCheckSection[] = SECTIONS.map((section) => ({
    id: section.id,
    title: section.title,
    items: section.checkIds.map((checkId) => {
      const status = resolveStatus(checkId, item, failed, warnings)
      const detail =
        status === 'fail' || status === 'warning'
          ? (FAILURE_DETAILS[checkId] ?? item.reason)
          : undefined

      return {
        id: checkId,
        label: CHECK_LABELS[checkId],
        status,
        statusLabel: resolveStatusLabel(status),
        fieldValue: resolveCheckFieldValue(checkId, item),
        detail,
        canCorrect:
          (status === 'fail' || status === 'warning') && canCorrectCheck(item, checkId),
      } satisfies PrefeituraFaturamentoRegraSusCheckItem
    }),
  }))

  const allItems = sections.flatMap((section) => section.items)
  const passedChecks = allItems.filter((check) => check.status === 'ok').length
  const failedChecks = allItems.filter((check) => check.status === 'fail').length
  const warningChecks = allItems.filter((check) => check.status === 'warning').length

  return {
    sections,
    totalChecks: allItems.length,
    passedChecks,
    failedChecks,
    warningChecks,
    faturavel: failedChecks === 0,
  }
}

export function formatRegraSusCompetenciaLabel(competencia: string) {
  return formatPendenciaCompetenciaLabel(competencia)
}
