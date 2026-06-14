import type {
  AdminRepasseCompetenciaMutationResponse,
  AdminRepasseCompetenciasResponse,
} from '../../mockServices/admin/profissionalRepasse'
import type { RepasseCompetenciaAprovadaPayload, SubmitPlantaoDecisaoPayload } from '../../../types/adminProfissionalRepasse'
import { API_BASE_URL } from '../config'

export class AdminProfissionalRepasseApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'AdminProfissionalRepasseApiError'
    this.status = status
    this.code = code
  }
}

async function parseError(response: Response): Promise<AdminProfissionalRepasseApiError> {
  let message = 'Não foi possível concluir a operação de repasse.'
  let code: string | undefined
  try {
    const body = (await response.json()) as { message?: string; error?: string; code?: string }
    if (body.error) message = body.error
    else if (body.message) message = body.message
    code = body.code
  } catch {
    // ignore
  }
  return new AdminProfissionalRepasseApiError(message, response.status, code)
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

// TODO(backend): GET /admin/financeiro/repasse-profissionais — listar competências auditáveis.
// Cada plantão deve incluir repasseRule copiada de escala_slots.repasse_regra na criação/publicação.
export async function fetchAdminRepasseCompetencias(
  token: string,
): Promise<AdminRepasseCompetenciasResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/financeiro/repasse-profissionais`, {
    headers: authHeaders(token),
  })
  if (!response.ok) throw await parseError(response)
  return (await response.json()) as AdminRepasseCompetenciasResponse
}

// TODO(backend): POST /admin/financeiro/repasse-profissionais/:id/aprovar — persiste aprovação + gera conta a pagar.
export async function approveAdminRepasseCompetencia(
  token: string,
  payload: RepasseCompetenciaAprovadaPayload,
): Promise<AdminRepasseCompetenciaMutationResponse> {
  const response = await fetch(
    `${API_BASE_URL}/admin/financeiro/repasse-profissionais/${payload.competenciaRow.id}/aprovar`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({
        valorAprovadoCentavos: payload.valorAprovadoCentavos,
        motivoAjuste: payload.motivoAjuste,
      }),
    },
  )
  if (!response.ok) throw await parseError(response)
  return (await response.json()) as AdminRepasseCompetenciaMutationResponse
}

// TODO(backend): POST /admin/financeiro/repasse-profissionais/:id/rejeitar
export async function rejectAdminRepasseCompetencia(
  token: string,
  competenciaId: string,
  motivo: string,
): Promise<AdminRepasseCompetenciaMutationResponse> {
  const response = await fetch(
    `${API_BASE_URL}/admin/financeiro/repasse-profissionais/${competenciaId}/rejeitar`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ motivo }),
    },
  )
  if (!response.ok) throw await parseError(response)
  return (await response.json()) as AdminRepasseCompetenciaMutationResponse
}

// TODO(backend): POST /admin/financeiro/repasse-profissionais/:id/solicitar-correcao
export async function requestAdminRepasseCorrecao(
  token: string,
  competenciaId: string,
  motivo: string,
): Promise<AdminRepasseCompetenciaMutationResponse> {
  const response = await fetch(
    `${API_BASE_URL}/admin/financeiro/repasse-profissionais/${competenciaId}/solicitar-correcao`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ motivo }),
    },
  )
  if (!response.ok) throw await parseError(response)
  return (await response.json()) as AdminRepasseCompetenciaMutationResponse
}

export async function submitAdminRepassePlantaoDecisao(
  token: string,
  payload: SubmitPlantaoDecisaoPayload,
): Promise<AdminRepasseCompetenciaMutationResponse> {
  const response = await fetch(
    `${API_BASE_URL}/admin/financeiro/repasse-profissionais/${payload.competenciaId}/plantoes/${payload.plantaoId}/decisao`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({
        decisao: payload.decisao,
        observacao: payload.observacao ?? '',
      }),
    },
  )
  if (!response.ok) throw await parseError(response)
  return (await response.json()) as AdminRepasseCompetenciaMutationResponse
}

// TODO(backend): POST /admin/financeiro/repasse-profissionais/:id/marcar-pago
export async function markAdminRepasseCompetenciaPago(
  token: string,
  competenciaId: string,
): Promise<AdminRepasseCompetenciaMutationResponse> {
  const response = await fetch(
    `${API_BASE_URL}/admin/financeiro/repasse-profissionais/${competenciaId}/marcar-pago`,
    {
      method: 'POST',
      headers: authHeaders(token),
    },
  )
  if (!response.ok) throw await parseError(response)
  return (await response.json()) as AdminRepasseCompetenciaMutationResponse
}

export function isAdminProfissionalRepasseApiError(
  error: unknown,
): error is AdminProfissionalRepasseApiError {
  return error instanceof AdminProfissionalRepasseApiError
}
