import { z } from 'zod'

const clinicalDocumentContextSchema = z.object({
  entidadeNome: z.string().trim().min(1).max(200),
  unitName: z.string().trim().min(1).max(200),
  specialty: z.string().trim().min(1).max(200),
  patientName: z.string().trim().min(1).max(200),
  patientCpfMasked: z.string().trim().min(1).max(40),
  patientBirthDateLabel: z.string().trim().max(40).optional().default(''),
  patientAddress: z.string().trim().max(300).optional().default(''),
  patientAgeLabel: z.string().trim().max(80).optional().default(''),
  patientCity: z.string().trim().max(120).optional().default(''),
  doctorName: z.string().trim().min(1).max(200),
  doctorSpecialty: z.string().trim().min(1).max(200),
  doctorCrm: z.string().trim().min(1).max(80),
  doctorRqe: z.string().trim().max(40).optional(),
  entidadeLogoUrl: z.string().trim().min(1).max(2048).optional(),
  entidadeSlug: z.string().trim().min(3).max(50).optional(),
})

const prescricaoItemSchema = z.object({
  medicamentoNome: z.string().trim().min(1).max(300),
  dosagem: z.string().trim().max(200).optional(),
  via: z.string().trim().max(120).optional(),
  frequencia: z.string().trim().max(300).optional(),
  duracao: z.string().trim().max(120).optional(),
  observacoes: z.string().trim().max(500).optional(),
})

const exameItemSchema = z.object({
  name: z.string().trim().min(1).max(300),
  exameId: z.string().trim().max(80).optional(),
  observacoes: z.string().trim().max(500).optional(),
})

const atestadoBaseSchema = {
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  cid: z.string().trim().max(20).optional(),
  cidDescricao: z.string().trim().max(500).optional(),
  observacoes: z.string().trim().max(500).optional(),
}

const atestadoSchema = z.discriminatedUnion('tipo', [
  z.object({
    tipo: z.literal('afastamento'),
    diasAfastamento: z.number().int().min(1).max(365),
    motivo: z.string().trim().min(1).max(500),
    ...atestadoBaseSchema,
  }),
  z.object({
    tipo: z.literal('comparecimento'),
    motivo: z.string().trim().max(500).optional(),
    ...atestadoBaseSchema,
  }),
])

const encaminhamentoSchema = z.object({
  specialtyLabel: z.string().trim().min(1).max(200),
  tipoSolicitacao: z.enum([
    'consulta_especializada',
    'retorno',
    'procedimento',
    'avaliacao_cirurgica',
    'segunda_opiniao',
  ]),
  prioridade: z.enum(['eletivo', 'prioritario', 'urgente']),
  motivoEncaminhamento: z.string().trim().min(1).max(4000),
  historiaClinica: z.string().trim().min(1).max(8000),
  exameFisico: z.string().trim().min(1).max(4000),
  hipoteseDiagnostica: z.string().trim().min(1).max(1000),
  cid: z.string().trim().max(20).optional(),
  cidDescricao: z.string().trim().max(500).optional(),
  tratamentosEMedicacoes: z.string().trim().min(1).max(4000),
  examesRealizados: z.string().trim().max(4000).optional(),
  observacoes: z.string().trim().max(4000).optional(),
})

const relatorioSchema = z.object({
  finalidade: z.enum([
    'referencia',
    'resumo_atendimento',
    'contrarreferencia',
    'parecer',
    'administrativo',
  ]),
  destinatario: z.string().trim().max(200).optional(),
  motivoRelatorio: z.string().trim().min(1).max(4000),
  queixaPrincipal: z.string().trim().min(1).max(500),
  historiaDoencaAtual: z.string().trim().min(1).max(8000),
  antecedentesRelevantes: z.string().trim().max(4000).optional(),
  medicacoesEmUso: z.string().trim().max(4000).optional(),
  exameFisico: z.string().trim().min(1).max(4000),
  examesComplementares: z.string().trim().max(4000).optional(),
  hipoteseDiagnostica: z.string().trim().min(1).max(1000),
  cid: z.string().trim().max(20).optional(),
  cidDescricao: z.string().trim().max(500).optional(),
  condutaAdotada: z.string().trim().min(1).max(4000),
  tratamentoEOrientacoes: z.string().trim().max(4000).optional(),
  evolucaoPrognostico: z.string().trim().max(4000).optional(),
  conclusaoParecer: z.string().trim().min(1).max(4000),
  recomendacoes: z.string().trim().max(4000).optional(),
  observacoes: z.string().trim().max(4000).optional(),
})

