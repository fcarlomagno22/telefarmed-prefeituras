import type {
  ClinicalDocumentContext,
  ClinicalDocumentPayload,
  NutritionistDeclaracaoComparecimentoPdfData,
  NutritionistLaudoPdfData,
  NutritionistParecerPdfData,
  NutritionistPedidoExamePdfData,
  NutritionistPlanoAlimentarPdfData,
  NutritionistPrescricaoDieteticaPdfData,
  NutritionistPrescricaoSuplementosPdfData,
  NutritionistRelatorioPdfData,
} from '../../types/clinicalDocument'
import {
  buildDocumentoVerificacaoUrl,
  generateCodigoVerificacaoDocumento,
} from './codigoVerificacao'
import { buildPedidoExameDocumentSections } from './buildClinicalDocumentPayload'
import {
  buildNutritionistDeclaracaoComparecimentoLines,
  buildNutritionistLaudoSections,
  buildNutritionistParecerSections,
  buildNutritionistPlanoAlimentarSections,
  buildNutritionistPrescricaoDieteticaSections,
  buildNutritionistPrescricaoSuplementosSections,
  buildNutritionistRelatorioSections,
} from './nutricionistaLines'

function formatBrazilianDateLabel(isoDate: string): string {
  const parts = isoDate.split('-')
  if (parts.length !== 3) return isoDate
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function buildPayloadBase(
  kind: ClinicalDocumentPayload['kind'],
  context: ClinicalDocumentContext,
  sections: ClinicalDocumentPayload['sections'],
): ClinicalDocumentPayload {
  const codigoVerificacao = generateCodigoVerificacaoDocumento()
  return {
    kind,
    context,
    sections,
    codigoVerificacao,
    verificationUrl: buildDocumentoVerificacaoUrl(codigoVerificacao, context.entidadeSlug),
  }
}

export function buildNutritionistPlanoAlimentarClinicalDocumentPayload(input: {
  context: ClinicalDocumentContext
  planoAlimentar: NutritionistPlanoAlimentarPdfData
}): ClinicalDocumentPayload {
  return buildPayloadBase(
    'plano_alimentar',
    input.context,
    buildNutritionistPlanoAlimentarSections(input.planoAlimentar),
  )
}

export function buildNutritionistPrescricaoDieteticaClinicalDocumentPayload(input: {
  context: ClinicalDocumentContext
  prescricaoDietetica: NutritionistPrescricaoDieteticaPdfData
}): ClinicalDocumentPayload {
  return buildPayloadBase(
    'prescricao_dietetica',
    input.context,
    buildNutritionistPrescricaoDieteticaSections(input.prescricaoDietetica),
  )
}

export function buildNutritionistPrescricaoSuplementosClinicalDocumentPayload(input: {
  context: ClinicalDocumentContext
  prescricaoSuplementos: NutritionistPrescricaoSuplementosPdfData
}): ClinicalDocumentPayload {
  return buildPayloadBase(
    'prescricao_suplementos',
    input.context,
    buildNutritionistPrescricaoSuplementosSections(input.prescricaoSuplementos),
  )
}

export function buildNutritionistPedidoExameClinicalDocumentPayload(input: {
  context: ClinicalDocumentContext
  pedidoExameNutricional: NutritionistPedidoExamePdfData
}): ClinicalDocumentPayload {
  const codigoVerificacao = generateCodigoVerificacaoDocumento()

  return {
    kind: 'pedido_exame_nutricional',
    context: input.context,
    sections: buildPedidoExameDocumentSections({
      exames: input.pedidoExameNutricional.exames,
      indicacaoClinica: input.pedidoExameNutricional.indicacaoClinica,
    }),
    urgent: input.pedidoExameNutricional.urgent === true,
    codigoVerificacao,
    verificationUrl: buildDocumentoVerificacaoUrl(codigoVerificacao, input.context.entidadeSlug),
  }
}

export function buildNutritionistRelatorioClinicalDocumentPayload(input: {
  context: ClinicalDocumentContext
  relatorioNutricional: NutritionistRelatorioPdfData
}): ClinicalDocumentPayload {
  return buildPayloadBase(
    'relatorio_nutricional',
    input.context,
    buildNutritionistRelatorioSections(input.relatorioNutricional),
  )
}

export function buildNutritionistParecerClinicalDocumentPayload(input: {
  context: ClinicalDocumentContext
  parecerNutricional: NutritionistParecerPdfData
}): ClinicalDocumentPayload {
  return buildPayloadBase(
    'parecer_nutricional',
    input.context,
    buildNutritionistParecerSections(input.parecerNutricional),
  )
}

export function buildNutritionistLaudoClinicalDocumentPayload(input: {
  context: ClinicalDocumentContext
  laudoNutricional: NutritionistLaudoPdfData
}): ClinicalDocumentPayload {
  return buildPayloadBase(
    'laudo_nutricional',
    input.context,
    buildNutritionistLaudoSections(input.laudoNutricional),
  )
}

export function buildNutritionistDeclaracaoComparecimentoClinicalDocumentPayload(input: {
  context: ClinicalDocumentContext
  declaracaoComparecimentoNutricional: NutritionistDeclaracaoComparecimentoPdfData
}): ClinicalDocumentPayload {
  const lines = buildNutritionistDeclaracaoComparecimentoLines(
    input.context.patientName,
    input.declaracaoComparecimentoNutricional,
    formatBrazilianDateLabel,
  )
  return buildPayloadBase('declaracao_comparecimento_nutricional', input.context, [
    { title: 'Declaração', lines },
  ])
}
