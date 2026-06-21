import type {
  PrefeituraFaturamentoFechamentoCloseResult,
  PrefeituraFaturamentoFechamentoLoteItem,
  PrefeituraFaturamentoFechamentoRecord,
  PrefeituraFaturamentoFechamentoSummary,
} from '../../../types/prefeituraFaturamentoFechamento'
import type { PrefeituraFaturamentoCorrecaoPayload } from '../../../types/prefeituraFaturamentoCorrecao'
import type {
  PrefeituraFaturamentoPendencia,
  PrefeituraFaturamentoPendenciasFilters,
  PrefeituraFaturamentoPendenciasSummary,
} from '../../../types/prefeituraFaturamentoPendencias'
import { API_BASE_URL } from '../config'
import { ApiError, apiFetch } from '../http'

export class PrefeituraFaturamentoApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'PrefeituraFaturamentoApiError'
  }
}

function mapError(error: unknown): PrefeituraFaturamentoApiError {
  if (error instanceof ApiError) {
    return new PrefeituraFaturamentoApiError(error.message, error.status, error.code)
  }
  return new PrefeituraFaturamentoApiError('Não foi possível completar a requisição.', 0)
}

export function isPrefeituraFaturamentoApiError(
  error: unknown,
): error is PrefeituraFaturamentoApiError {
  return error instanceof PrefeituraFaturamentoApiError
}

export type PendenciasListResponse = {
  items: PrefeituraFaturamentoPendencia[]
  allItems?: PrefeituraFaturamentoPendencia[]
  summary: PrefeituraFaturamentoPendenciasSummary
  page: number
  pageSize: number
  totalFiltered: number
  totalPages: number
  filterOptions: {
    competencias: Array<{ value: string; label: string }>
    units: Array<{ value: string; label: string }>
    professionals: Array<{ value: string; label: string }>
    specialties: Array<{ value: string; label: string }>
  }
}

export type FechamentoOverviewResponse = {
  competencia: string
  records: PrefeituraFaturamentoFechamentoRecord[]
  loteItems: PrefeituraFaturamentoFechamentoLoteItem[]
  summary: PrefeituraFaturamentoFechamentoSummary
}

export type ReavaliacaoResponse = {
  ok: boolean
  message?: string
  errorReason?: string
  item: PrefeituraFaturamentoPendencia | null
}

