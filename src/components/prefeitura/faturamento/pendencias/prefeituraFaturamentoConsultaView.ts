import type { PrefeituraFaturamentoPendencia } from '../../../../types/prefeituraFaturamentoPendencias'
import { maskCpfForDisplay } from '../../../../utils/lgpdDisplay'
import { buildPrefeituraRegraSusChecklist } from './buildPrefeituraRegraSusChecklist'
import {
  formatPendenciaCompetenciaLabel,
  formatPendenciaConsultaDate,
  isPendenciaAberta,
  resolvePendenciaSituacaoBadge,
  prefeituraFaturamentoPendenciaGravidadeLabel,
} from './prefeituraFaturamentoPendenciasUi'

export type PrefeituraFaturamentoConsultaViewRow = {
  label: string
  value: string
  highlight?: 'ok' | 'warn' | 'fail'
  showCnsOptionalInfo?: boolean
}

export const PACIENTE_CNS_NAO_INFORMADO_TOOLTIP = {
  portaria:
    'Portaria GM nº 2.236/2021 — o CPF é a forma preferencial de identificação nos sistemas de saúde; o CNS só é obrigatório quando a pessoa não possui CPF.',
  siaSus:
    'SIA/SUS (DataSUS, a partir de 01/2025) — em cada atendimento deve ir apenas um documento (CPF ou CNS); recomenda-se priorizar o CPF.',
} as const

export type PrefeituraFaturamentoConsultaViewSection = {
  id: 'consulta' | 'paciente' | 'profissional' | 'procedimento' | 'pendencia'
  title: string
  rows: PrefeituraFaturamentoConsultaViewRow[]
}

export type PrefeituraFaturamentoConsultaView = {
  faturavel: boolean
  passedChecks: number
  totalChecks: number
  failedChecks: number
  warningChecks: number
  blockers: string[]
  sections: PrefeituraFaturamentoConsultaViewSection[]
}

function formatConsultaEnd(item: PrefeituraFaturamentoPendencia) {
  if (item.consultaEndedAt) {
    return formatPendenciaConsultaDate(item.consultaEndedAt)
  }
  if (item.consultaEncerrada) {
    const start = new Date(item.consultaDate)
    const end = new Date(start.getTime() + 30 * 60_000)
    return formatPendenciaConsultaDate(end.toISOString())
  }
  return 'Horário de término não registrado'
}

function rowHighlight(
  ok: boolean,
  warn = false,
): PrefeituraFaturamentoConsultaViewRow['highlight'] {
  if (ok) return 'ok'
  if (warn) return 'warn'
  return 'fail'
}