const laudoSchema = z.object({
  tipoLaudo: z.enum([
    'exame_complementar',
    'condicao_clinica',
    'procedimento',
    'aptidao_inaptidao',
    'pericia_administrativa',
  ]),
  destinatario: z.string().trim().max(200).optional(),
  objetoLaudo: z.string().trim().min(1).max(500),
  solicitacaoOrigem: z.string().trim().max(500).optional(),
  descricaoAchados: z.string().trim().min(1).max(8000),
  correlacaoClinica: z.string().trim().min(1).max(4000),
  discussaoInterpretacao: z.string().trim().max(4000).optional(),
  conclusaoLaudo: z.string().trim().min(1).max(4000),
  cid: z.string().trim().max(20).optional(),
  cidDescricao: z.string().trim().max(500).optional(),
  recomendacoes: z.string().trim().max(4000).optional(),
  limitacoesExame: z.string().trim().max(2000).optional(),
  observacoes: z.string().trim().max(4000).optional(),
})

const avaliacaoPresencialSchema = z.object({
  tipoAvaliacao: z.enum([
    'retorno_presencial',
    'avaliacao_especializada',
    'reavaliacao_clinica',
    'procedimento_presencial',
    'urgencia_presencial',
  ]),
  prioridade: z.enum(['eletivo', 'prioritario', 'urgente']),
  servicoDestino: z.string().trim().min(1).max(200),
  motivoAvaliacao: z.string().trim().min(1).max(4000),
  justificativaPresencial: z.string().trim().min(1).max(4000),
  historiaClinica: z.string().trim().min(1).max(8000),
  exameFisicoRemoto: z.string().trim().min(1).max(4000),
  hipoteseDiagnostica: z.string().trim().min(1).max(1000),
  cid: z.string().trim().max(20).optional(),
  cidDescricao: z.string().trim().max(500).optional(),
  examesRealizados: z.string().trim().max(4000).optional(),
  condutaAdotada: z.string().trim().max(4000).optional(),
  expectativaAvaliacao: z.string().trim().min(1).max(4000),
  observacoes: z.string().trim().max(4000).optional(),
})

const internacaoSchema = z.object({
  tipoInternacao: z.enum([
    'clinica',
    'cirurgica',
    'obstetrica',
    'pediatrica',
    'psiquiatrica',
    'uti',
  ]),
  caraterInternacao: z.enum(['eletiva', 'urgencia', 'emergencia']),
  unidadeDestino: z.string().trim().min(1).max(200),
  motivoInternacao: z.string().trim().min(1).max(4000),
  justificativaClinica: z.string().trim().min(1).max(4000),
  historiaClinica: z.string().trim().min(1).max(8000),
  exameFisico: z.string().trim().min(1).max(4000),
  hipoteseDiagnostica: z.string().trim().min(1).max(1000),
  cid: z.string().trim().max(20).optional(),
  cidDescricao: z.string().trim().max(500).optional(),
  examesComplementares: z.string().trim().max(4000).optional(),
  tratamentosEMedicacoes: z.string().trim().min(1).max(4000),
  condutaAdotada: z.string().trim().max(4000).optional(),
  procedimentoPrincipalPrevisto: z.string().trim().max(500).optional(),
  tempoEstimadoInternacao: z.string().trim().max(200).optional(),
  observacoes: z.string().trim().max(4000).optional(),
})

