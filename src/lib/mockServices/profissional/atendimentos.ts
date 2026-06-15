import type { ConsultationChatMessage } from '../../../components/attendance/consultationChatTypes'
import type { ConsultationDocumentItem } from '../../../components/attendance/ConsultationDocumentsPanel'
import type { DoctorRecordNote } from '../../../components/attendance/doctor/doctorRecordTypes'
import { brand } from '../../../config/brand'
import { PROFISSIONAL_HISTORICO_DEMO_ATENDIMENTO_CODIGO } from '../../../config/profissionalHistoricoDemo'
import { CONSULTATION_CHAT_MOCK } from '../../../data/consultationChatMock'
import {
  getDoctorRecordNotesForSpecialty,
  resolveDoctorRecordSpecialtyKey,
} from '../../../data/doctorConsultationMock'
import type { ExamCatalogItem } from '../../../data/doctorExamRequestMock'
import { EXAM_REQUEST_CATALOG } from '../../../data/doctorExamRequestMock'
import type { AttendanceSession } from '../../../data/attendanceSession'
import {
  profissionalAtendimentosRecords,
} from '../../../data/profissionalAtendimentosMock'
import type {
  ProfissionalAttendanceRecord,
  ProfissionalAtendimentosFilters,
} from '../../../types/profissionalAtendimentos'
import { mockDelay } from '../delay'

export class ProfissionalAtendimentosApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ProfissionalAtendimentosApiError'
    this.status = status
    this.code = code
  }
}

export function isProfissionalAtendimentosApiError(
  error: unknown,
): error is ProfissionalAtendimentosApiError {
  return error instanceof ProfissionalAtendimentosApiError
}

export type ProfissionalConsultaSessao = {
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
  mensagens: Array<{
    id: string
    from: 'doctor' | 'patient' | 'system'
    time: string
    text: string
    attachmentUrl?: string
    attachmentName?: string
  }>
  issuedDocuments: Array<{
    id: string
    kind: string
    title: string
    meta: string
    fileName: string
  }>
  patientUploads: Array<{ id: string; name: string; url: string; mimeType: string }>
}

const DEFAULT_DOCTOR_PHOTO =
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=800&q=80'
const DEFAULT_PATIENT_PHOTO =
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80'

const sessionsState = new Map<string, ProfissionalConsultaSessao>()

function chatMockToApiMessages(): ProfissionalConsultaSessao['mensagens'] {
  return CONSULTATION_CHAT_MOCK.flatMap((message) => {
    if (message.attachments?.length) {
      return message.attachments.map((attachment) => ({
        id: `${message.id}-${attachment.id}`,
        from: message.from === 'doctor' ? ('doctor' as const) : ('patient' as const),
        time: message.time,
        text: '',
        attachmentUrl: attachment.url,
        attachmentName: attachment.name,
      }))
    }
    return [
      {
        id: message.id,
        from: message.from === 'doctor' ? ('doctor' as const) : ('patient' as const),
        time: message.time,
        text: message.text ?? '',
      },
    ]
  })
}

