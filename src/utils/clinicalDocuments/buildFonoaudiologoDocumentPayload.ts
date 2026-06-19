import type {
  ClinicalDocumentContext,
  ClinicalDocumentPayload,
  FonoaudiologoAtestadoPdfData,
  FonoaudiologoDeclaracaoComparecimentoPdfData,
  FonoaudiologoEncaminhamentoPdfData,
  FonoaudiologoLaudoPdfData,
  FonoaudiologoParecerPdfData,
  FonoaudiologoPlanoTerapeuticoPdfData,
  FonoaudiologoRelatorioPdfData,
  FonoaudiologoResultadoAvaliacaoPdfData,
} from '../../types/clinicalDocument'
import {
  buildDocumentoVerificacaoUrl,
  generateCodigoVerificacaoDocumento,
} from './codigoVerificacao'
import {
  buildFonoaudiologoAtestadoDeclarationLines,
  buildFonoaudiologoDeclaracaoComparecimentoLines,
  buildFonoaudiologoEncaminhamentoSections,
  buildFonoaudiologoLaudoSections,
  buildFonoaudiologoParecerSections,
  buildFonoaudiologoPlanoTerapeuticoSections,
  buildFonoaudiologoRelatorioSections,
  buildFonoaudiologoResultadoAvaliacaoSections,
} from './fonoaudiologoLines'

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

export function buildFonoaudiologoDeclaracaoComparecimentoClinicalDocumentPayload(input: {
  context: ClinicalDocumentContext
  declaracaoComparecimentoFonoaudiologico: FonoaudiologoDeclaracaoComparecimentoPdfData
}): ClinicalDocumentPayload {
  const lines = buildFonoaudiologoDeclaracaoComparecimentoLines(
    input.context.patientName,
    input.declaracaoComparecimentoFonoaudiologico,
    formatBrazilianDateLabel,
  )
  return buildPayloadBase('declaracao_comparecimento_fonoaudiologico', input.context, [
    { title: 'Declaração', lines },
  ])
}

export function buildFonoaudiologoRelatorioClinicalDocumentPayload(input: {
  context: ClinicalDocumentContext
  relatorioFonoaudiologico: FonoaudiologoRelatorioPdfData
}): ClinicalDocumentPayload {
  return buildPayloadBase(
    'relatorio_fonoaudiologico',
    input.context,
    buildFonoaudiologoRelatorioSections(input.relatorioFonoaudiologico),
  )
}

export function buildFonoaudiologoLaudoClinicalDocumentPayload(input: {
  context: ClinicalDocumentContext
  laudoFonoaudiologico: FonoaudiologoLaudoPdfData
}): ClinicalDocumentPayload {
  return buildPayloadBase(
    'laudo_fonoaudiologico',
    input.context,
    buildFonoaudiologoLaudoSections(input.laudoFonoaudiologico),
  )
}

export function buildFonoaudiologoParecerClinicalDocumentPayload(input: {
  context: ClinicalDocumentContext
  parecerFonoaudiologico: FonoaudiologoParecerPdfData
}): ClinicalDocumentPayload {
  return buildPayloadBase(
    'parecer_fonoaudiologico',
    input.context,
    buildFonoaudiologoParecerSections(input.parecerFonoaudiologico),
  )
}

export function buildFonoaudiologoAtestadoClinicalDocumentPayload(input: {
  context: ClinicalDocumentContext
  atestadoFonoaudiologico: FonoaudiologoAtestadoPdfData
}): ClinicalDocumentPayload {
  const lines = buildFonoaudiologoAtestadoDeclarationLines(
    input.context.patientName,
    input.atestadoFonoaudiologico,
    formatBrazilianDateLabel,
    addDaysToIsoDate,
  )
  return buildPayloadBase('atestado_fonoaudiologico', input.context, [{ title: 'Declaração', lines }])
}

export function buildFonoaudiologoPlanoTerapeuticoClinicalDocumentPayload(input: {
  context: ClinicalDocumentContext
  planoTerapeuticoFonoaudiologico: FonoaudiologoPlanoTerapeuticoPdfData
}): ClinicalDocumentPayload {
  return buildPayloadBase(
    'plano_terapeutico_fonoaudiologico',
    input.context,
    buildFonoaudiologoPlanoTerapeuticoSections(input.planoTerapeuticoFonoaudiologico),
  )
}

export function buildFonoaudiologoResultadoAvaliacaoClinicalDocumentPayload(input: {
  context: ClinicalDocumentContext
  resultadoAvaliacaoFonoaudiologico: FonoaudiologoResultadoAvaliacaoPdfData
}): ClinicalDocumentPayload {
  return buildPayloadBase(
    'resultado_avaliacao_fonoaudiologico',
    input.context,
    buildFonoaudiologoResultadoAvaliacaoSections(input.resultadoAvaliacaoFonoaudiologico),
  )
}

export function buildFonoaudiologoEncaminhamentoClinicalDocumentPayload(input: {
  context: ClinicalDocumentContext
  encaminhamentoFonoaudiologico: FonoaudiologoEncaminhamentoPdfData
}): ClinicalDocumentPayload {
  return buildPayloadBase(
    'encaminhamento_fonoaudiologico',
    input.context,
    buildFonoaudiologoEncaminhamentoSections(input.encaminhamentoFonoaudiologico),
    input.encaminhamentoFonoaudiologico.prioridade === 'urgente',
  )
}
