import type {
  ClinicalDocumentContext,
  ClinicalDocumentPayload,
  PsychologistAtestadoPdfData,
  PsychologistEncaminhamentoPdfData,
  PsychologistLaudoPdfData,
  PsychologistParecerPdfData,
  PsychologistRelatorioMultiprofissionalPdfData,
  PsychologistRelatorioPdfData,
} from '../../types/clinicalDocument'
import {
  buildDocumentoVerificacaoUrl,
  generateCodigoVerificacaoDocumento,
} from './codigoVerificacao'
import {
  buildPsychologistAtestadoDeclarationLines,
  buildPsychologistEncaminhamentoSections,
  buildPsychologistLaudoSections,
  buildPsychologistParecerSections,
  buildPsychologistRelatorioMultiprofissionalSections,
  buildPsychologistRelatorioSections,
} from './psicologoLines'

function formatBrazilianDateLabel(isoDate: string): string {
  const parts = isoDate.split('-')
  if (parts.length !== 3) return isoDate
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function addDaysToIsoDate(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00`)
  date.setDate(date.getDate() + Math.max(0, days - 1))
  return date.toISOString().slice(0, 10)
}

function buildPayloadBase(
  kind: ClinicalDocumentPayload['kind'],
  context: ClinicalDocumentContext,
  sections: ClinicalDocumentPayload['sections'],
  urgent?: boolean,
): ClinicalDocumentPayload {
  const codigoVerificacao = generateCodigoVerificacaoDocumento()
  return {
    kind,
    context,
    sections,
    urgent,
    codigoVerificacao,
    verificationUrl: buildDocumentoVerificacaoUrl(codigoVerificacao, context.entidadeSlug),
  }
}

export function buildPsychologistAtestadoClinicalDocumentPayload(input: {
  context: ClinicalDocumentContext
  atestado: PsychologistAtestadoPdfData
}): ClinicalDocumentPayload {
  const lines = buildPsychologistAtestadoDeclarationLines(
    input.context.patientName,
    input.atestado,
    formatBrazilianDateLabel,
    addDaysToIsoDate,
  )
  return buildPayloadBase('atestado_psicologico', input.context, [{ title: 'Declaração', lines }])
}

export function buildPsychologistRelatorioClinicalDocumentPayload(input: {
  context: ClinicalDocumentContext
  relatorio: PsychologistRelatorioPdfData
}): ClinicalDocumentPayload {
  return buildPayloadBase(
    'relatorio_psicologico',
    input.context,
    buildPsychologistRelatorioSections(input.relatorio),
  )
}

export function buildPsychologistRelatorioMultiprofissionalClinicalDocumentPayload(input: {
  context: ClinicalDocumentContext
  relatorio: PsychologistRelatorioMultiprofissionalPdfData
}): ClinicalDocumentPayload {
  return buildPayloadBase(
    'relatorio_multiprofissional',
    input.context,
    buildPsychologistRelatorioMultiprofissionalSections(input.relatorio),
  )
}

export function buildPsychologistLaudoClinicalDocumentPayload(input: {
  context: ClinicalDocumentContext
  laudo: PsychologistLaudoPdfData
}): ClinicalDocumentPayload {
  return buildPayloadBase(
    'laudo_psicologico',
    input.context,
    buildPsychologistLaudoSections(input.laudo),
  )
}

export function buildPsychologistParecerClinicalDocumentPayload(input: {
  context: ClinicalDocumentContext
  parecer: PsychologistParecerPdfData
}): ClinicalDocumentPayload {
  return buildPayloadBase(
    'parecer_psicologico',
    input.context,
    buildPsychologistParecerSections(input.parecer),
  )
}

export function buildPsychologistEncaminhamentoClinicalDocumentPayload(input: {
  context: ClinicalDocumentContext
  encaminhamento: PsychologistEncaminhamentoPdfData
}): ClinicalDocumentPayload {
  return buildPayloadBase(
    'encaminhamento_psicologico',
    input.context,
    buildPsychologistEncaminhamentoSections(input.encaminhamento),
    input.encaminhamento.prioridade === 'urgente',
  )
}
