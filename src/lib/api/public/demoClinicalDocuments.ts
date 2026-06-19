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

export type EmitDemoPsychologistAtestadoBody = {
  kind: 'atestado_psicologico'
  context: EmitDemoClinicalDocumentContext
  atestadoPsicologico: {
    tipo: 'afastamento' | 'comparecimento'
    dataInicio: string
    diasAfastamento?: number
    motivo?: string
    observacoes?: string
  }
}

export type EmitDemoPsychologistRelatorioBody = {
  kind: 'relatorio_psicologico'
  context: EmitDemoClinicalDocumentContext
  relatorioPsicologico: {
    finalidade:
      | 'acompanhamento'
      | 'encaminhamento'
      | 'escolar'
      | 'trabalhista'
      | 'judicial'
      | 'outro'
    destinatario?: string
    motivoRelatorio: string
    demandaPsicologica: string
    historiaPsicologica: string
    instrumentosAplicados?: string
    avaliacaoPsicologica: string
    hipotesePsicologica: string
    intervencoesRealizadas: string
    evolucao?: string
    conclusao: string
    recomendacoes?: string
    observacoes?: string
  }
}

export type EmitDemoPsychologistRelatorioMultiprofissionalBody = {
  kind: 'relatorio_multiprofissional'
  context: EmitDemoClinicalDocumentContext
  relatorioMultiprofissional: {
    destinatario?: string
    motivoRelatorio: string
    equipeEnvolvida: string
    demandaCompartilhada: string
    contribuicoesProfissionais: string
    sinteseClinica: string
    condutaIntegrada: string
    conclusaoMultiprofissional: string
    recomendacoes?: string
    observacoes?: string
  }
}

export type EmitDemoPsychologistLaudoBody = {
  kind: 'laudo_psicologico'
  context: EmitDemoClinicalDocumentContext
  laudoPsicologico: {
    tipoLaudo: 'avaliacao_psicologica' | 'pericia' | 'aptidao' | 'acompanhamento' | 'outro'
    destinatario?: string
    objetoLaudo: string
    metodologiaInstrumentos: string
    descricaoAchados: string
    analiseInterpretacao: string
    conclusaoLaudo: string
    recomendacoes?: string
    observacoes?: string
  }
}

export type EmitDemoPsychologistParecerBody = {
  kind: 'parecer_psicologico'
  context: EmitDemoClinicalDocumentContext
  parecerPsicologico: {
    destinatario?: string
    questaoApresentada: string
    contextoAvaliacao: string
    analiseTecnica: string
    parecerConclusivo: string
    recomendacoes?: string
    observacoes?: string
  }
}

export type EmitDemoPsychologistEncaminhamentoBody = {
  kind: 'encaminhamento_psicologico'
  context: EmitDemoClinicalDocumentContext
  encaminhamentoPsicologico: {
    profissionalDestino: 'medico' | 'psiquiatra' | 'outro_profissional'
    destinoLabel: string
    prioridade: 'eletivo' | 'prioritario' | 'urgente'
    motivoEncaminhamento: string
    resumoAtendimento: string
    hipotesePsicologica: string
    condutaRealizada: string
    expectativaEncaminhamento: string
    observacoes?: string
  }
}

export type EmitDemoNutritionistPlanoAlimentarBody = {
  kind: 'plano_alimentar'
  context: EmitDemoClinicalDocumentContext
  planoAlimentar: {
    objetivo: string
    restricoesAlimentares?: string
    planoRefeicoes?: string
    refeicoes?: Array<{
      tipo: 'cafe_manha' | 'lanche_manha' | 'almoco' | 'lanche_tarde' | 'jantar' | 'ceia'
      label: string
      itens: Array<{
        alimento: string
        quantidade: string
      }>
    }>
    orientacoesGerais?: string
    duracaoPlano?: string
    observacoes?: string
  }
}

export type EmitDemoNutritionistPrescricaoDieteticaBody = {
  kind: 'prescricao_dietetica'
  context: EmitDemoClinicalDocumentContext
  prescricaoDietetica: {
    indicacaoClinica: string
    prescricao: string
    restricoes?: string
    observacoes?: string
  }
}

