import type { PrefeituraFaturamentoCorrecaoDefinition } from '../../../types/prefeituraFaturamentoCorrecao'
import type { PrefeituraFaturamentoPendencia } from '../../../types/prefeituraFaturamentoPendencias'
import type { PrefeituraFaturamentoRegraSusCheckId } from '../../../types/prefeituraFaturamentoRegraSus'

const KIND_CORRECTION: Record<string, PrefeituraFaturamentoCorrecaoDefinition> = {
  paciente_sem_cns: {
    title: 'Completar cadastro',
    fieldLabel: 'CNS do paciente',
    reason: 'Cartão Nacional de Saúde ausente ou inválido no cadastro.',
    mode: 'edit_cns',
    relatedChecks: ['paciente_cns_valido'],
  },
  municipio_ausente: {
    title: 'Editar paciente',
    fieldLabel: 'Município de residência',
    reason: 'Município ou código IBGE não informado no cadastro.',
    mode: 'edit_municipio',
    relatedChecks: ['paciente_municipio_ibge'],
  },
  profissional_sem_cbo: {
    title: 'Editar profissional',
    fieldLabel: 'CBO do profissional',
    reason: 'CBO do profissional executante não cadastrado.',
    mode: 'edit_cbo',
    relatedChecks: ['profissional_cbo_informado', 'profissional_cbo_compativel'],
  },
  profissional_sem_cns: {
    title: 'Completar executante MT',
    fieldLabel: 'CNS do profissional terceirizado',
    reason: 'CNS do médico executante terceirizado não informado.',
    mode: 'edit_mt_profissional',
    relatedChecks: ['profissional_cns'],
  },
  profissional_sem_conselho: {
    title: 'Completar executante MT',
    fieldLabel: 'CRM do profissional terceirizado',
    reason: 'Conselho profissional do executante terceirizado não informado.',
    mode: 'edit_mt_profissional',
    relatedChecks: ['profissional_conselho_regular'],
  },
  profissional_sem_vinculo_cnes: {
    title: 'Configurar vínculo',
    fieldLabel: 'Vínculo com CNES da unidade',
    reason: 'Profissional sem vínculo ativo com o CNES da unidade executante.',
    mode: 'edit_vinculo_cnes',
    relatedChecks: ['profissional_vinculo_cnes'],
  },
  consulta_nao_finalizada: {
    title: 'Abrir consulta',
    fieldLabel: 'Consulta',
    reason: 'Atendimento realizado sem fechamento do prontuário ou registro incompleto.',
    mode: 'open_consulta',
    relatedChecks: [
      'consulta_atendimento_realizado',
      'consulta_horarios_inicio_fim',
      'consulta_prontuario_encerrado',
    ],
  },
  consulta_sem_horario_fim: {
    title: 'Abrir consulta',
    fieldLabel: 'Horário de término',
    reason: 'Horário de encerramento não registrado no atendimento.',
    mode: 'open_consulta',
    relatedChecks: ['consulta_horarios_inicio_fim'],
  },
  procedimento_ausente: {
    title: 'Definir procedimento',
    fieldLabel: 'Procedimento SIGTAP',
    reason: 'Nenhum procedimento SUS vinculado à consulta.',
    mode: 'select_procedure',
    relatedChecks: ['procedimento_sigtap_informado'],
  },
  cbo_incompativel: {
    title: 'Trocar procedimento',
    fieldLabel: 'Procedimento compatível',
    reason: 'O CBO do profissional não está autorizado para o procedimento selecionado.',
    mode: 'select_procedure',
    relatedChecks: ['profissional_cbo_compativel', 'procedimento_sigtap_informado'],
  },
  cid_ausente: {
    title: 'CID principal (opcional)',
    fieldLabel: 'CID principal',
    reason: 'Campo opcional; informe quando disponível no prontuário.',
    mode: 'request_clinical',
    relatedChecks: ['procedimento_cid_obrigatorio'],
  },
  duplicidade_consulta: {
    title: 'Comparar consultas',
    fieldLabel: 'Consultas no mesmo dia',
    reason: 'Duas consultas faturáveis no mesmo dia para o mesmo paciente.',
    mode: 'compare_consultas',
    relatedChecks: ['consulta_sem_duplicidade'],
  },
}