export async function apiFetchCompetencias(accessToken: string) {
  try {
    return await apiFetch<{ competencias: string[] }>('/prefeitura/faturamento/competencias', {
      accessToken,
    })
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchPendencias(
  accessToken: string,
  params: PrefeituraFaturamentoPendenciasFilters & {
    categoryTab?: string
    page?: number
    pageSize?: number
  },
): Promise<PendenciasListResponse> {
  try {
    const query = new URLSearchParams({
      competencia: params.competencia,
      page: String(params.page ?? 1),
      pageSize: String(params.pageSize ?? 25),
    })
    if (params.unitId && params.unitId !== 'all') query.set('unitId', params.unitId)
    if (params.professionalName && params.professionalName !== 'all') {
      query.set('professionalName', params.professionalName)
    }
    if (params.specialty && params.specialty !== 'all') query.set('specialty', params.specialty)
    if (params.category && params.category !== 'all') query.set('category', params.category)
    if (params.gravidade && params.gravidade !== 'all') query.set('gravidade', params.gravidade)
    if (params.status && params.status !== 'all') query.set('status', params.status)
    if (params.search.trim()) query.set('search', params.search.trim())
    if (params.categoryTab) query.set('categoryTab', params.categoryTab)

    return await apiFetch<PendenciasListResponse>(
      `/prefeitura/faturamento/pendencias?${query.toString()}`,
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiReavaliarPendencia(
  accessToken: string,
  pendenciaId: string,
): Promise<ReavaliacaoResponse> {
  try {
    return await apiFetch<ReavaliacaoResponse>(
      `/prefeitura/faturamento/pendencias/${encodeURIComponent(pendenciaId)}/reavaliar`,
      { accessToken, method: 'POST' },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiIgnorarPendencia(
  accessToken: string,
  pendenciaId: string,
  justification: string,
) {
  try {
    return await apiFetch<{ item: PrefeituraFaturamentoPendencia | null }>(
      `/prefeitura/faturamento/pendencias/${encodeURIComponent(pendenciaId)}/ignorar`,
      { accessToken, method: 'POST', json: { justification } },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiCorrigirPendencia(
  accessToken: string,
  pendenciaId: string,
  payload: PrefeituraFaturamentoCorrecaoPayload,
): Promise<ReavaliacaoResponse> {
  try {
    return await apiFetch<ReavaliacaoResponse>(
      `/prefeitura/faturamento/pendencias/${encodeURIComponent(pendenciaId)}/corrigir`,
      { accessToken, method: 'POST', json: payload },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiSaveCnsPendencia(
  accessToken: string,
  pendenciaId: string,
  patientCns: string,
): Promise<ReavaliacaoResponse> {
  try {
    return await apiFetch<ReavaliacaoResponse>(
      `/prefeitura/faturamento/pendencias/${encodeURIComponent(pendenciaId)}/cns`,
      { accessToken, method: 'POST', json: { patientCns } },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiSolicitarCorrecaoClinica(accessToken: string, pendenciaId: string) {
  try {
    return await apiFetch<{ ok: boolean }>(
      `/prefeitura/faturamento/pendencias/${encodeURIComponent(pendenciaId)}/solicitar-correcao-clinica`,
      { accessToken, method: 'POST' },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiRevalidarCompetenciaPendencias(
  accessToken: string,
  competencia: string,
) {
  try {
    return await apiFetch<{ ok: boolean; revalidated: number }>(
      `/prefeitura/faturamento/competencias/${competencia}/revalidar`,
      { accessToken, method: 'POST' },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchFechamentoOverview(
  accessToken: string,
  competencia?: string,
): Promise<FechamentoOverviewResponse> {
  try {
    const query = competencia ? `?competencia=${competencia}` : ''
    return await apiFetch<FechamentoOverviewResponse>(
      `/prefeitura/faturamento/fechamentos${query}`,
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiIniciarComplemento(accessToken: string, competencia: string) {
  try {
    return await apiFetch<FechamentoOverviewResponse & { record: PrefeituraFaturamentoFechamentoRecord }>(
      '/prefeitura/faturamento/fechamentos/complemento',
      { accessToken, method: 'POST', json: { competencia } },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiRevalidarFechamento(accessToken: string, recordId: string) {
  try {
    return await apiFetch<FechamentoOverviewResponse>(
      `/prefeitura/faturamento/fechamentos/${encodeURIComponent(recordId)}/revalidar`,
      { accessToken, method: 'POST' },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFecharCompetencia(
  accessToken: string,
  recordId: string,
): Promise<
  PrefeituraFaturamentoFechamentoCloseResult & {
    overview?: FechamentoOverviewResponse
  }
> {
  try {
    return await apiFetch<
      PrefeituraFaturamentoFechamentoCloseResult & {
        overview?: FechamentoOverviewResponse
      }
    >(`/prefeitura/faturamento/fechamentos/${encodeURIComponent(recordId)}/fechar`, {
      accessToken,
      method: 'POST',
    })
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiExcludeLoteItem(
  accessToken: string,
  recordId: string,
  itemId: string,
  reason: string,
) {
  try {
    return await apiFetch<FechamentoOverviewResponse>(
      `/prefeitura/faturamento/fechamentos/${encodeURIComponent(recordId)}/lote/${itemId}/excluir`,
      { accessToken, method: 'POST', json: { reason } },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiRestoreLoteItem(
  accessToken: string,
  recordId: string,
  itemId: string,
) {
  try {
    return await apiFetch<FechamentoOverviewResponse>(
      `/prefeitura/faturamento/fechamentos/${encodeURIComponent(recordId)}/lote/${itemId}/restaurar`,
      { accessToken, method: 'POST' },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiMarcarExportado(accessToken: string, recordId: string) {
  try {
    return await apiFetch<FechamentoOverviewResponse>(
      `/prefeitura/faturamento/fechamentos/${encodeURIComponent(recordId)}/marcar-exportado`,
      { accessToken, method: 'POST' },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchHistorico(accessToken: string, search?: string) {
  try {
    const query = search?.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''
    return await apiFetch<{
      items: Array<{
        record: PrefeituraFaturamentoFechamentoRecord
        competenciaLabel: string
        tipoLabel: string
        consultasNoLote: number
      }>
    }>(`/prefeitura/faturamento/historico${query}`, { accessToken })
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchSigtapOcupacoes(accessToken: string, q?: string) {
  try {
    const query = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''
    return await apiFetch<{ options: Array<{ value: string; label: string }> }>(
      `/prefeitura/faturamento/sigtap/ocupacoes${query}`,
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchSigtapProcedimentos(
  accessToken: string,
  params?: { q?: string; cbo?: string },
) {
  try {
    const query = new URLSearchParams()
    if (params?.q?.trim()) query.set('q', params.q.trim())
    if (params?.cbo?.trim()) query.set('cbo', params.cbo.trim())
    const suffix = query.toString() ? `?${query.toString()}` : ''
    return await apiFetch<{ options: Array<{ value: string; label: string }> }>(
      `/prefeitura/faturamento/sigtap/procedimentos${suffix}`,
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiDownloadFechamentoBpa(accessToken: string, recordId: string) {
  const response = await fetch(
    `${API_BASE_URL}/prefeitura/faturamento/fechamentos/${encodeURIComponent(recordId)}/bpa`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: 'include',
    },
  )
  if (!response.ok) {
    throw new PrefeituraFaturamentoApiError('Não foi possível exportar o BPA.', response.status)
  }
  const blob = await response.blob()
  const disposition = response.headers.get('Content-Disposition') ?? ''
  const match = disposition.match(/filename="([^"]+)"/)
  return { blob, filename: match?.[1] ?? `BPA-I-TELE-${recordId}.txt` }
}

export async function apiDownloadFechamentoRelatorio(accessToken: string, recordId: string) {
  const response = await fetch(
    `${API_BASE_URL}/prefeitura/faturamento/fechamentos/${encodeURIComponent(recordId)}/relatorio`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: 'include',
    },
  )
  if (!response.ok) {
    throw new PrefeituraFaturamentoApiError('Não foi possível baixar o relatório.', response.status)
  }
  const blob = await response.blob()
  const disposition = response.headers.get('Content-Disposition') ?? ''
  const match = disposition.match(/filename="([^"]+)"/)
  return { blob, filename: match?.[1] ?? `relatorio-${recordId}.txt` }
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function downloadFechamentoBpaFromApi(accessToken: string, recordId: string) {
  const file = await apiDownloadFechamentoBpa(accessToken, recordId)
  triggerDownload(file.blob, file.filename)
}

export async function downloadFechamentoRelatorioFromApi(accessToken: string, recordId: string) {
  const file = await apiDownloadFechamentoRelatorio(accessToken, recordId)
  triggerDownload(file.blob, file.filename)
}