export type EmitDemoNutritionistPrescricaoSuplementosBody = {
  kind: 'prescricao_suplementos'
  context: EmitDemoClinicalDocumentContext
  prescricaoSuplementos: {
    indicacaoClinica: string
    suplementos: Array<{
      nome: string
      dosagem?: string
      frequencia?: string
      duracao?: string
      observacoes?: string
    }>
    observacoesGerais?: string
  }
}

export type EmitDemoNutritionistPedidoExameBody = {
  kind: 'pedido_exame_nutricional'
  context: EmitDemoClinicalDocumentContext
  pedidoExameNutricional: {
    indicacaoClinica?: string
    exames: Array<{
      name: string
      exameId?: string
      observacoes?: string
    }>
    urgent?: boolean
  }
}

export type EmitDemoNutritionistRelatorioBody = {
  kind: 'relatorio_nutricional'
  context: EmitDemoClinicalDocumentContext
  relatorioNutricional: {
    finalidade:
      | 'acompanhamento'
      | 'encaminhamento'
      | 'escolar'
      | 'trabalhista'
      | 'judicial'
      | 'outro'
    destinatario?: string
    motivoRelatorio: string
    anamneseNutricional: string
    avaliacaoAntropometrica: string
    avaliacaoDietetica: string
    diagnosticoNutricional: string
    intervencaoProposta: string
    conclusao: string
    recomendacoes?: string
    observacoes?: string
  }
}

export type EmitDemoNutritionistParecerBody = {
  kind: 'parecer_nutricional'
  context: EmitDemoClinicalDocumentContext
  parecerNutricional: {
    destinatario?: string
    questaoApresentada: string
    contextoAvaliacao: string
    analiseTecnica: string
    parecerConclusivo: string
    recomendacoes?: string
    observacoes?: string
  }
}

export type EmitDemoNutritionistLaudoBody = {
  kind: 'laudo_nutricional'
  context: EmitDemoClinicalDocumentContext
  laudoNutricional: {
    tipoLaudo: 'avaliacao_nutricional' | 'antropometrica' | 'dietoterapia' | 'pericia' | 'outro'
    destinatario?: string
    objetoLaudo: string
    metodologiaAvaliacao: string
    achados: string
    interpretacao: string
    conclusao: string
    recomendacoes?: string
    observacoes?: string
  }
}

export type EmitDemoNutritionistDeclaracaoComparecimentoBody = {
  kind: 'declaracao_comparecimento_nutricional'
  context: EmitDemoClinicalDocumentContext
  declaracaoComparecimentoNutricional: {
    dataInicio: string
    observacoes?: string
  }
}

export type EmitDemoFonoaudiologoDeclaracaoComparecimentoBody = {
  kind: 'declaracao_comparecimento_fonoaudiologico'
  context: EmitDemoClinicalDocumentContext
  declaracaoComparecimentoFonoaudiologico: {
    dataInicio: string
    observacoes?: string
  }
}

export type EmitDemoFonoaudiologoRelatorioBody = {
  kind: 'relatorio_fonoaudiologico'
  context: EmitDemoClinicalDocumentContext
  relatorioFonoaudiologico: {
    finalidade:
      | 'acompanhamento'
      | 'encaminhamento'
      | 'escolar'
      | 'trabalhista'
      | 'judicial'
      | 'outro'
    destinatario?: string
    motivoRelatorio: string
    demandaFonoaudiologica: string
    historiaFonoaudiologica: string
    avaliacaoFonoaudiologica: string
    hipoteseFonoaudiologica: string
    intervencoesRealizadas: string
    evolucao?: string
    conclusao: string
    recomendacoes?: string
    observacoes?: string
  }
}

export type EmitDemoFonoaudiologoLaudoBody = {
  kind: 'laudo_fonoaudiologico'
  context: EmitDemoClinicalDocumentContext
  laudoFonoaudiologico: {
    tipoLaudo:
      | 'avaliacao_fonoaudiologica'
      | 'linguagem'
      | 'audicao'
      | 'voz'
      | 'degluticao'
      | 'motricidade_orofacial'
      | 'pericia'
      | 'outro'
    destinatario?: string
    objetoLaudo: string
    metodologiaInstrumentos: string
    descricaoAchados: string
    analiseInterpretacao: string
    conclusaoLaudo: string
    recomendacoes?: string
    observacoes?: string
  }
}