function buildDefaultSession(codigo: string): ProfissionalConsultaSessao {
  const now = new Date()
  const historico = getDoctorRecordNotesForSpecialty('Clínica Médica')
  const isHistoricoDemo = codigo === PROFISSIONAL_HISTORICO_DEMO_ATENDIMENTO_CODIGO

  return {
    consultaId: `consulta-${codigo}`,
    codigoAtendimento: codigo,
    status: 'aguardando_medico',
    patientName: isHistoricoDemo ? 'Maria Souza Lima' : 'Patricia Souza Lima',
    patientBirthDateIso: '1991-08-14',
    patientCity: 'São Paulo, SP',
    patientCpfMasked: '901.234.567-**',
    patientPhotoUrl: isHistoricoDemo
      ? 'https://i.pravatar.cc/150?u=maria-souza-hist'
      : 'https://i.pravatar.cc/150?u=patricia-souza',
    patientAge: 34,
    patientGender: 'F',
    specialty: 'Clínica Médica',
    unitName: 'Teleatendimento',
    doctorName: brand.profissionalOperatorName,
    doctorSpecialty: 'Clínica Médica',
    doctorCrm: '123456/SP',
    doctorPhotoUrl: DEFAULT_DOCTOR_PHOTO,
    startedAtIso: now.toISOString(),
    triageSummary: isHistoricoDemo
      ? 'Motivo: Retorno — controle de IVAS recente\nInício: Há 1 dia\nIntensidade: Leve (2/10)\nSintomas: Tosse residual leve\nPressão arterial: 120/78 mmHg'
      : 'Consulta de retorno — queixa de dor pélvica.',
    notasClinicas: '',
    historicoProntuario: historico.map((note) => ({
      id: note.id,
      date: note.date,
      doctorName: note.doctorName,
      note: note.note,
      specialty: note.specialty,
    })),
    mensagens: chatMockToApiMessages(),
    issuedDocuments: [],
    patientUploads: [
      {
        id: 'up-1',
        name: 'Exame_sangue_marco.pdf',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        mimeType: 'application/pdf',
      },
    ],
  }
}

function getSession(codigo: string): ProfissionalConsultaSessao {
  const existing = sessionsState.get(codigo)
  if (existing) return existing
  const created = buildDefaultSession(codigo)
  sessionsState.set(codigo, created)
  return created
}

function filterRecords(
  filters: ProfissionalAtendimentosFilters,
): ProfissionalAttendanceRecord[] {
  return profissionalAtendimentosRecords.filter((record) => {
    if (filters.specialty && record.specialty !== filters.specialty) return false
    if (filters.status && record.status !== filters.status) return false
    if (filters.generalSearch.trim()) {
      const term = filters.generalSearch.trim().toLowerCase()
      const haystack = `${record.patientName} ${record.attendanceId}`.toLowerCase()
      if (!haystack.includes(term)) return false
    }
    const dateKey = record.dateTimeIso.slice(0, 10)
    if (dateKey < filters.periodStart || dateKey > filters.periodEnd) return false
    return true
  })
}

export async function fetchProfissionalAtendimentosList(
  _accessToken: string,
  filters: ProfissionalAtendimentosFilters,
  page: number,
  pageSize: number,
) {
  const rows = filterRecords(filters)
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(page, 1), totalPages)
  const start = (safePage - 1) * pageSize

  return mockDelay({
    records: rows.slice(start, start + pageSize),
    pagination: { page: safePage, pageSize, total, totalPages },
  })
}

export async function fetchProfissionalAtendimentoDetail(_accessToken: string, id: string) {
  const record = profissionalAtendimentosRecords.find((item) => item.id === id)
  if (!record) {
    throw new ProfissionalAtendimentosApiError('Atendimento não encontrado.', 404, 'NOT_FOUND')
  }

  const historico = getDoctorRecordNotesForSpecialty(record.specialty)
    .filter((note) => !record.recordNotes.some((current) => current.id === note.id))
    .map((note) => ({
      id: note.id,
      date: note.date,
      doctorName: note.doctorName,
      note: note.note,
      specialty: record.specialty,
    }))

  return mockDelay({
    record,
    mensagens: chatMockToApiMessages(),
    historicoProntuario: historico,
  })
}

export async function fetchProfissionalConsultaSessao(_accessToken: string, codigo: string) {
  return mockDelay(getSession(codigo))
}

export async function iniciarProfissionalConsultaPorCodigo(_accessToken: string, codigo: string) {
  const session = getSession(codigo)
  const next = { ...session, status: 'em_andamento' }
  sessionsState.set(codigo, next)
  return mockDelay(next)
}

export async function fetchProfissionalMensagens(_accessToken: string, consultaId: string) {
  const session = [...sessionsState.values()].find((item) => item.consultaId === consultaId)
  return mockDelay(session?.mensagens ?? chatMockToApiMessages())
}