const CHECK_CORRECTION: Partial<
  Record<PrefeituraFaturamentoRegraSusCheckId, PrefeituraFaturamentoCorrecaoDefinition>
> = {
  paciente_cns_valido: KIND_CORRECTION.paciente_sem_cns,
  paciente_municipio_ibge: KIND_CORRECTION.municipio_ausente,
  profissional_cbo_informado: KIND_CORRECTION.profissional_sem_cbo,
  profissional_cbo_compativel: KIND_CORRECTION.cbo_incompativel,
  profissional_vinculo_cnes: KIND_CORRECTION.profissional_sem_vinculo_cnes,
  consulta_prontuario_encerrado: KIND_CORRECTION.consulta_nao_finalizada,
  consulta_horarios_inicio_fim: KIND_CORRECTION.consulta_sem_horario_fim,
  consulta_atendimento_realizado: KIND_CORRECTION.consulta_nao_finalizada,
  consulta_sem_duplicidade: KIND_CORRECTION.duplicidade_consulta,
  procedimento_sigtap_informado: KIND_CORRECTION.procedimento_ausente,
}

export const MOCK_CBO_OPTIONS = [
  { value: '225125', label: '225125 — Médico clínico' },
  { value: '225142', label: '225142 — Cardiologista' },
  { value: '223505', label: '223505 — Enfermeiro' },
  { value: '251510', label: '251510 — Psicólogo' },
]

export const MOCK_PROCEDURE_OPTIONS = [
  { value: '0301010307', label: '0301010307 — Teleconsulta médica na atenção especializada' },
  { value: '0510100010', label: '0510100010 — Sessão de psicoterapia individual' },
  { value: '0301010048', label: '0301010048 — Consulta de enfermagem' },
  { value: '0301010030', label: '0301010030 — Consulta de profissionais de nível superior' },
]

export function getCompatibleProcedureOptions(cbo?: string | null) {
  if (cbo === '223505') {
    return MOCK_PROCEDURE_OPTIONS.filter((option) =>
      ['0301010048', '0301010030'].includes(option.value),
    )
  }
  if (cbo === '251510') {
    return MOCK_PROCEDURE_OPTIONS.filter((option) => option.value === '0510100010')
  }
  return MOCK_PROCEDURE_OPTIONS.filter((option) =>
    ['0301010307', '0301010030'].includes(option.value),
  )
}

export function resolveCorrecaoDefinition(
  item: PrefeituraFaturamentoPendencia,
  checkId: PrefeituraFaturamentoRegraSusCheckId,
): PrefeituraFaturamentoCorrecaoDefinition | null {
  const kindDef = KIND_CORRECTION[item.kind]
  if (kindDef?.relatedChecks.includes(checkId)) {
    return kindDef
  }

  // Só permite correção cruzada para pendências de cadastro do paciente.
  if (item.kind === 'paciente_sem_cns' || item.kind === 'municipio_ausente') {
    return CHECK_CORRECTION[checkId] ?? null
  }

  return null
}

export function canCorrectCheck(
  item: PrefeituraFaturamentoPendencia,
  checkId: PrefeituraFaturamentoRegraSusCheckId,
) {
  return resolveCorrecaoDefinition(item, checkId) !== null
}

export function isPendenciaKindResolved(item: PrefeituraFaturamentoPendencia) {
  switch (item.kind) {
    case 'paciente_sem_cns':
      return !!item.patientCns && item.patientCns.replace(/\D/g, '').length >= 15
    case 'paciente_sem_cpf':
      return !!item.patientCpf
    case 'municipio_ausente':
      return !!item.patientMunicipalityIbge
    case 'profissional_sem_cbo':
      return !!item.professionalCbo
    case 'profissional_sem_vinculo_cnes':
      return item.professionalHasCnesVinculo === true
    case 'procedimento_ausente':
      return !!item.suggestedProcedure
    case 'cbo_incompativel':
      return !!item.suggestedProcedure && item.procedureCompatibleWithCbo === true
    case 'cid_ausente':
      return !!item.clinicalCid
    case 'consulta_nao_finalizada':
    case 'consulta_sem_horario_fim':
      return item.consultaEncerrada === true
    case 'duplicidade_consulta':
      return item.duplicidadeResolvida === true
    default:
      return false
  }
}