export type EmitDemoFonoaudiologoParecerBody = {
  kind: 'parecer_fonoaudiologico'
  context: EmitDemoClinicalDocumentContext
  parecerFonoaudiologico: {
    destinatario?: string
    questaoApresentada: string
    contextoAvaliacao: string
    analiseTecnica: string
    parecerConclusivo: string
    recomendacoes?: string
    observacoes?: string
  }
}

export type EmitDemoFonoaudiologoAtestadoBody = {
  kind: 'atestado_fonoaudiologico'
  context: EmitDemoClinicalDocumentContext
  atestadoFonoaudiologico: {
    tipo: 'afastamento' | 'comparecimento'
    dataInicio: string
    diasAfastamento?: number
    motivo?: string
    observacoes?: string
  }
}

export type EmitDemoFonoaudiologoPlanoTerapeuticoBody = {
  kind: 'plano_terapeutico_fonoaudiologico'
  context: EmitDemoClinicalDocumentContext
  planoTerapeuticoFonoaudiologico: {
    objetivo: string
    diagnosticoFonoaudiologico: string
    metasTerapeuticas: string
    procedimentosOrientacoes: string
    frequenciaDuracao?: string
    orientacoesGerais?: string
    observacoes?: string
  }
}

export type EmitDemoFonoaudiologoResultadoAvaliacaoBody = {
  kind: 'resultado_avaliacao_fonoaudiologico'
  context: EmitDemoClinicalDocumentContext
  resultadoAvaliacaoFonoaudiologico: {
    tipoAvaliacao: 'audiologica' | 'linguagem' | 'voz' | 'degluticao' | 'motricidade_orofacial' | 'outro'
    nomeExameAvaliacao: string
    metodologia: string
    resultados: string
    interpretacao: string
    conclusao: string
    observacoes?: string
  }
}

export type EmitDemoFonoaudiologoEncaminhamentoBody = {
  kind: 'encaminhamento_fonoaudiologico'
  context: EmitDemoClinicalDocumentContext
  encaminhamentoFonoaudiologico: {
    profissionalDestino: 'medico' | 'otorrinolaringologista' | 'neurologista' | 'outro_profissional'
    destinoLabel: string
    prioridade: 'eletivo' | 'prioritario' | 'urgente'
    motivoEncaminhamento: string
    resumoAtendimento: string
    hipoteseFonoaudiologica: string
    condutaRealizada: string
    expectativaEncaminhamento: string
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
  | EmitDemoPsychologistAtestadoBody
  | EmitDemoPsychologistRelatorioBody
  | EmitDemoPsychologistRelatorioMultiprofissionalBody
  | EmitDemoPsychologistLaudoBody
  | EmitDemoPsychologistParecerBody
  | EmitDemoPsychologistEncaminhamentoBody
  | EmitDemoNutritionistPlanoAlimentarBody
  | EmitDemoNutritionistPrescricaoDieteticaBody
  | EmitDemoNutritionistPrescricaoSuplementosBody
  | EmitDemoNutritionistPedidoExameBody
  | EmitDemoNutritionistRelatorioBody
  | EmitDemoNutritionistParecerBody
  | EmitDemoNutritionistLaudoBody
  | EmitDemoNutritionistDeclaracaoComparecimentoBody
  | EmitDemoFonoaudiologoDeclaracaoComparecimentoBody
  | EmitDemoFonoaudiologoRelatorioBody
  | EmitDemoFonoaudiologoLaudoBody
  | EmitDemoFonoaudiologoParecerBody
  | EmitDemoFonoaudiologoAtestadoBody
  | EmitDemoFonoaudiologoPlanoTerapeuticoBody
  | EmitDemoFonoaudiologoResultadoAvaliacaoBody
  | EmitDemoFonoaudiologoEncaminhamentoBody

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
