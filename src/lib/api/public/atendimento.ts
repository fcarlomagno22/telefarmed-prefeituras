import type { ConsultationChatMessage } from '../../../components/attendance/consultationChatTypes'
import { ApiError, apiFetch } from '../http'
import type { ConsultaVideoTokenResponse } from '../consultaVideoToken'
import { mapProfissionalMensagensToChat } from '../profissional/atendimentos'

export type { ConsultaVideoTokenResponse } from '../consultaVideoToken'

export class PublicAtendimentoApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'PublicAtendimentoApiError'
  }
}

function mapError(error: unknown): PublicAtendimentoApiError {
  if (error instanceof ApiError) {
    return new PublicAtendimentoApiError(error.message, error.status, error.code)
  }
  return new PublicAtendimentoApiError('Não foi possível completar a requisição.', 0)
}

export type PublicAvaliacaoSessao = {
  token: string
  consultaId: string
  consultaStatus: string
  doctorName: string
  doctorSpecialty: string
  doctorPhotoUrl: string | null
  avaliacaoEnviada: boolean
}

export type PublicAvaliacaoBody = {
  notaProfissional: number
  comentarioProfissional?: string
  notaTeleconsulta: number
  comentarioTeleconsulta?: string
}

export type PublicMensagemApi = {
  id: string
  from: 'doctor' | 'patient' | 'system'
  time: string
  text: string
  attachmentUrl?: string
  attachmentName?: string
}

export type DocumentoVerificacao = {
  valido: boolean
  codigoVerificacao: string
  tipo: string
  titulo: string
  emitidoEm: string
  emitidoEmLabel: string
  patientName: string
  doctorName: string
  doctorCrm: string
  doctorRqe: string
  doctorSpecialty: string
  entidadeNome: string
  unitName: string
  verificationUrl: string
  downloadUrl: string | null
  hashSha256: string | null
}

export type PublicDocumentoApi = {
  id: string
  kind: string
  title: string
  meta: string
  fileName: string
  signedAtLabel?: string
  downloadUrl?: string
  codigoVerificacao?: string
}

export type PublicFilaStatusApi = {
  position: number
  total: number
  status: 'aguardando' | 'chamado' | 'em_atendimento' | 'finalizado' | 'desistiu' | 'sem_fila'
  estimatedMinutes: number
  readyForConsultation: boolean
}

export type PublicAtendimentoSessaoApi = {
  token: string
  consultaId: string
  consultaStatus: string
  patientName: string
  patientAge: number
  patientCity: string
  patientCpfMasked: string
  patientPhotoUrl: string
  specialty: string
  unitName: string
  doctorName: string
  doctorSpecialty: string
  doctorCrm: string
  doctorPhotoUrl: string
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
  fila: PublicFilaStatusApi
  readyForConsultation: boolean
  avaliacaoEnviada: boolean
}