const psychologistAtestadoSchema = z.discriminatedUnion('tipo', [
  z.object({
    tipo: z.literal('afastamento'),
    diasAfastamento: z.number().int().min(1).max(365),
    dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    motivo: z.string().trim().min(1).max(500),
    observacoes: z.string().trim().max(500).optional(),
  }),
  z.object({
    tipo: z.literal('comparecimento'),
    dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    observacoes: z.string().trim().max(500).optional(),
  }),
])

const psychologistRelatorioSchema = z.object({
  finalidade: z.enum([
    'acompanhamento',
    'encaminhamento',
    'escolar',
    'trabalhista',
    'judicial',
    'outro',
  ]),
  destinatario: z.string().trim().max(200).optional(),
  motivoRelatorio: z.string().trim().min(1).max(4000),
  demandaPsicologica: z.string().trim().min(1).max(4000),
  historiaPsicologica: z.string().trim().min(1).max(8000),
  instrumentosAplicados: z.string().trim().max(4000).optional(),
  avaliacaoPsicologica: z.string().trim().min(1).max(8000),
  hipotesePsicologica: z.string().trim().min(1).max(1000),
  intervencoesRealizadas: z.string().trim().min(1).max(4000),
  evolucao: z.string().trim().max(4000).optional(),
  conclusao: z.string().trim().min(1).max(4000),
  recomendacoes: z.string().trim().max(4000).optional(),
  observacoes: z.string().trim().max(4000).optional(),
})

const psychologistRelatorioMultiprofissionalSchema = z.object({
  destinatario: z.string().trim().max(200).optional(),
  motivoRelatorio: z.string().trim().min(1).max(4000),
  equipeEnvolvida: z.string().trim().min(1).max(4000),
  demandaCompartilhada: z.string().trim().min(1).max(4000),
  contribuicoesProfissionais: z.string().trim().min(1).max(8000),
  sinteseClinica: z.string().trim().min(1).max(4000),
  condutaIntegrada: z.string().trim().min(1).max(4000),
  conclusaoMultiprofissional: z.string().trim().min(1).max(4000),
  recomendacoes: z.string().trim().max(4000).optional(),
  observacoes: z.string().trim().max(4000).optional(),
})

const psychologistLaudoSchema = z.object({
  tipoLaudo: z.enum(['avaliacao_psicologica', 'pericia', 'aptidao', 'acompanhamento', 'outro']),
  destinatario: z.string().trim().max(200).optional(),
  objetoLaudo: z.string().trim().min(1).max(500),
  metodologiaInstrumentos: z.string().trim().min(1).max(4000),
  descricaoAchados: z.string().trim().min(1).max(8000),
  analiseInterpretacao: z.string().trim().min(1).max(4000),
  conclusaoLaudo: z.string().trim().min(1).max(4000),
  recomendacoes: z.string().trim().max(4000).optional(),
  observacoes: z.string().trim().max(4000).optional(),
})

const psychologistParecerSchema = z.object({
  destinatario: z.string().trim().max(200).optional(),
  questaoApresentada: z.string().trim().min(1).max(4000),
  contextoAvaliacao: z.string().trim().min(1).max(4000),
  analiseTecnica: z.string().trim().min(1).max(8000),
  parecerConclusivo: z.string().trim().min(1).max(4000),
  recomendacoes: z.string().trim().max(4000).optional(),
  observacoes: z.string().trim().max(4000).optional(),
})

const psychologistEncaminhamentoSchema = z.object({
  profissionalDestino: z.enum(['medico', 'psiquiatra', 'outro_profissional']),
  destinoLabel: z.string().trim().min(1).max(200),
  prioridade: z.enum(['eletivo', 'prioritario', 'urgente']),
  motivoEncaminhamento: z.string().trim().min(1).max(4000),
  resumoAtendimento: z.string().trim().min(1).max(8000),
  hipotesePsicologica: z.string().trim().min(1).max(1000),
  condutaRealizada: z.string().trim().min(1).max(4000),
  expectativaEncaminhamento: z.string().trim().min(1).max(4000),
  observacoes: z.string().trim().max(4000).optional(),
})