export function buildPrefeituraFaturamentoConsultaView(
  item: PrefeituraFaturamentoPendencia,
): PrefeituraFaturamentoConsultaView {
  const checklist = buildPrefeituraRegraSusChecklist(item)

  const blockers = checklist.sections
    .flatMap((section) => section.items)
    .filter((check) => check.status === 'fail')
    .map((check) => check.label)

  const hasCns = !!item.patientCns && item.patientCns.replace(/\D/g, '').length >= 15
  const hasValidCpf = !!item.patientCpf && item.patientCpf.replace(/\D/g, '').length === 11
  const hasCbo = !!item.professionalCbo || !!item.professionalCboLabel
  const cboCompatible =
    item.procedureCompatibleWithCbo === true ||
    (item.kind !== 'cbo_incompativel' && hasCbo)
  const hasProcedure = !!item.suggestedProcedure
  const hasCid = !!item.clinicalCid
  const consultaOk =
    item.consultaEncerrada !== false &&
    item.kind !== 'consulta_nao_finalizada' &&
    item.kind !== 'consulta_sem_horario_fim'
  const duplicidadeOk = item.kind !== 'duplicidade_consulta' || item.duplicidadeResolvida === true

  const sections: PrefeituraFaturamentoConsultaViewSection[] = [
    {
      id: 'consulta',
      title: 'Consulta',
      rows: [
        { label: 'Identificador', value: item.consultaId },
        {
          label: 'Início',
          value: formatPendenciaConsultaDate(item.consultaStartedAt ?? item.consultaDate),
        },
        {
          label: 'Término',
          value: formatConsultaEnd(item),
          highlight: rowHighlight(item.consultaEncerrada === true || !!item.consultaEndedAt),
        },
        {
          label: 'Modalidade',
          value: item.consultaModality ?? 'Teleconsulta',
          highlight: 'ok',
        },
        {
          label: 'Situação clínica',
          value:
            item.consultaEncerrada === false
              ? 'Prontuário pendente'
              : item.consultaClinicalStatus ?? 'Atendimento concluído',
          highlight: rowHighlight(consultaOk),
        },
        {
          label: 'Duplicidade',
          value: item.duplicateConsultaId
            ? `Possível duplicidade · ${item.duplicateConsultaId}`
            : 'Nenhuma identificada',
          highlight: rowHighlight(duplicidadeOk, item.kind === 'duplicidade_consulta'),
        },
        {
          label: 'Competência SUS',
          value: formatPendenciaCompetenciaLabel(item.competencia),
        },
      ],
    },
    {
      id: 'paciente',
      title: 'Paciente',
      rows: [
        { label: 'Nome', value: item.patientName },
        {
          label: 'CPF',
          value: item.patientCpf ? maskCpfForDisplay(item.patientCpf) : 'Não informado',
          highlight: rowHighlight(!!item.patientCpf),
        },
        {
          label: 'CNS',
          value: item.patientCns ?? 'Não informado',
          highlight: rowHighlight(hasCns || hasValidCpf),
          showCnsOptionalInfo: !hasCns,
        },
        {
          label: 'Nascimento',
          value: item.patientBirthDate ?? 'Cadastro completo',
          highlight: 'ok',
        },
        {
          label: 'Sexo',
          value: item.patientSex ?? 'Informado',
          highlight: 'ok',
        },
        {
          label: 'Município / IBGE',
          value:
            item.patientMunicipality && item.patientMunicipalityIbge
              ? `${item.patientMunicipality} · IBGE ${item.patientMunicipalityIbge}`
              : (item.patientMunicipalityIbge ??
                item.patientMunicipality ??
                'Não informado'),
          highlight: rowHighlight(!!item.patientMunicipalityIbge),
        },
      ],
    },
    {
      id: 'profissional',
      title: 'Profissional executante',
      rows: [
        { label: 'Nome', value: item.professionalName },
        { label: 'Especialidade', value: item.specialty },
        {
          label: 'CBO',
          value: item.professionalCboLabel ?? item.professionalCbo ?? 'Não informado',
          highlight: rowHighlight(hasCbo),
        },
        {
          label: 'Compatibilidade CBO × procedimento',
          value: cboCompatible ? 'Compatível' : 'Incompatível',
          highlight: rowHighlight(cboCompatible),
        },
        {
          label: 'CNS profissional',
          value: item.professionalCns ?? 'Cadastrado',
          highlight: 'ok',
        },
        {
          label: 'Conselho',
          value: item.professionalConselho ?? 'Regular',
          highlight: 'ok',
        },
        {
          label: 'Vínculo CNES',
          value:
            item.professionalHasCnesVinculo === false
              ? 'Sem vínculo ativo'
              : `${item.unitName} · CNES ${item.cnes}`,
          highlight: rowHighlight(item.professionalHasCnesVinculo !== false),
        },
        {
          label: 'Situação',
          value: item.professionalActive === false ? 'Inativo' : 'Ativo',
          highlight: rowHighlight(item.professionalActive !== false),
        },
      ],
    },
    {
      id: 'procedimento',
      title: 'Procedimento SUS',
      rows: [
        {
          label: 'SIGTAP',
          value: item.suggestedProcedure
            ? `${item.suggestedProcedure}${item.suggestedProcedureName ? ` · ${item.suggestedProcedureName}` : ''}`
            : 'Não informado',
          highlight: rowHighlight(hasProcedure),
        },
        {
          label: 'CID principal',
          value: item.clinicalCid ?? 'Não informado (opcional)',
          highlight: hasCid ? 'ok' : 'warn',
        },
        {
          label: 'Unidade executante',
          value: `${item.unitName} · CNES ${item.cnes}`,
          highlight: rowHighlight(item.cnes.replace(/\D/g, '').length === 7),
        },
        {
          label: 'Instrumento',
          value: 'BPA · teleatendimento',
          highlight: 'ok',
        },
        {
          label: 'Vigência na competência',
          value:
            item.kind === 'procedimento_fora_competencia'
              ? 'Fora da competência selecionada'
              : 'Vigente',
          highlight: rowHighlight(item.kind !== 'procedimento_fora_competencia', true),
        },
      ],
    },
    {
      id: 'pendencia',
      title: 'Pendência de faturamento',
      rows: [
        { label: 'Tipo', value: item.title },
        { label: 'Motivo', value: item.reason },
        { label: 'Impacto', value: item.impact },
        {
          label: 'Situação',
          value: resolvePendenciaSituacaoBadge(item).label,
        },
        ...(isPendenciaAberta(item.status)
          ? [
              {
                label: 'Natureza',
                value: prefeituraFaturamentoPendenciaGravidadeLabel[item.gravidade],
              },
            ]
          : []),
        {
          label: 'Responsável',
          value: item.responsibleName ?? 'Não atribuído',
        },
      ],
    },
  ]

  return {
    faturavel: checklist.faturavel,
    passedChecks: checklist.passedChecks,
    totalChecks: checklist.totalChecks,
    failedChecks: checklist.failedChecks,
    warningChecks: checklist.warningChecks,
    blockers,
    sections,
  }
}