export async function apiFetchPublicAtendimentoSessao(codigo: string) {
  try {
    return await apiFetch<PublicAtendimentoSessaoApi>(
      `/atendimento/${encodeURIComponent(codigo)}/sessao`,
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function fetchPublicConsultaVideoToken(
  codigo: string,
): Promise<ConsultaVideoTokenResponse> {
  try {
    return await apiFetch<ConsultaVideoTokenResponse>(
      `/atendimento/${encodeURIComponent(codigo)}/video-token`,
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchPublicFilaStatus(codigo: string) {
  try {
    return await apiFetch<PublicFilaStatusApi>(`/atendimento/${encodeURIComponent(codigo)}/fila`)
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiRegistrarPacienteEntradaSalaAtendimento(codigo: string) {
  try {
    await apiFetch<void>(`/atendimento/${encodeURIComponent(codigo)}/entrar-sala-atendimento`, {
      method: 'POST',
    })
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchDocumentoVerificacao(codigo: string) {
  try {
    return await apiFetch<DocumentoVerificacao>(`/atendimento/verificar/${encodeURIComponent(codigo)}`)
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchPublicDocumentos(codigo: string) {
  try {
    const data = await apiFetch<{ documentos: PublicDocumentoApi[] }>(
      `/atendimento/${encodeURIComponent(codigo)}/documentos`,
    )
    return data.documentos
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchPublicDocumentoDownloadUrl(codigo: string, documentId: string) {
  try {
    const data = await apiFetch<{ url: string }>(
      `/atendimento/${encodeURIComponent(codigo)}/documentos/${encodeURIComponent(documentId)}/download`,
    )
    return data.url
  } catch (error) {
    throw mapError(error)
  }
}

export function mapPublicDocumentosToPanel(
  documents: PublicDocumentoApi[],
): import('../../../components/attendance/ConsultationDocumentsPanel').ConsultationDocumentItem[] {
  return documents.map((doc) => {
    const isPrescription = doc.kind === 'receita'
    const isExam = doc.kind === 'pedido_exame'
    const isAtestado = doc.kind === 'atestado'
    const signedPrefix = isPrescription ? 'Assinada' : 'Assinado'
    return {
      id: doc.id,
      title: doc.title,
      meta:
        doc.signedAtLabel && doc.downloadUrl
          ? `PDF • ${signedPrefix} às ${doc.signedAtLabel}`
          : doc.meta,
      downloadUrl: doc.downloadUrl,
      downloadLabel: isPrescription
        ? 'Baixar receita médica'
        : isExam
          ? 'Baixar pedido de exames'
          : isAtestado
            ? 'Baixar atestado médico'
            : 'Baixar documento',
      iconClass: isPrescription
        ? 'bg-red-50 text-red-500'
        : isExam
          ? 'bg-sky-50 text-sky-600'
          : isAtestado
            ? 'bg-amber-50 text-amber-600'
            : 'bg-gray-50 text-gray-500',
    }
  })
}

export async function apiFetchPublicAvaliacaoSessao(codigo: string) {
  try {
    return await apiFetch<PublicAvaliacaoSessao>(`/atendimento/${encodeURIComponent(codigo)}/avaliacao`)
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiRegistrarPublicAvaliacao(codigo: string, body: PublicAvaliacaoBody) {
  try {
    await apiFetch<void>(`/atendimento/${encodeURIComponent(codigo)}/avaliacao`, {
      method: 'POST',
      json: body,
    })
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchPublicMensagens(codigo: string): Promise<PublicMensagemApi[]> {
  try {
    const data = await apiFetch<{ mensagens: PublicMensagemApi[] }>(
      `/atendimento/${encodeURIComponent(codigo)}/mensagens`,
    )
    return data.mensagens
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiEnviarPublicMensagem(codigo: string, conteudo: string): Promise<void> {
  try {
    await apiFetch(`/atendimento/${encodeURIComponent(codigo)}/mensagens`, {
      method: 'POST',
      json: { conteudo },
    })
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiUploadPublicMensagemAnexo(
  codigo: string,
  file: File,
  conteudo?: string,
): Promise<void> {
  const form = new FormData()
  form.append('file', file)
  if (conteudo?.trim()) {
    form.append('conteudo', conteudo.trim())
  }

  try {
    await apiFetch(`/atendimento/${encodeURIComponent(codigo)}/mensagens/upload`, {
      method: 'POST',
      body: form,
    })
  } catch (error) {
    throw mapError(error)
  }
}

export function mapPublicMensagensToChat(messages: PublicMensagemApi[]): ConsultationChatMessage[] {
  return mapProfissionalMensagensToChat(messages)
}

const DEFAULT_DOCTOR_PHOTO =
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=800&q=80'
const DEFAULT_PATIENT_PHOTO =
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80'

export function mapPublicSessaoToAttendanceSession(
  sessao: PublicAtendimentoSessaoApi,
): import('../../../data/attendanceSession').AttendanceSession {
  return {
    id: sessao.token,
    patientName: sessao.patientName,
    patientBirthDateIso: '',
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
    appointmentDateLabel: sessao.appointmentDateLabel,
    appointmentTimeLabel: sessao.appointmentTimeLabel,
    startedAtIso: sessao.startedAtIso,
    quickNotes: sessao.quickNotes,
    specialty: sessao.specialty,
    consultationDocuments: sessao.consultationDocuments.map((doc) => {
      const isPrescription = doc.type === 'receita'
      const isExam = doc.type === 'pedido_exame'
      const isAtestado = doc.type === 'atestado'
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
            : isAtestado
              ? 'Baixar atestado médico'
              : 'Baixar documento',
        iconClass: isPrescription
          ? 'bg-red-50 text-red-500'
          : isExam
            ? 'bg-sky-50 text-sky-600'
            : isAtestado
              ? 'bg-amber-50 text-amber-600'
              : 'bg-gray-50 text-gray-500',
      }
    }),
  }
}

export function isPublicAtendimentoApiError(error: unknown): error is PublicAtendimentoApiError {
  return error instanceof PublicAtendimentoApiError
}
