export type ClinicalDocumentKind =
  | 'receita'
  | 'pedido_exame'
  | 'atestado'
  | 'encaminhamento'
  | 'relatorio'
  | 'laudo'
  | 'avaliacao_presencial'
  | 'internacao'
  | 'atestado_psicologico'
  | 'relatorio_psicologico'
  | 'relatorio_multiprofissional'
  | 'laudo_psicologico'
  | 'parecer_psicologico'
  | 'encaminhamento_psicologico'
  | 'plano_alimentar'
  | 'prescricao_dietetica'
  | 'prescricao_suplementos'
  | 'pedido_exame_nutricional'
  | 'relatorio_nutricional'
  | 'parecer_nutricional'
  | 'laudo_nutricional'
  | 'declaracao_comparecimento_nutricional'
  | 'declaracao_comparecimento_fonoaudiologico'
  | 'relatorio_fonoaudiologico'
  | 'laudo_fonoaudiologico'
  | 'parecer_fonoaudiologico'
  | 'atestado_fonoaudiologico'
  | 'plano_terapeutico_fonoaudiologico'
  | 'resultado_avaliacao_fonoaudiologico'
  | 'encaminhamento_fonoaudiologico'

export type LaudoTipo =
  | 'exame_complementar'
  | 'condicao_clinica'
  | 'procedimento'
  | 'aptidao_inaptidao'
  | 'pericia_administrativa'

export type RelatorioFinalidade =
  | 'referencia'
  | 'resumo_atendimento'
  | 'contrarreferencia'
  | 'parecer'
  | 'administrativo'

export type EncaminhamentoTipoSolicitacao =
  | 'consulta_especializada'
  | 'retorno'
  | 'procedimento'
  | 'avaliacao_cirurgica'
  | 'segunda_opiniao'

export type EncaminhamentoPrioridade = 'eletivo' | 'prioritario' | 'urgente'

export type ClinicalDocumentContext = {
  entidadeNome: string
  unitName: string
  specialty: string
  patientName: string
  patientCpfMasked: string
  patientBirthDateLabel: string
  patientAddress: string
  patientAgeLabel?: string
  patientCity?: string
  doctorName: string
  doctorSpecialty: string
  doctorCrm: string
  doctorRqe: string
  emitidoEmLabel: string
  emitidoEmIso: string
  entidadeLogoBuffer?: Buffer | null
  entidadeSlug?: string
}

export type ClinicalDocumentSection = {
  title: string
  lines: string[]
}

export type ClinicalDocumentPayload = {
  kind: ClinicalDocumentKind
  context: ClinicalDocumentContext
  sections: ClinicalDocumentSection[]
  footerNote?: string
  urgent?: boolean
  codigoVerificacao: string
  verificationUrl: string
}

export type PrescricaoPdfItem = {
  medicamentoNome: string
  dosagem?: string
  via?: string
  frequencia?: string
  duracao?: string
  observacoes?: string
}

export type ExamePdfItem = {
  name: string
  exameId?: string
  observacoes?: string
}

export type AtestadoTipo = 'afastamento' | 'comparecimento'

export type AtestadoPdfData = {
  tipo: AtestadoTipo
  diasAfastamento?: number
  dataInicio: string
  cid?: string
  cidDescricao?: string
  motivo?: string
  observacoes?: string
}