export async function enviarProfissionalMensagem(
  _accessToken: string,
  consultaId: string,
  conteudo: string,
) {
  const session = [...sessionsState.entries()].find(([, item]) => item.consultaId === consultaId)
  if (!session) return mockDelay(undefined)

  const [codigo, current] = session
  const time = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())

  const next = {
    ...current,
    mensagens: [
      ...current.mensagens,
      {
        id: `msg-${Date.now()}`,
        from: 'doctor' as const,
        time,
        text: conteudo,
      },
    ],
  }
  sessionsState.set(codigo, next)
  return mockDelay(undefined)
}

export async function salvarProfissionalNotaProntuario(
  _accessToken: string,
  consultaId: string,
  nota: string,
) {
  const session = [...sessionsState.entries()].find(([, item]) => item.consultaId === consultaId)
  if (!session) {
    throw new ProfissionalAtendimentosApiError('Consulta não encontrada.', 404, 'NOT_FOUND')
  }

  const [codigo, current] = session
  const next = { ...current, notasClinicas: nota }
  sessionsState.set(codigo, next)
  return mockDelay({ notasClinicas: nota })
}

function appendMockDocument(
  consultaId: string,
  doc: ProfissionalConsultaSessao['issuedDocuments'][number],
) {
  const session = [...sessionsState.entries()].find(([, item]) => item.consultaId === consultaId)
  if (!session) return
  const [codigo, current] = session
  sessionsState.set(codigo, {
    ...current,
    issuedDocuments: [...current.issuedDocuments, doc],
  })
}

export async function emitirProfissionalReceitaMock(
  _accessToken: string,
  consultaId: string,
  body: { medicamentos: Array<{ medicamentoNome: string }> },
) {
  const doc = {
    id: `anexo-mock-rx-${Date.now()}`,
    kind: 'receita',
    title: 'Receita médica',
    meta: body.medicamentos.map((item) => item.medicamentoNome).join(', '),
    fileName: 'receita-medica.pdf',
    signedAtLabel: 'agora',
    downloadUrl: '#',
    codigoVerificacao: 'MOCK123456',
  }
  appendMockDocument(consultaId, doc)
  return mockDelay({ documento: doc })
}

export async function emitirProfissionalPedidoExameMock(
  _accessToken: string,
  consultaId: string,
  body: { exames: Array<{ name: string }> },
) {
  const doc = {
    id: `anexo-mock-ex-${Date.now()}`,
    kind: 'pedido_exame',
    title: 'Pedido de exames',
    meta: `${body.exames.length} exame(s)`,
    fileName: 'pedido-exames.pdf',
    signedAtLabel: 'agora',
    downloadUrl: '#',
    codigoVerificacao: 'MOCK654321',
  }
  appendMockDocument(consultaId, doc)
  return mockDelay({ documento: doc })
}

export async function emitirProfissionalAtestadoMock(
  _accessToken: string,
  consultaId: string,
  body: { diasAfastamento: number },
) {
  const doc = {
    id: `anexo-mock-at-${Date.now()}`,
    kind: 'atestado',
    title: `Atestado médico (${body.diasAfastamento} dia(s))`,
    meta: `${body.diasAfastamento} dia(s) de afastamento`,
    fileName: 'atestado-medico.pdf',
    signedAtLabel: 'agora',
    downloadUrl: '#',
    codigoVerificacao: 'MOCKATST12',
  }
  appendMockDocument(consultaId, doc)
  return mockDelay({ documento: doc })
}

export async function registrarProfissionalPrescricao(
  _accessToken: string,
  consultaId: string,
  body: {
    medicamentoNome: string
    dosagem?: string
    via?: string
    frequencia?: string
    duracao?: string
    observacoes?: string
  },
) {
  const session = [...sessionsState.entries()].find(([, item]) => item.consultaId === consultaId)
  if (!session) return mockDelay(undefined)

  const [codigo, current] = session
  const doc = {
    id: `doc-rx-${Date.now()}`,
    kind: 'receita',
    title: 'Receita médica',
    meta: body.medicamentoNome,
    fileName: 'receita-medica.pdf',
  }
  sessionsState.set(codigo, {
    ...current,
    issuedDocuments: [...current.issuedDocuments, doc],
  })
  return mockDelay(undefined)
}

