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
])

export type EmitDemoClinicalDocumentBody = z.infer<typeof emitDemoClinicalDocumentBodySchema>
