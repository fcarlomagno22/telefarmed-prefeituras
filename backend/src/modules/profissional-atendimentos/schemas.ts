import { z } from 'zod'

export const iniciarConsultaBodySchema = z
  .object({
    agendaConsultaId: z.string().uuid().optional(),
    consultaId: z.string().uuid().optional(),
    plantaoId: z.string().uuid().optional(),
  })
  .refine((value) => Boolean(value.agendaConsultaId || value.consultaId), {
    message: 'Informe agendaConsultaId ou consultaId.',
  })

export const listAtendimentosQuerySchema = z.object({
  generalSearch: z.string().optional().default(''),
  specialty: z.string().optional().default(''),
  status: z.enum(['concluido', 'interrompido', '']).optional().default(''),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(10),
})

export const consultaIdParamSchema = z.object({
  consultaId: z.string().uuid(),
})

export const codigoAtendimentoParamSchema = z.object({
  codigoAtendimento: z.string().min(8).max(64),
})

export const anexoIdParamSchema = z.object({
  consultaId: z.string().uuid(),
  anexoId: z.string().min(1),
})

export const enviarMensagemBodySchema = z.object({
  conteudo: z.string().trim().min(1).max(4000),
})

export const salvarNotasBodySchema = z.object({
  nota: z.string().trim().max(20000),
  modo: z.enum(['adicionar', 'substituir']).optional().default('adicionar'),
})

export const emitirReceitaBodySchema = z.object({
  medicamentos: z
    .array(
      z.object({
        medicamentoNome: z.string().trim().min(1).max(500),
        dosagem: z.string().trim().max(200).optional(),
        via: z.string().trim().max(100).optional(),
        frequencia: z.string().trim().max(200).optional(),
        duracao: z.string().trim().max(200).optional(),
        observacoes: z.string().trim().max(2000).optional(),
      }),
    )
    .min(1)
    .max(20),
  observacoesGerais: z.string().trim().max(2000).optional(),
})

export const emitirPedidoExameBodySchema = z.object({
  exames: z
    .array(
      z.object({
        exameId: z.string().trim().max(64).optional(),
        name: z.string().trim().min(1).max(300),
        observacoes: z.string().trim().max(500).optional(),
      }),
    )
    .min(1)
    .max(40),
  indicacaoClinica: z.string().trim().max(2000).optional(),
  urgent: z.boolean().optional(),
})

export const emitirAtestadoBodySchema = z.discriminatedUnion('tipo', [
  z.object({
    tipo: z.literal('afastamento'),
    diasAfastamento: z.number().int().min(1).max(365),
    dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    cid: z.string().trim().max(20).optional(),
    cidDescricao: z.string().trim().max(500).optional(),
    motivo: z.string().trim().min(1).max(1000),
    observacoes: z.string().trim().max(2000).optional(),
  }),
  z.object({
    tipo: z.literal('comparecimento'),
    dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    cid: z.string().trim().max(20).optional(),
    cidDescricao: z.string().trim().max(500).optional(),
    motivo: z.string().trim().max(1000).optional(),
    observacoes: z.string().trim().max(2000).optional(),
  }),
])