const suplementoItemSchema = z.object({
  nome: z.string().trim().min(1).max(300),
  dosagem: z.string().trim().max(200).optional(),
  frequencia: z.string().trim().max(300).optional(),
  duracao: z.string().trim().max(120).optional(),
  observacoes: z.string().trim().max(500).optional(),
})

const nutritionistPlanoAlimentarRefeicaoItemSchema = z.object({
  alimento: z.string().trim().min(1).max(200),
  quantidade: z.string().trim().min(1).max(200),
})

const nutritionistPlanoAlimentarRefeicaoSchema = z.object({
  tipo: z.enum(['cafe_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar', 'ceia']),
  label: z.string().trim().min(1).max(100),
  itens: z.array(nutritionistPlanoAlimentarRefeicaoItemSchema).min(1).max(30),
})

const nutritionistPlanoAlimentarSchema = z
  .object({
    objetivo: z.string().trim().min(1).max(1000),
    restricoesAlimentares: z.string().trim().max(2000).optional(),
    planoRefeicoes: z.string().trim().max(12000).optional(),
    refeicoes: z.array(nutritionistPlanoAlimentarRefeicaoSchema).min(1).max(6).optional(),
    orientacoesGerais: z.string().trim().max(4000).optional(),
    duracaoPlano: z.string().trim().max(200).optional(),
    observacoes: z.string().trim().max(2000).optional(),
  })
  .refine(
    (data) => Boolean(data.planoRefeicoes?.trim()) || Boolean(data.refeicoes?.length),
    { message: 'Informe ao menos uma refeição do plano alimentar.' },
  )

const nutritionistPrescricaoDieteticaSchema = z.object({
  indicacaoClinica: z.string().trim().min(1).max(4000),
  prescricao: z.string().trim().min(1).max(12000),
  restricoes: z.string().trim().max(4000).optional(),
  observacoes: z.string().trim().max(2000).optional(),
})

const nutritionistPrescricaoSuplementosSchema = z.object({
  indicacaoClinica: z.string().trim().min(1).max(4000),
  suplementos: z.array(suplementoItemSchema).min(1).max(30),
  observacoesGerais: z.string().trim().max(2000).optional(),
})

const nutritionistPedidoExameSchema = z.object({
  indicacaoClinica: z.string().trim().max(4000).optional(),
  exames: z.array(exameItemSchema).min(1).max(50),
  urgent: z.boolean().optional(),
})

const nutritionistRelatorioSchema = z.object({
  finalidade: z.enum([
    'acompanhamento',
    'encaminhamento',
    'escolar',
    'trabalhista',
    'judicial',
    'outro',
  ]),
  destinatario: z.string().trim().max(200).optional(),
  motivoRelatorio: z.string().trim().min(1).max(4000),
  anamneseNutricional: z.string().trim().min(1).max(8000),
  avaliacaoAntropometrica: z.string().trim().min(1).max(4000),
  avaliacaoDietetica: z.string().trim().min(1).max(4000),
  diagnosticoNutricional: z.string().trim().min(1).max(1000),
  intervencaoProposta: z.string().trim().min(1).max(4000),
  conclusao: z.string().trim().min(1).max(4000),
  recomendacoes: z.string().trim().max(4000).optional(),
  observacoes: z.string().trim().max(4000).optional(),
})

const nutritionistParecerSchema = z.object({
  destinatario: z.string().trim().max(200).optional(),
  questaoApresentada: z.string().trim().min(1).max(4000),
  contextoAvaliacao: z.string().trim().min(1).max(4000),
  analiseTecnica: z.string().trim().min(1).max(8000),
  parecerConclusivo: z.string().trim().min(1).max(4000),
  recomendacoes: z.string().trim().max(4000).optional(),
  observacoes: z.string().trim().max(4000).optional(),
})

