import { PLANTAO_ACEITE_DEMO_ESGOTADO_TOKEN, PLANTAO_ACEITE_DEMO_TOKEN } from '../../../config/publicRoutes'
import { profissionalRoutes } from '../../../config/profissionalRoutes'
import {
  plantaoAceitePublicoDemo,
  plantaoAceitePublicoDemoEsgotado,
} from '../../../data/plantaoAceitePublicoMock'
import { profissionalLoggedProfile } from '../../../data/profissionalPerfilMock'
import type {
  PlantaoAceiteConfirmPayload,
  PlantaoAceiteConfirmResult,
  PlantaoAceitePublicoResult,
  PlantaoAceiteReserveResult,
} from '../../../types/plantaoAceitePublico'
import { cpfDigits } from '../../../utils/cpf'

const MOCK_DELAY_MS = 700

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export class PlantaoAceitePublicoApiError extends Error {
  readonly code: string
  readonly status: number

  constructor(message: string, code: string, status: number) {
    super(message)
    this.name = 'PlantaoAceitePublicoApiError'
    this.code = code
    this.status = status
  }
}

export function isPlantaoAceitePublicoApiError(
  error: unknown,
): error is PlantaoAceitePublicoApiError {
  return error instanceof PlantaoAceitePublicoApiError
}

export async function mockFetchPlantaoAceitePublico(
  token: string,
): Promise<PlantaoAceitePublicoResult> {
  await delay(450)

  if (!token.trim()) {
    throw new PlantaoAceitePublicoApiError('Link inválido.', 'INVALID_TOKEN', 400)
  }

  if (token !== PLANTAO_ACEITE_DEMO_TOKEN && token !== PLANTAO_ACEITE_DEMO_ESGOTADO_TOKEN) {
    throw new PlantaoAceitePublicoApiError(
      'Este link de aceite não foi encontrado ou já expirou.',
      'NOT_FOUND',
      404,
    )
  }

  return {
    plantao: token === PLANTAO_ACEITE_DEMO_ESGOTADO_TOKEN
      ? plantaoAceitePublicoDemoEsgotado
      : plantaoAceitePublicoDemo,
  }
}

export async function mockConfirmPlantaoAceitePublico(
  payload: PlantaoAceiteConfirmPayload,
): Promise<PlantaoAceiteConfirmResult> {
  await delay(MOCK_DELAY_MS)

  if (payload.token !== PLANTAO_ACEITE_DEMO_TOKEN) {
    throw new PlantaoAceitePublicoApiError(
      'Este link de aceite não foi encontrado ou já expirou.',
      'NOT_FOUND',
      404,
    )
  }

  const cpf = cpfDigits(payload.cpf)
  const expectedCpf = cpfDigits(profissionalLoggedProfile.cpf)

  if (cpf !== expectedCpf) {
    throw new PlantaoAceitePublicoApiError(
      'CPF não encontrado ou não elegível para este plantão.',
      'CPF_INVALID',
      403,
    )
  }

  if (plantaoAceitePublicoDemo.status !== 'disponivel' || plantaoAceitePublicoDemo.vacancies <= 0) {
    throw new PlantaoAceitePublicoApiError(
      'Não foi possível reservar este plantão.',
      'SLOT_UNAVAILABLE',
      409,
    )
  }

  return {
    plantaoId: 'plantao-demo-001',
    profissionalNome: profissionalLoggedProfile.fullName,
    agendaUrl: profissionalRoutes.agenda,
  }
}

export async function mockCandidatarReservaPlantaoAceitePublico(
  payload: PlantaoAceiteConfirmPayload,
): Promise<PlantaoAceiteReserveResult> {
  await delay(MOCK_DELAY_MS)

  if (payload.token !== PLANTAO_ACEITE_DEMO_ESGOTADO_TOKEN) {
    throw new PlantaoAceitePublicoApiError(
      'Este plantão ainda possui vaga disponível.',
      'SLOT_UNAVAILABLE',
      409,
    )
  }

  const cpf = cpfDigits(payload.cpf)
  const expectedCpf = cpfDigits(profissionalLoggedProfile.cpf)

  if (cpf !== expectedCpf) {
    throw new PlantaoAceitePublicoApiError(
      'CPF não encontrado ou não elegível para este plantão.',
      'CPF_INVALID',
      403,
    )
  }

  return {
    profissionalNome: profissionalLoggedProfile.fullName,
    reservePosition: plantaoAceitePublicoDemoEsgotado.reserveQueueCount + 1,
    agendaUrl: profissionalRoutes.agenda,
  }
}