export async function registrarProfissionalSolicitacaoExame(
  _accessToken: string,
  consultaId: string,
  exameId: string,
  _observacoes?: string,
) {
  const session = [...sessionsState.entries()].find(([, item]) => item.consultaId === consultaId)
  if (!session) return mockDelay(undefined)

  const exam = EXAM_REQUEST_CATALOG.find((item) => item.id === exameId)
  const [codigo, current] = session
  const doc = {
    id: `doc-ex-${Date.now()}`,
    kind: 'pedido_exame',
    title: 'Pedido de exames',
    meta: exam?.name ?? 'Exame solicitado',
    fileName: 'pedido-exames.pdf',
  }
  sessionsState.set(codigo, {
    ...current,
    issuedDocuments: [...current.issuedDocuments, doc],
  })
  return mockDelay(undefined)
}

export async function registrarProfissionalAnexoDocumento(
  _accessToken: string,
  consultaId: string,
  body: { tipo: string; titulo: string; arquivoNome?: string },
) {
  const session = [...sessionsState.entries()].find(([, item]) => item.consultaId === consultaId)
  if (!session) {
    throw new ProfissionalAtendimentosApiError('Consulta não encontrada.', 404, 'NOT_FOUND')
  }

  const [codigo, current] = session
  const documento = {
    id: `doc-${Date.now()}`,
    kind: body.tipo,
    title: body.titulo,
    meta: 'Documento emitido',
    fileName: body.arquivoNome ?? `${body.titulo}.pdf`,
  }
  sessionsState.set(codigo, {
    ...current,
    issuedDocuments: [...current.issuedDocuments, documento],
  })
  return mockDelay({ documento })
}

export async function uploadProfissionalAnexo(
  _accessToken: string,
  consultaId: string,
  file: File,
  meta?: { titulo?: string; tipo?: string },
) {
  const session = [...sessionsState.entries()].find(([, item]) => item.consultaId === consultaId)
  if (!session) return mockDelay(undefined)

  const [codigo, current] = session
  const anexo = {
    id: `up-${Date.now()}`,
    name: file.name,
    url: URL.createObjectURL(file),
    mimeType: file.type || 'application/octet-stream',
  }
  sessionsState.set(codigo, {
    ...current,
    patientUploads: [...current.patientUploads, anexo],
    issuedDocuments: meta?.titulo
      ? [
          ...current.issuedDocuments,
          {
            id: `doc-up-${Date.now()}`,
            kind: meta.tipo ?? 'anexo',
            title: meta.titulo,
            meta: file.name,
            fileName: file.name,
          },
        ]
      : current.issuedDocuments,
  })
  return mockDelay(anexo)
}

export async function removerProfissionalAnexo(
  _accessToken: string,
  consultaId: string,
  anexoId: string,
) {
  const session = [...sessionsState.entries()].find(([, item]) => item.consultaId === consultaId)
  if (!session) return mockDelay(undefined)

  const [codigo, current] = session
  sessionsState.set(codigo, {
    ...current,
    patientUploads: current.patientUploads.filter((item) => item.id !== anexoId),
    issuedDocuments: current.issuedDocuments.filter((item) => item.id !== anexoId),
  })
  return mockDelay(undefined)
}

export async function finalizarProfissionalAtendimento(
  _accessToken: string,
  consultaId: string,
  body: { notasClinicas?: string; interrompido?: boolean },
) {
  const session = [...sessionsState.entries()].find(([, item]) => item.consultaId === consultaId)
  if (!session) return mockDelay(undefined)

  const [codigo, current] = session
  sessionsState.set(codigo, {
    ...current,
    status: body.interrompido ? 'interrompido' : 'finalizado',
    notasClinicas: body.notasClinicas ?? current.notasClinicas,
  })
  return mockDelay(undefined)
}