const nutritionistLaudoSchema = z.object({
  tipoLaudo: z.enum(['avaliacao_nutricional', 'antropometrica', 'dietoterapia', 'pericia', 'outro']),
  destinatario: z.string().trim().max(200).optional(),
  objetoLaudo: z.string().trim().min(1).max(500),
  metodologiaAvaliacao: z.string().trim().min(1).max(4000),
  achados: z.string().trim().min(1).max(8000),
  interpretacao: z.string().trim().min(1).max(4000),
  conclusao: z.string().trim().min(1).max(4000),
  recomendacoes: z.string().trim().max(4000).optional(),
  observacoes: z.string().trim().max(4000).optional(),
})

const nutritionistDeclaracaoComparecimentoSchema = z.object({
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  observacoes: z.string().trim().max(500).optional(),
})

const fonoaudiologoAtestadoSchema = z.discriminatedUnion('tipo', [
  z.object({
    tipo: z.literal('afastamento'),
    diasAfastamento: z.number().int().min(1).max(365),
    dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    motivo: z.string().trim().min(1).max(500),
    observacoes: z.string().trim().max(500).optional(),
  }),
  z.object({
    tipo: z.literal('comparecimento'),
    dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    observacoes: z.string().trim().max(500).optional(),
  }),
])

const fonoaudiologoDeclaracaoComparecimentoSchema = z.object({
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  observacoes: z.string().trim().max(500).optional(),
})

const fonoaudiologoRelatorioSchema = z.object({
  finalidade: z.enum([
    'acompanhamento',
    'encaminhamento',
    'escolar',
    'trabalhista',
    'judicial',
    'outro',
  ]),
  destinatario: z.string().trim().max(200).optional(),
  motivoRelatorio: z.string().trim().min(1).max(4000),
  demandaFonoaudiologica: z.string().trim().min(1).max(4000),
  historiaFonoaudiologica: z.string().trim().min(1).max(8000),
  avaliacaoFonoaudiologica: z.string().trim().min(1).max(8000),
  hipoteseFonoaudiologica: z.string().trim().min(1).max(1000),
  intervencoesRealizadas: z.string().trim().min(1).max(4000),
  evolucao: z.string().trim().max(4000).optional(),
  conclusao: z.string().trim().min(1).max(4000),
  recomendacoes: z.string().trim().max(4000).optional(),
  observacoes: z.string().trim().max(4000).optional(),
})

const fonoaudiologoLaudoSchema = z.object({
  tipoLaudo: z.enum([
    'avaliacao_fonoaudiologica',
    'linguagem',
    'audicao',
    'voz',
    'degluticao',
    'motricidade_orofacial',
    'pericia',
    'outro',
  ]),
  destinatario: z.string().trim().max(200).optional(),
  objetoLaudo: z.string().trim().min(1).max(500),
  metodologiaInstrumentos: z.string().trim().min(1).max(4000),
  descricaoAchados: z.string().trim().min(1).max(8000),
  analiseInterpretacao: z.string().trim().min(1).max(4000),
  conclusaoLaudo: z.string().trim().min(1).max(4000),
  recomendacoes: z.string().trim().max(4000).optional(),
  observacoes: z.string().trim().max(4000).optional(),
})

const fonoaudiologoParecerSchema = z.object({
  destinatario: z.string().trim().max(200).optional(),
  questaoApresentada: z.string().trim().min(1).max(4000),
  contextoAvaliacao: z.string().trim().min(1).max(4000),
  analiseTecnica: z.string().trim().min(1).max(8000),
  parecerConclusivo: z.string().trim().min(1).max(4000),
  recomendacoes: z.string().trim().max(4000).optional(),
  observacoes: z.string().trim().max(4000).optional(),
})