export type EncaminhamentoPdfData = {
  specialtyLabel: string
  tipoSolicitacao: EncaminhamentoTipoSolicitacao
  prioridade: EncaminhamentoPrioridade
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

export type RelatorioPdfData = {
  finalidade: RelatorioFinalidade
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

export type LaudoPdfData = {
  tipoLaudo: LaudoTipo
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

export type AvaliacaoPresencialTipo =
  | 'retorno_presencial'
  | 'avaliacao_especializada'
  | 'reavaliacao_clinica'
  | 'procedimento_presencial'
  | 'urgencia_presencial'

export type AvaliacaoPresencialPrioridade = 'eletivo' | 'prioritario' | 'urgente'

export type AvaliacaoPresencialPdfData = {
  tipoAvaliacao: AvaliacaoPresencialTipo
  prioridade: AvaliacaoPresencialPrioridade
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

export type InternacaoTipo =
  | 'clinica'
  | 'cirurgica'
  | 'obstetrica'
  | 'pediatrica'
  | 'psiquiatrica'
  | 'uti'

export type InternacaoCarater = 'eletiva' | 'urgencia' | 'emergencia'

export type InternacaoPdfData = {
  tipoInternacao: InternacaoTipo
  caraterInternacao: InternacaoCarater
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

export type PsychologistAtestadoPdfData = {
  tipo: 'afastamento' | 'comparecimento'
  dataInicio: string
  diasAfastamento?: number
  motivo?: string
  observacoes?: string
}

export type PsychologistRelatorioFinalidade =
  | 'acompanhamento'
  | 'encaminhamento'
  | 'escolar'
  | 'trabalhista'
  | 'judicial'
  | 'outro'

export type PsychologistRelatorioPdfData = {
  finalidade: PsychologistRelatorioFinalidade
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

export type PsychologistRelatorioMultiprofissionalPdfData = {
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

export type PsychologistLaudoTipo =
  | 'avaliacao_psicologica'
  | 'pericia'
  | 'aptidao'
  | 'acompanhamento'
  | 'outro'

export type PsychologistLaudoPdfData = {
  tipoLaudo: PsychologistLaudoTipo
  destinatario?: string
  objetoLaudo: string
  metodologiaInstrumentos: string
  descricaoAchados: string
  analiseInterpretacao: string
  conclusaoLaudo: string
  recomendacoes?: string
  observacoes?: string
}

export type PsychologistParecerPdfData = {
  destinatario?: string
  questaoApresentada: string
  contextoAvaliacao: string
  analiseTecnica: string
  parecerConclusivo: string
  recomendacoes?: string
  observacoes?: string
}

export type PsychologistEncaminhamentoDestino = 'medico' | 'psiquiatra' | 'outro_profissional'

export type PsychologistEncaminhamentoPdfData = {
  profissionalDestino: PsychologistEncaminhamentoDestino
  destinoLabel: string
  prioridade: EncaminhamentoPrioridade
  motivoEncaminhamento: string
  resumoAtendimento: string
  hipotesePsicologica: string
  condutaRealizada: string
  expectativaEncaminhamento: string
  observacoes?: string
}

export type NutritionistSuplementoPdfItem = {
  nome: string
  dosagem?: string
  frequencia?: string
  duracao?: string
  observacoes?: string
}

export type NutritionistExamePdfItem = {
  name: string
  observacoes?: string
}

export type NutritionistPlanoAlimentarPdfData = {
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

export type NutritionistPrescricaoDieteticaPdfData = {
  indicacaoClinica: string
  prescricao: string
  restricoes?: string
  observacoes?: string
}

export type NutritionistPrescricaoSuplementosPdfData = {
  indicacaoClinica: string
  suplementos: NutritionistSuplementoPdfItem[]
  observacoesGerais?: string
}

export type NutritionistPedidoExamePdfData = {
  indicacaoClinica?: string
  exames: ExamePdfItem[]
  urgent?: boolean
}

export type NutritionistRelatorioFinalidade =
  | 'acompanhamento'
  | 'encaminhamento'
  | 'escolar'
  | 'trabalhista'
  | 'judicial'
  | 'outro'

export type NutritionistRelatorioPdfData = {
  finalidade: NutritionistRelatorioFinalidade
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

export type NutritionistParecerPdfData = {
  destinatario?: string
  questaoApresentada: string
  contextoAvaliacao: string
  analiseTecnica: string
  parecerConclusivo: string
  recomendacoes?: string
  observacoes?: string
}

export type NutritionistLaudoTipo =
  | 'avaliacao_nutricional'
  | 'antropometrica'
  | 'dietoterapia'
  | 'pericia'
  | 'outro'

export type NutritionistLaudoPdfData = {
  tipoLaudo: NutritionistLaudoTipo
  destinatario?: string
  objetoLaudo: string
  metodologiaAvaliacao: string
  achados: string
  interpretacao: string
  conclusao: string
  recomendacoes?: string
  observacoes?: string
}

export type NutritionistDeclaracaoComparecimentoPdfData = {
  dataInicio: string
  observacoes?: string
}

export type FonoaudiologoAtestadoPdfData = {
  tipo: 'afastamento' | 'comparecimento'
  dataInicio: string
  diasAfastamento?: number
  motivo?: string
  observacoes?: string
}

export type FonoaudiologoDeclaracaoComparecimentoPdfData = {
  dataInicio: string
  observacoes?: string
}

export type FonoaudiologoRelatorioFinalidade =
  | 'acompanhamento'
  | 'encaminhamento'
  | 'escolar'
  | 'trabalhista'
  | 'judicial'
  | 'outro'

export type FonoaudiologoRelatorioPdfData = {
  finalidade: FonoaudiologoRelatorioFinalidade
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

export type FonoaudiologoLaudoTipo =
  | 'avaliacao_fonoaudiologica'
  | 'linguagem'
  | 'audicao'
  | 'voz'
  | 'degluticao'
  | 'motricidade_orofacial'
  | 'pericia'
  | 'outro'

export type FonoaudiologoLaudoPdfData = {
  tipoLaudo: FonoaudiologoLaudoTipo
  destinatario?: string
  objetoLaudo: string
  metodologiaInstrumentos: string
  descricaoAchados: string
  analiseInterpretacao: string
  conclusaoLaudo: string
  recomendacoes?: string
  observacoes?: string
}

export type FonoaudiologoParecerPdfData = {
  destinatario?: string
  questaoApresentada: string
  contextoAvaliacao: string
  analiseTecnica: string
  parecerConclusivo: string
  recomendacoes?: string
  observacoes?: string
}

export type FonoaudiologoPlanoTerapeuticoPdfData = {
  objetivo: string
  diagnosticoFonoaudiologico: string
  metasTerapeuticas: string
  procedimentosOrientacoes: string
  frequenciaDuracao?: string
  orientacoesGerais?: string
  observacoes?: string
}

export type FonoaudiologoResultadoAvaliacaoTipo =
  | 'audiologica'
  | 'linguagem'
  | 'voz'
  | 'degluticao'
  | 'motricidade_orofacial'
  | 'outro'

export type FonoaudiologoResultadoAvaliacaoPdfData = {
  tipoAvaliacao: FonoaudiologoResultadoAvaliacaoTipo
  nomeExameAvaliacao: string
  metodologia: string
  resultados: string
  interpretacao: string
  conclusao: string
  observacoes?: string
}

export type FonoaudiologoEncaminhamentoDestino =
  | 'medico'
  | 'otorrinolaringologista'
  | 'neurologista'
  | 'outro_profissional'

export type FonoaudiologoEncaminhamentoPdfData = {
  profissionalDestino: FonoaudiologoEncaminhamentoDestino
  destinoLabel: string
  prioridade: EncaminhamentoPrioridade
  motivoEncaminhamento: string
  resumoAtendimento: string
  hipoteseFonoaudiologica: string
  condutaRealizada: string
  expectativaEncaminhamento: string
  observacoes?: string
}