export const emitirEncaminhamentoBodySchema = z.object({
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

export const emitirRelatorioBodySchema = z.object({
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

export const emitirLaudoBodySchema = z.object({
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

export const emitirAvaliacaoPresencialBodySchema = z.object({
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

export const emitirInternacaoBodySchema = z.object({
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

export const registrarPrescricaoBodySchema = z.object({
  medicamentoNome: z.string().trim().min(1).max(500),
  dosagem: z.string().trim().max(200).optional(),
  via: z.string().trim().max(100).optional(),
  frequencia: z.string().trim().max(200).optional(),
  duracao: z.string().trim().max(200).optional(),
  observacoes: z.string().trim().max(2000).optional(),
})

export const registrarSolicitacaoExameBodySchema = z.object({
  exameId: z.string().trim().min(1).max(64),
  observacoes: z.string().trim().max(2000).optional(),
})

export const registrarAnexoBodySchema = z.object({
  tipo: z.enum([
    'receita',
    'pedido_exame',
    'cardapio',
    'plano_alimentar',
    'orientacao',
    'atestado',
    'encaminhamento',
    'relatorio',
    'laudo',
    'avaliacao_presencial',
    'internacao',
    'outro',
  ]),
  titulo: z.string().trim().min(1).max(300),
  arquivoNome: z.string().trim().max(255).optional(),
})

export const finalizarAtendimentoBodySchema = z.object({
  notasClinicas: z.string().trim().max(20000).optional(),
  interrompido: z.boolean().optional().default(false),
})

export type IniciarConsultaBody = z.infer<typeof iniciarConsultaBodySchema>
export type ListAtendimentosQuery = z.infer<typeof listAtendimentosQuerySchema>

export type ConsultaVideoTokenApi = {
  token: string
  roomName: string
  serverUrl: string
}

export type ProfissionalFilaAtivaItemApi = {
  consultaId: string
  codigoAtendimento: string
  agendaConsultaId: string | null
  patientName: string
  patientAge: number
  patientCpf: string
  specialty: string
  ubtName: string
  triageReason: string
  status: string
  inWaitingRoom: boolean
  patientInConsultationRoom: boolean
  startedAtIso: string
}

export type IniciarConsultaResultApi = {
  consultaId: string
  codigoAtendimento: string
  status: string
}

export type ProfissionalIssuedDocumentApi = {
  id: string
  kind:
    | 'receita'
    | 'pedido_exame'
    | 'cardapio'
    | 'plano_alimentar'
    | 'orientacao'
    | 'atestado'
    | 'encaminhamento'
    | 'relatorio'
    | 'laudo'
    | 'avaliacao_presencial'
    | 'internacao'
  title: string
  meta: string
  fileName: string
  signedAtLabel?: string
  downloadUrl?: string
  codigoVerificacao?: string
}

export type ProfissionalRecordNoteApi = {
  id: string
  specialty: string
  date: string
  doctorName: string
  note: string
}

export type ProfissionalPatientUploadApi = {
  id: string
  type: 'pdf' | 'image'
  url: string
  name: string
  size?: number
}

export type ProfissionalAttendanceRecordApi = {
  id: string
  attendanceId: string
  dateTimeIso: string
  dateTimeLabel: string
  patientName: string
  patientPhotoUrl: string
  birthDateIso: string
  age: number
  gender: 'F' | 'M'
  specialty: string
  durationMinutes: number
  status: 'concluido' | 'interrompido'
  triageSummary?: string
  recordNotes: ProfissionalRecordNoteApi[]
  issuedDocuments: ProfissionalIssuedDocumentApi[]
  patientUploads: ProfissionalPatientUploadApi[]
}

export type ProfissionalAtendimentosListApi = {
  records: ProfissionalAttendanceRecordApi[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export type ProfissionalAtendimentoDetailApi = {
  record: ProfissionalAttendanceRecordApi
  mensagens: ProfissionalMensagemApi[]
  historicoProntuario: ProfissionalConsultaSessaoApi['historicoProntuario']
}

export type ProfissionalMensagemApi = {
  id: string
  from: 'doctor' | 'patient' | 'system'
  time: string
  text: string
  attachmentUrl?: string
  attachmentName?: string
}

export type ProfissionalConsultaSessaoApi = {
  consultaId: string
  codigoAtendimento: string
  status: string
  patientName: string
  patientBirthDateIso: string
  patientAddress: string
  patientCity: string
  patientCpfMasked: string
  patientPhotoUrl: string
  patientAge: number
  patientGender: 'F' | 'M'
  specialty: string
  unitName: string
  doctorName: string
  doctorSpecialty: string
  doctorCrm: string
  doctorPhotoUrl: string
  startedAtIso: string
  triageSummary: string
  notasClinicas: string
  historicoProntuario: Array<{
    id: string
    date: string
    doctorName: string
    note: string
    specialty: string
  }>
  mensagens: ProfissionalMensagemApi[]
  issuedDocuments: ProfissionalIssuedDocumentApi[]
  patientUploads: ProfissionalPatientUploadApi[]
}

export type ExamCatalogItemApi = {
  id: string
  name: string
  category: string
}
