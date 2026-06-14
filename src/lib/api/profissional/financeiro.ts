import type {
  ProfissionalFinanceiroDadosPagamento,
  ProfissionalFinanceiroFechamentoApi,
  ProfissionalFinanceiroRepasse,
  ProfissionalFinanceiroRepasseDetail,
  ProfissionalFinanceiroSummary,
  ProfissionalRepasseStatus,
  UpdateProfissionalFinanceiroDadosPagamentoInput,
} from '../../../types/profissionalFinanceiroApi'
import { API_BASE_URL } from '../config'
import { apiFetch, ApiError } from '../http'

export class ProfissionalFinanceiroApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'ProfissionalFinanceiroApiError'
  }
}

function mapApiError(error: unknown, fallbackMessage: string): ProfissionalFinanceiroApiError {
  if (error instanceof ApiError) {
    return new ProfissionalFinanceiroApiError(error.message, error.status, error.code)
  }
  return new ProfissionalFinanceiroApiError(fallbackMessage, 0)
}

export function isProfissionalFinanceiroApiError(
  error: unknown,
): error is ProfissionalFinanceiroApiError {
  return error instanceof ProfissionalFinanceiroApiError
}

export async function fetchProfissionalFinanceiroSummary(
  accessToken: string,
): Promise<ProfissionalFinanceiroSummary> {
  try {
    return await apiFetch<ProfissionalFinanceiroSummary>('/profissional/financeiro/summary', {
      accessToken,
    })
  } catch (error) {
    throw mapApiError(error, 'Não foi possível carregar o resumo financeiro.')
  }
}

export async function fetchProfissionalFinanceiroDadosPagamento(
  accessToken: string,
): Promise<ProfissionalFinanceiroDadosPagamento> {
  try {
    return await apiFetch<ProfissionalFinanceiroDadosPagamento>(
      '/profissional/financeiro/dados-pagamento',
      { accessToken },
    )
  } catch (error) {
    throw mapApiError(error, 'Não foi possível carregar os dados de pagamento.')
  }
}

export async function updateProfissionalFinanceiroDadosPagamento(
  accessToken: string,
  payload: UpdateProfissionalFinanceiroDadosPagamentoInput,
): Promise<ProfissionalFinanceiroDadosPagamento> {
  try {
    return await apiFetch<ProfissionalFinanceiroDadosPagamento>(
      '/profissional/financeiro/dados-pagamento',
      { method: 'PATCH', accessToken, json: payload },
    )
  } catch (error) {
    throw mapApiError(error, 'Não foi possível salvar os dados de pagamento.')
  }
}

export async function fetchProfissionalFinanceiroRepasses(
  accessToken: string,
  query?: {
    competenciaFrom?: string
    competenciaTo?: string
    status?: ProfissionalRepasseStatus
    limit?: number
    offset?: number
  },
): Promise<ProfissionalFinanceiroRepasse[]> {
  const search = new URLSearchParams()
  if (query?.competenciaFrom) search.set('competenciaFrom', query.competenciaFrom)
  if (query?.competenciaTo) search.set('competenciaTo', query.competenciaTo)
  if (query?.status) search.set('status', query.status)
  if (query?.limit != null) search.set('limit', String(query.limit))
  if (query?.offset != null) search.set('offset', String(query.offset))
  const qs = search.toString()

  try {
    const data = await apiFetch<{ repasses: ProfissionalFinanceiroRepasse[] }>(
      `/profissional/financeiro/repasses${qs ? `?${qs}` : ''}`,
      { accessToken },
    )
    return data.repasses
  } catch (error) {
    throw mapApiError(error, 'Não foi possível carregar os repasses.')
  }
}

export async function fetchProfissionalFinanceiroRepasseDetail(
  accessToken: string,
  competencia: string,
): Promise<ProfissionalFinanceiroRepasseDetail> {
  try {
    return await apiFetch<ProfissionalFinanceiroRepasseDetail>(
      `/profissional/financeiro/repasses/${encodeURIComponent(competencia)}`,
      { accessToken },
    )
  } catch (error) {
    throw mapApiError(error, 'Não foi possível carregar a competência.')
  }
}

export async function submitProfissionalFinanceiroFechamento(
  accessToken: string,
  competencia: string,
  payload: {
    invoiceFile: File
    pixKeyType: string
    pixKey: string
    onUploadProgress?: (percent: number) => void
  },
): Promise<ProfissionalFinanceiroFechamentoApi> {
  const form = new FormData()
  form.append('pixTipo', payload.pixKeyType)
  form.append('pixChave', payload.pixKey)
  form.append('invoice', payload.invoiceFile, payload.invoiceFile.name)

  try {
    payload.onUploadProgress?.(10)

    const response = await fetch(
      `${API_BASE_URL}/profissional/financeiro/repasses/${encodeURIComponent(competencia)}/fechamento`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: form,
        credentials: 'include',
      },
    )

    payload.onUploadProgress?.(90)

    const text = await response.text()
    let body: { error?: string; code?: string; fechamento?: ProfissionalFinanceiroFechamentoApi } | null =
      null
    if (text) {
      try {
        body = JSON.parse(text) as typeof body
      } catch {
        body = null
      }
    }

    if (!response.ok) {
      throw new ProfissionalFinanceiroApiError(
        body?.error ?? 'Não foi possível enviar o fechamento.',
        response.status,
        body?.code,
      )
    }

    payload.onUploadProgress?.(100)
    if (!body?.fechamento) {
      throw new ProfissionalFinanceiroApiError('Resposta inválida do servidor.', response.status)
    }
    return body.fechamento
  } catch (error) {
    if (error instanceof ProfissionalFinanceiroApiError) throw error
    throw mapApiError(error, 'Não foi possível enviar o fechamento.')
  }
}
