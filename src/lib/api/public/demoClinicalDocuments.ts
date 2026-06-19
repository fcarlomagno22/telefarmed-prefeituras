import { API_BASE_URL } from '../config'
import type { ClinicalDocumentKind } from '../../types/clinicalDocument'

export type EmitDemoClinicalDocumentContext = {
  entidadeNome: string
  unitName: string
  specialty: string
  patientName: string
  patientCpfMasked: string
  patientBirthDateLabel?: string
  patientAddress?: string
  patientAgeLabel?: string
  patientCity?: string
  doctorName: string
  doctorSpecialty: string
  doctorCrm: string
  doctorRqe?: string
  entidadeLogoUrl?: string
  entidadeSlug?: string
}

export type EmitDemoClinicalDocumentResponse = {
  pdfBase64: string
  codigoVerificacao: string
  verificationUrl: string
  titulo: string
  fileName: string
  metaLabel: string
  signedAtLabel: string
  kind: ClinicalDocumentKind
}

export type EmitDemoReceitaBody = {
  kind: 'receita'
  context: EmitDemoClinicalDocumentContext
  medicamentos: Array<{
    medicamentoNome: string
    dosagem?: string
    via?: string
    frequencia?: string
    duracao?: string
    observacoes?: string
  }>
  observacoesGerais?: string
}

export type EmitDemoPedidoExameBody = {
  kind: 'pedido_exame'
  context: EmitDemoClinicalDocumentContext
  exames: Array<{
    name: string
    exameId?: string
    observacoes?: string
  }>
  indicacaoClinica?: string
  urgent?: boolean
}

export type EmitDemoAtestadoBody = {
  kind: 'atestado'
  context: EmitDemoClinicalDocumentContext
  atestado: {
    tipo: 'afastamento' | 'comparecimento'
    diasAfastamento?: number
    dataInicio: string
    cid?: string
    cidDescricao?: string
    motivo?: string
    observacoes?: string
  }
}

export type EmitDemoEncaminhamentoBody = {
  kind: 'encaminhamento'
  context: EmitDemoClinicalDocumentContext
  encaminhamento: {
    specialtyLabel: string
    tipoSolicitacao:
      | 'consulta_especializada'
      | 'retorno'
      | 'procedimento'
      | 'avaliacao_cirurgica'
      | 'segunda_opiniao'
    prioridade: 'eletivo' | 'prioritario' | 'urgente'
    motivoEncaminhamento: string
    historiaClinica: string
    exameFisico: string
    hipoteseDiagnostica: string
    cid?: string
    cidDescricao?: string
    tratamentosEMedicacoes: string
    examesRealizados?: string
    observacoes?: string
  }
}

export type EmitDemoRelatorioBody = {
  kind: 'relatorio'
  context: EmitDemoClinicalDocumentContext
  relatorio: {
    finalidade:
      | 'referencia'
      | 'resumo_atendimento'
      | 'contrarreferencia'
      | 'parecer'
      | 'administrativo'
    destinatario?: string
    motivoRelatorio: string
    queixaPrincipal: string
    historiaDoencaAtual: string
    antecedentesRelevantes?: string
    medicacoesEmUso?: string
    exameFisico: string
    examesComplementares?: string
    hipoteseDiagnostica: string
    cid?: string
    cidDescricao?: string
    condutaAdotada: string
    tratamentoEOrientacoes?: string
    evolucaoPrognostico?: string
    conclusaoParecer: string
    recomendacoes?: string
    observacoes?: string
  }
}

export type EmitDemoLaudoBody = {
  kind: 'laudo'
  context: EmitDemoClinicalDocumentContext
  laudo: {
    tipoLaudo:
      | 'exame_complementar'
      | 'condicao_clinica'
      | 'procedimento'
      | 'aptidao_inaptidao'
      | 'pericia_administrativa'
    destinatario?: string
    objetoLaudo: string
    solicitacaoOrigem?: string
    descricaoAchados: string
    correlacaoClinica: string
    discussaoInterpretacao?: string
    conclusaoLaudo: string
    cid?: string
    cidDescricao?: string
    recomendacoes?: string
    limitacoesExame?: string
    observacoes?: string
  }
}

export type EmitDemoAvaliacaoPresencialBody = {
  kind: 'avaliacao_presencial'
  context: EmitDemoClinicalDocumentContext
  avaliacaoPresencial: {
    tipoAvaliacao:
      | 'retorno_presencial'
      | 'avaliacao_especializada'
      | 'reavaliacao_clinica'
      | 'procedimento_presencial'
      | 'urgencia_presencial'
    prioridade: 'eletivo' | 'prioritario' | 'urgente'
    servicoDestino: string
    motivoAvaliacao: string
    justificativaPresencial: string
    historiaClinica: string
    exameFisicoRemoto: string
    hipoteseDiagnostica: string
    cid?: string
    cidDescricao?: string
    examesRealizados?: string
    condutaAdotada?: string
    expectativaAvaliacao: string
    observacoes?: string
  }
}

export type EmitDemoInternacaoBody = {
  kind: 'internacao'
  context: EmitDemoClinicalDocumentContext
  internacao: {
    tipoInternacao:
      | 'clinica'
      | 'cirurgica'
      | 'obstetrica'
      | 'pediatrica'
      | 'psiquiatrica'
      | 'uti'
    caraterInternacao: 'eletiva' | 'urgencia' | 'emergencia'
    unidadeDestino: string
    motivoInternacao: string
    justificativaClinica: string
    historiaClinica: string
    exameFisico: string
    hipoteseDiagnostica: string
    cid?: string
    cidDescricao?: string
    examesComplementares?: string
    tratamentosEMedicacoes: string
    condutaAdotada?: string
    procedimentoPrincipalPrevisto?: string
    tempoEstimadoInternacao?: string
    observacoes?: string
  }
}

export type EmitDemoClinicalDocumentBody =
  | EmitDemoReceitaBody
  | EmitDemoPedidoExameBody
  | EmitDemoAtestadoBody
  | EmitDemoEncaminhamentoBody
  | EmitDemoRelatorioBody
  | EmitDemoLaudoBody
  | EmitDemoAvaliacaoPresencialBody
  | EmitDemoInternacaoBody

export async function apiEmitDemoClinicalDocument(
  body: EmitDemoClinicalDocumentBody,
): Promise<EmitDemoClinicalDocumentResponse> {
  const response = await fetch(`${API_BASE_URL}/public/demo/documentos-clinicos/emitir`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(payload?.error ?? 'Não foi possível gerar o PDF do documento.')
  }

  return (await response.json()) as EmitDemoClinicalDocumentResponse
}