export async function fetchProfissionalFilaAtiva(_accessToken: string) {
  const session = getSession('DEMO-FILA')
  return mockDelay([
    {
      consultaId: session.consultaId,
      codigoAtendimento: session.codigoAtendimento,
      agendaConsultaId: null,
      patientName: session.patientName,
      patientAge: session.patientAge,
      patientCpf: '901.234.567-89',
      specialty: session.specialty,
      ubtName: session.unitName,
      triageReason: session.triageSummary,
      status: session.status,
      inWaitingRoom: session.status === 'aguardando_medico',
      startedAtIso: session.startedAtIso,
    },
  ])
}

export function mapProfissionalSessaoToAttendanceSession(
  sessao: ProfissionalConsultaSessao,
): AttendanceSession {
  return {
    id: sessao.codigoAtendimento,
    patientName: sessao.patientName,
    patientBirthDateIso: sessao.patientBirthDateIso,
    patientCity: sessao.patientCity,
    patientCpfMasked: sessao.patientCpfMasked,
    patientPhotoUrl: sessao.patientPhotoUrl || DEFAULT_PATIENT_PHOTO,
    doctorName: sessao.doctorName,
    doctorSpecialty: sessao.doctorSpecialty,
    doctorCrm: sessao.doctorCrm,
    doctorPhotoUrl: sessao.doctorPhotoUrl || DEFAULT_DOCTOR_PHOTO,
    doctorVideoPosterUrl: sessao.doctorPhotoUrl || DEFAULT_DOCTOR_PHOTO,
    unitName: sessao.unitName,
    insuranceLabel: 'SUS - Público',
    appointmentDateLabel: new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(sessao.startedAtIso)),
    appointmentTimeLabel: new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(sessao.startedAtIso)),
    startedAtIso: sessao.startedAtIso,
    quickNotes: sessao.triageSummary,
    specialty: sessao.specialty,
    consultationDocuments: sessao.issuedDocuments.map(mapIssuedDocument),
  }
}

export function mapIssuedDocument(
  doc: ProfissionalConsultaSessao['issuedDocuments'][number],
): ConsultationDocumentItem {
  const isPrescription = doc.kind === 'receita'
  const isExam = doc.kind === 'pedido_exame'
  return {
    id: doc.id,
    title: doc.title,
    meta: doc.meta || 'Documento emitido',
    downloadLabel: isPrescription
      ? 'Baixar receita médica'
      : isExam
        ? 'Baixar pedido de exames'
        : 'Baixar documento',
    iconClass: isPrescription
      ? 'bg-red-50 text-red-500'
      : isExam
        ? 'bg-sky-50 text-sky-600'
        : 'bg-gray-50 text-gray-500',
  }
}

export function mapProfissionalMensagensToChat(
  messages: Array<{
    id: string
    from: 'doctor' | 'patient' | 'system'
    time: string
    text: string
    attachmentUrl?: string
    attachmentName?: string
  }>,
): ConsultationChatMessage[] {
  return messages
    .filter((message) => message.from !== 'system' || message.text.trim() || message.attachmentUrl)
    .map((message) => ({
      id: message.id,
      from: message.from === 'doctor' ? 'doctor' : 'patient',
      time: message.time,
      text: message.text?.trim() || undefined,
      attachments:
        message.attachmentUrl && message.attachmentName
          ? [
              {
                id: `${message.id}-att`,
                type: message.attachmentName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image',
                url: message.attachmentUrl,
                name: message.attachmentName,
              },
            ]
          : undefined,
    }))
}

export function mapHistoricoToRecordNotes(
  historico: ProfissionalConsultaSessao['historicoProntuario'],
): DoctorRecordNote[] {
  return historico.map((item) => ({
    id: item.id,
    specialty: resolveDoctorRecordSpecialtyKey(item.specialty),
    date: item.date,
    doctorName: item.doctorName,
    note: item.note,
  }))
}

export async function fetchPublicExamCatalog(): Promise<ExamCatalogItem[]> {
  return mockDelay(EXAM_REQUEST_CATALOG)
}

export function formatPatientAgeGender(sessao: ProfissionalConsultaSessao): string {
  const gender = sessao.patientGender === 'F' ? 'Feminino' : 'Masculino'
  return `${sessao.patientAge} anos • ${gender}`
}
