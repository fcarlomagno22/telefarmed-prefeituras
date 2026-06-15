import {
  POS_CONSULTA_CHECKIN_INTERVAL_DAYS,
} from '../../../config/posConsulta'
import { buildMockPosConsultaCheckinContext } from '../../../data/posConsultaMock'
import type {
  PosConsultaCheckinContext,
  PosConsultaCheckinRespostas,
  PosConsultaSubmitResult,
} from '../../../types/posConsulta'
import { mockDelay } from '../delay'

export class PublicPosConsultaApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'PublicPosConsultaApiError'
    this.status = status
    this.code = code
  }
}

export function isPublicPosConsultaApiError(error: unknown): error is PublicPosConsultaApiError {
  return error instanceof PublicPosConsultaApiError
}

const respondedTokens = new Set<string>()
const submittedAnswers = new Map<string, PosConsultaCheckinRespostas>()

function formatNextCheckinLabel(daysFromNow: number) {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function formatRespondidoEmLabel() {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())
}

export async function fetchPublicPosConsultaCheckin(token: string): Promise<PosConsultaCheckinContext> {
  const trimmed = token.trim()
  if (!trimmed) {
    throw new PublicPosConsultaApiError('Link inválido.', 404, 'NOT_FOUND')
  }

  const base = buildMockPosConsultaCheckinContext(trimmed)
  if (!base) {
    throw new PublicPosConsultaApiError(
      'Este link não é válido ou já expirou. Procure sua unidade de saúde se precisar de ajuda.',
      404,
      'NOT_FOUND',
    )
  }

  if (respondedTokens.has(trimmed)) {
    const respostas = submittedAnswers.get(trimmed)
    return mockDelay({
      ...base,
      status: 'respondido',
      respostas,
      respondidoEmLabel: formatRespondidoEmLabel(),
      nextCheckinLabel: formatNextCheckinLabel(POS_CONSULTA_CHECKIN_INTERVAL_DAYS),
    })
  }

  return mockDelay(base)
}

export async function submitPublicPosConsultaCheckin(
  token: string,
  respostas: PosConsultaCheckinRespostas,
): Promise<PosConsultaSubmitResult> {
  const trimmed = token.trim()
  const context = buildMockPosConsultaCheckinContext(trimmed)

  if (!context) {
    throw new PublicPosConsultaApiError('Link inválido.', 404, 'NOT_FOUND')
  }

  if (context.status === 'expirado') {
    throw new PublicPosConsultaApiError(
      'Este check-in expirou. Aguarde o próximo e-mail de acompanhamento.',
      410,
      'EXPIRED',
    )
  }

  if (respondedTokens.has(trimmed) || context.status === 'respondido') {
    throw new PublicPosConsultaApiError(
      'Este check-in já foi respondido.',
      409,
      'ALREADY_ANSWERED',
    )
  }

  respondedTokens.add(trimmed)
  submittedAnswers.set(trimmed, respostas)

  return mockDelay({
    nextCheckinLabel: formatNextCheckinLabel(POS_CONSULTA_CHECKIN_INTERVAL_DAYS),
  })
}