const fonoaudiologoPlanoTerapeuticoSchema = z.object({
  objetivo: z.string().trim().min(1).max(1000),
  diagnosticoFonoaudiologico: z.string().trim().min(1).max(4000),
  metasTerapeuticas: z.string().trim().min(1).max(8000),
  procedimentosOrientacoes: z.string().trim().min(1).max(8000),
  frequenciaDuracao: z.string().trim().max(200).optional(),
  orientacoesGerais: z.string().trim().max(4000).optional(),
  observacoes: z.string().trim().max(2000).optional(),
})

const fonoaudiologoResultadoAvaliacaoSchema = z.object({
  tipoAvaliacao: z.enum([
    'audiologica',
    'linguagem',
    'voz',
    'degluticao',
    'motricidade_orofacial',
    'outro',
  ]),
  nomeExameAvaliacao: z.string().trim().min(1).max(500),
  metodologia: z.string().trim().min(1).max(8000),
  resultados: z.string().trim().min(1).max(8000),
  interpretacao: z.string().trim().min(1).max(4000),
  conclusao: z.string().trim().min(1).max(4000),
  observacoes: z.string().trim().max(2000).optional(),
})

const fonoaudiologoEncaminhamentoSchema = z.object({
  profissionalDestino: z.enum([
    'medico',
    'otorrinolaringologista',
    'neurologista',
    'outro_profissional',
  ]),
  destinoLabel: z.string().trim().min(1).max(200),
  prioridade: z.enum(['eletivo', 'prioritario', 'urgente']),
  motivoEncaminhamento: z.string().trim().min(1).max(4000),
  resumoAtendimento: z.string().trim().min(1).max(8000),
  hipoteseFonoaudiologica: z.string().trim().min(1).max(1000),
  condutaRealizada: z.string().trim().min(1).max(4000),
  expectativaEncaminhamento: z.string().trim().min(1).max(4000),
  observacoes: z.string().trim().max(4000).optional(),
})

export const emitDemoClinicalDocumentBodySchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('receita'),
    context: clinicalDocumentContextSchema,
    medicamentos: z.array(prescricaoItemSchema).min(1).max(30),
    observacoesGerais: z.string().trim().max(1000).optional(),
  }),
  z.object({
    kind: z.literal('pedido_exame'),
    context: clinicalDocumentContextSchema,
    exames: z.array(exameItemSchema).min(1).max(50),
    indicacaoClinica: z.string().trim().max(1000).optional(),
    urgent: z.boolean().optional(),
  }),
  z.object({
    kind: z.literal('atestado'),
    context: clinicalDocumentContextSchema,
    atestado: atestadoSchema,
  }),
  z.object({
    kind: z.literal('encaminhamento'),
    context: clinicalDocumentContextSchema,
    encaminhamento: encaminhamentoSchema,
  }),
  z.object({
    kind: z.literal('relatorio'),
    context: clinicalDocumentContextSchema,
    relatorio: relatorioSchema,
  }),
  z.object({
    kind: z.literal('laudo'),
    context: clinicalDocumentContextSchema,
    laudo: laudoSchema,
  }),
  z.object({
    kind: z.literal('avaliacao_presencial'),
    context: clinicalDocumentContextSchema,
    avaliacaoPresencial: avaliacaoPresencialSchema,
  }),
  z.object({
    kind: z.literal('internacao'),
    context: clinicalDocumentContextSchema,
    internacao: internacaoSchema,
  }),
  z.object({
    kind: z.literal('atestado_psicologico'),
    context: clinicalDocumentContextSchema,
    atestadoPsicologico: psychologistAtestadoSchema,
  }),
  z.object({
    kind: z.literal('relatorio_psicologico'),
    context: clinicalDocumentContextSchema,
    relatorioPsicologico: psychologistRelatorioSchema,
  }),
  z.object({
    kind: z.literal('relatorio_multiprofissional'),
    context: clinicalDocumentContextSchema,
    relatorioMultiprofissional: psychologistRelatorioMultiprofissionalSchema,
  }),
  z.object({
    kind: z.literal('laudo_psicologico'),
    context: clinicalDocumentContextSchema,
    laudoPsicologico: psychologistLaudoSchema,
  }),
  z.object({
    kind: z.literal('parecer_psicologico'),
    context: clinicalDocumentContextSchema,
    parecerPsicologico: psychologistParecerSchema,
  }),
  z.object({
    kind: z.literal('encaminhamento_psicologico'),
    context: clinicalDocumentContextSchema,
    encaminhamentoPsicologico: psychologistEncaminhamentoSchema,
  }),
  z.object({
    kind: z.literal('plano_alimentar'),
    context: clinicalDocumentContextSchema,
    planoAlimentar: nutritionistPlanoAlimentarSchema,
  }),
  z.object({
    kind: z.literal('prescricao_dietetica'),
    context: clinicalDocumentContextSchema,
    prescricaoDietetica: nutritionistPrescricaoDieteticaSchema,
  }),
  z.object({
    kind: z.literal('prescricao_suplementos'),
    context: clinicalDocumentContextSchema,
    prescricaoSuplementos: nutritionistPrescricaoSuplementosSchema,
  }),
  z.object({
    kind: z.literal('pedido_exame_nutricional'),
    context: clinicalDocumentContextSchema,
    pedidoExameNutricional: nutritionistPedidoExameSchema,
  }),
  z.object({
    kind: z.literal('relatorio_nutricional'),
    context: clinicalDocumentContextSchema,
    relatorioNutricional: nutritionistRelatorioSchema,
  }),
  z.object({
    kind: z.literal('parecer_nutricional'),
    context: clinicalDocumentContextSchema,
    parecerNutricional: nutritionistParecerSchema,
  }),
  z.object({
    kind: z.literal('laudo_nutricional'),
    context: clinicalDocumentContextSchema,
    laudoNutricional: nutritionistLaudoSchema,
  }),
  z.object({
    kind: z.literal('declaracao_comparecimento_nutricional'),
    context: clinicalDocumentContextSchema,
    declaracaoComparecimentoNutricional: nutritionistDeclaracaoComparecimentoSchema,
  }),
  z.object({
    kind: z.literal('atestado_fonoaudiologico'),
    context: clinicalDocumentContextSchema,
    atestadoFonoaudiologico: fonoaudiologoAtestadoSchema,
  }),
  z.object({
    kind: z.literal('declaracao_comparecimento_fonoaudiologico'),
    context: clinicalDocumentContextSchema,
    declaracaoComparecimentoFonoaudiologico: fonoaudiologoDeclaracaoComparecimentoSchema,
  }),
  z.object({
    kind: z.literal('relatorio_fonoaudiologico'),
    context: clinicalDocumentContextSchema,
    relatorioFonoaudiologico: fonoaudiologoRelatorioSchema,
  }),
  z.object({
    kind: z.literal('laudo_fonoaudiologico'),
    context: clinicalDocumentContextSchema,
    laudoFonoaudiologico: fonoaudiologoLaudoSchema,
  }),
  z.object({
    kind: z.literal('parecer_fonoaudiologico'),
    context: clinicalDocumentContextSchema,
    parecerFonoaudiologico: fonoaudiologoParecerSchema,
  }),
  z.object({
    kind: z.literal('plano_terapeutico_fonoaudiologico'),
    context: clinicalDocumentContextSchema,
    planoTerapeuticoFonoaudiologico: fonoaudiologoPlanoTerapeuticoSchema,
  }),
  z.object({
    kind: z.literal('resultado_avaliacao_fonoaudiologico'),
    context: clinicalDocumentContextSchema,
    resultadoAvaliacaoFonoaudiologico: fonoaudiologoResultadoAvaliacaoSchema,
  }),
  z.object({
    kind: z.literal('encaminhamento_fonoaudiologico'),
    context: clinicalDocumentContextSchema,
    encaminhamentoFonoaudiologico: fonoaudiologoEncaminhamentoSchema,
  }),
])

export type EmitDemoClinicalDocumentBody = z.infer<typeof emitDemoClinicalDocumentBodySchema>
