import type { ConsultationChatMessage } from '../../../components/attendance/consultationChatTypes'
import type { ConsultationDocumentItem } from '../../../components/attendance/ConsultationDocumentsPanel'
import type { AttendanceSession } from '../../../data/attendanceSession'
import { CONSULTATION_CHAT_MOCK } from '../../../data/consultationChatMock'
import { readWaitingRoomSession } from '../../../data/waitingRoomSession'
import { mockDelay } from '../delay'

export class PublicAtendimentoApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'PublicAtendimentoApiError'
    this.status = status
    this.code = code
  }
}

export function isPublicAtendimentoApiError(error: unknown): error is PublicAtendimentoApiError {
  return error instanceof PublicAtendimentoApiError
}

export type PublicFilaStatus = {
  position: number
  total: number
  status: 'aguardando' | 'chamado' | 'em_atendimento' | 'finalizado' | 'desistiu' | 'sem_fila'
  estimatedMinutes: number
  readyForConsultation: boolean
}

export type PublicAtendimentoSessao = {
  token: string
  consultaId: string
  consultaStatus: string
  patientName: string
  patientAge: number
  patientCity: string
  patientCpfMasked: string
  specialty: string
  unitName: string
  doctorName: string
  doctorSpecialty: string
  appointmentDateLabel: string
  appointmentTimeLabel: string
  startedAtIso: string
  quickNotes: string
  consultationDocuments: Array<{
    id: string
    title: string
    type: string
    origin: 'paciente' | 'profissional'
    signedAtLabel?: string
  }>
  fila: PublicFilaStatus
  readyForConsultation: boolean
  avaliacaoEnviada: boolean
}

export type PublicMensagem = {
  id: string
  from: 'doctor' | 'patient' | 'system'
  time: string
  text: string
  attachmentUrl?: string
  attachmentName?: string
  attachmentSize?: number
  attachmentType?: 'image' | 'pdf'
}

const DEFAULT_DOCTOR_PHOTO =
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=800&q=80'
const DEFAULT_PATIENT_PHOTO =
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80'

const filaState = new Map<string, PublicFilaStatus>()
const sessaoState = new Map<string, PublicAtendimentoSessao>()
const avaliacaoState = new Set<string>()
const mensagensPacienteState = new Map<string, PublicMensagem[]>()
let nextMensagemId = 5000

function formatChatTime(date = new Date()) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function defaultFila(waiting = readWaitingRoomSession()): PublicFilaStatus {
  return {
    position: waiting?.queuePosition ?? 1,
    total: waiting?.queueTotal ?? 1,
    status: 'chamado',
    estimatedMinutes: waiting?.estimatedMinutes ?? 3,
    readyForConsultation: true,
  }
}

function defaultConsultationDocuments(signedAtLabel: string) {
  return [
    {
      id: 'doc-receita-mock',
      title: 'Receita Médica',
      type: 'receita',
      origin: 'profissional' as const,
      signedAtLabel,
    },
    {
      id: 'doc-exame-mock',
      title: 'Pedido de Exames',
      type: 'pedido_exame',
      origin: 'profissional' as const,
      signedAtLabel,
    },
  ]
}

function buildSessao(token: string): PublicAtendimentoSessao {
  const waiting = readWaitingRoomSession()
  const now = new Date()
  const fila = filaState.get(token) ?? defaultFila(waiting)
  const appointmentTimeLabel = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now)

  return {
    token,
    consultaId: `consulta-${token}`,
    consultaStatus: fila.readyForConsultation ? 'em_andamento' : 'aguardando_medico',
    patientName: waiting?.patientName ?? 'Juliana Silva',
    patientAge: 28,
    patientCity: 'Campinas, SP',
    patientCpfMasked: '123.456.789-**',
    specialty: waiting?.specialty ?? 'Clínica Geral',
    unitName: waiting?.unitName ?? 'UBT Centro',
    doctorName: waiting?.professional ?? 'Dr. João Pedro Santos',
    doctorSpecialty: waiting?.specialty ?? 'Clínica Geral',
    appointmentDateLabel: new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(now),
    appointmentTimeLabel,
    startedAtIso: now.toISOString(),
    quickNotes: 'Paciente relata dor de cabeça leve desde ontem, sem febre no momento.',
    consultationDocuments: defaultConsultationDocuments(appointmentTimeLabel),
    fila,
    readyForConsultation: fila.readyForConsultation,
    avaliacaoEnviada: avaliacaoState.has(token),
  }
}

function getSessao(token: string): PublicAtendimentoSessao {
  const existing = sessaoState.get(token)
  if (existing) return existing
  const created = buildSessao(token)
  sessaoState.set(token, created)
  return created
}

export async function fetchPublicAtendimentoSessao(token: string) {
  if (!token.trim()) {
    throw new PublicAtendimentoApiError('Sessão não encontrada.', 404, 'NOT_FOUND')
  }
  return mockDelay(getSessao(token))
}

export async function fetchPublicFilaStatus(token: string) {
  const sessao = getSessao(token)
  return mockDelay(sessao.fila)
}

