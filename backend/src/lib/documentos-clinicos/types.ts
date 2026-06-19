export type ClinicalDocumentKind =
  | 'receita'
  | 'pedido_exame'
  | 'atestado'
  | 'encaminhamento'
  | 'relatorio'
  | 'laudo'
  | 'avaliacao_presencial'
  | 'internacao'

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
