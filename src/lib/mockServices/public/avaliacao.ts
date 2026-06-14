import type { PatientConsultationFeedback } from '../../../components/attendance/patient/patientConsultationFeedbackTypes'
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

export type PublicAvaliacaoSessao = {
  token: string
  consultaId: string
  consultaStatus: string
  doctorName: string
  doctorSpecialty: string
  doctorPhotoUrl: string | null
  avaliacaoEnviada: boolean
}

const DEFAULT_DOCTOR_PHOTO =
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=800&q=80'

const sessaoState = new Map<string, PublicAvaliacaoSessao>()
const avaliacaoState = new Set<string>()

function buildSessao(token: string): PublicAvaliacaoSessao {
  const waiting = readWaitingRoomSession()

  return {
    token,
    consultaId: `consulta-${token}`,
    consultaStatus: 'concluida',
    doctorName: waiting?.professional ?? 'Dr. João Pedro Santos',
    doctorSpecialty: waiting?.specialty ?? 'Clínica Geral',
    doctorPhotoUrl: DEFAULT_DOCTOR_PHOTO,
    avaliacaoEnviada: avaliacaoState.has(token),
  }
}

function getSessao(token: string): PublicAvaliacaoSessao {
  const existing = sessaoState.get(token)
  if (existing) return existing
  const created = buildSessao(token)
  sessaoState.set(token, created)
  return created
}

export async function fetchPublicAvaliacaoSessao(token: string) {
  if (!token.trim()) {
    throw new PublicAtendimentoApiError('Sessão não encontrada.', 404, 'NOT_FOUND')
  }
  return mockDelay(getSessao(token))
}

export async function registrarPublicAvaliacaoDetalhada(
  token: string,
  _feedback: PatientConsultationFeedback,
) {
  if (!token.trim()) {
    throw new PublicAtendimentoApiError('Sessão não encontrada.', 404, 'NOT_FOUND')
  }

  if (avaliacaoState.has(token)) {
    throw new PublicAtendimentoApiError(
      'Avaliação já registrada para este atendimento.',
      409,
      'ALREADY_RATED',
    )
  }

  avaliacaoState.add(token)
  const sessao = getSessao(token)
  sessaoState.set(token, { ...sessao, avaliacaoEnviada: true })
  return mockDelay(undefined)
}