export async function entrarPublicSalaEspera(token: string) {
  const fila: PublicFilaStatus = {
    position: 1,
    total: 5,
    status: 'chamado',
    estimatedMinutes: 3,
    readyForConsultation: true,
  }
  filaState.set(token, fila)
  const sessao = { ...getSessao(token), fila, readyForConsultation: true, consultaStatus: 'em_andamento' }
  sessaoState.set(token, sessao)
  return mockDelay(fila)
}

async function resolvePersistedAttachmentUrl(url: string): Promise<string> {
  if (!url.startsWith('blob:')) return url

  const response = await fetch(url)
  const blob = await response.blob()

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

function chatToPublicMessages(): PublicMensagem[] {
  return CONSULTATION_CHAT_MOCK.flatMap((message) => {
    if (message.attachments?.length) {
      return message.attachments.map((attachment) => ({
        id: `${message.id}-${attachment.id}`,
        from: message.from === 'doctor' ? ('doctor' as const) : ('patient' as const),
        time: message.time,
        text: '',
        attachmentUrl: attachment.url,
        attachmentName: attachment.name,
        attachmentSize: attachment.size,
        attachmentType: attachment.type,
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

export async function fetchPublicMensagens(token: string) {
  const sentByPatient = mensagensPacienteState.get(token) ?? []
  return mockDelay([...chatToPublicMessages(), ...sentByPatient])
}

export async function sendPublicMensagemPaciente(
  token: string,
  payload:
    | { text: string }
    | {
        attachment: {
          url: string
          name: string
          size?: number
          type: 'image' | 'pdf'
        }
      },
) {
  if (!token.trim()) {
    throw new PublicAtendimentoApiError('Sessão não encontrada.', 404, 'NOT_FOUND')
  }

  getSessao(token)

  const message: PublicMensagem =
    'text' in payload
      ? {
          id: `msg-pac-${nextMensagemId++}`,
          from: 'patient',
          time: formatChatTime(),
          text: payload.text.trim(),
        }
      : {
          id: `msg-pac-${nextMensagemId++}`,
          from: 'patient',
          time: formatChatTime(),
          text: '',
          attachmentUrl: await resolvePersistedAttachmentUrl(payload.attachment.url),
          attachmentName: payload.attachment.name,
          attachmentSize: payload.attachment.size,
          attachmentType: payload.attachment.type,
        }

  const current = mensagensPacienteState.get(token) ?? []
  mensagensPacienteState.set(token, [...current, message])
  return mockDelay(structuredClone(message))
}

export async function registrarPublicAvaliacao(
  token: string,
  _nota: number,
  _comentario?: string,
) {
  avaliacaoState.add(token)
  const sessao = getSessao(token)
  sessaoState.set(token, { ...sessao, avaliacaoEnviada: true })
  return mockDelay(undefined)
}

export function mapPublicSessaoToAttendanceSession(sessao: PublicAtendimentoSessao): AttendanceSession {
  return {
    id: sessao.token,
    patientName: sessao.patientName,
    patientBirthDateIso: '',
    patientCity: sessao.patientCity,
    patientCpfMasked: sessao.patientCpfMasked,
    patientPhotoUrl: DEFAULT_PATIENT_PHOTO,
    doctorName: sessao.doctorName,
    doctorSpecialty: sessao.doctorSpecialty,
    doctorCrm: '—',
    doctorPhotoUrl: DEFAULT_DOCTOR_PHOTO,
    doctorVideoPosterUrl: DEFAULT_DOCTOR_PHOTO,
    unitName: sessao.unitName,
    insuranceLabel: 'SUS - Público',
    appointmentDateLabel: sessao.appointmentDateLabel,
    appointmentTimeLabel: sessao.appointmentTimeLabel,
    startedAtIso: sessao.startedAtIso,
    quickNotes: sessao.quickNotes,
    specialty: sessao.specialty,
    consultationDocuments: sessao.consultationDocuments.map(mapPublicDocumento),
  }
}

function mapPublicDocumento(
  doc: PublicAtendimentoSessao['consultationDocuments'][number],
): ConsultationDocumentItem {
  const isPrescription = doc.type === 'receita'
  const isExam = doc.type === 'pedido_exame'
  const signedPrefix = isPrescription ? 'Assinada' : 'Assinado'
  const meta =
    doc.origin === 'profissional' && doc.signedAtLabel
      ? `PDF • ${signedPrefix} às ${doc.signedAtLabel}`
      : doc.origin === 'profissional'
        ? 'Documento do profissional'
        : 'Enviado pelo paciente'

  return {
    id: doc.id,
    title: doc.title,
    meta,
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

export function mapPublicMensagensToChat(messages: PublicMensagem[]): ConsultationChatMessage[] {
  return messages.map((message) => ({
    id: message.id,
    from: message.from === 'patient' ? 'patient' : 'doctor',
    time: message.time,
    text: message.text || undefined,
    attachments:
      message.attachmentUrl && message.attachmentName
        ? [
            {
              id: `${message.id}-att`,
              type:
                message.attachmentType ??
                (message.attachmentName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image'),
              url: message.attachmentUrl,
              name: message.attachmentName,
              size: message.attachmentSize,
            },
          ]
        : undefined,
  }))
}
