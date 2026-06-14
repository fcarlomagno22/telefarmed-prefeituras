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
})

export const emitirAtestadoBodySchema = z.object({
  diasAfastamento: z.number().int().min(1).max(365),
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  cid: z.string().trim().max(20).optional(),
  motivo: z.string().trim().min(1).max(1000),
  observacoes: z.string().trim().max(2000).optional(),
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
