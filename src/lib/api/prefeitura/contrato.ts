import type { PrefeituraPackageUsageView } from '../../../utils/prefeituraConsultationPackage'
import type { PrefeituraContratoMonthDetail } from '../../../data/prefeituraContratoMonthConsultations'
import type {
  PrefeituraContratoEspecialidade,
  PrefeituraContratoMonthlyRow,
  PrefeituraContratoOption,
  PrefeituraContratoRecord,
  PrefeituraContratoUtilizacao,
} from '../../../types/prefeituraContrato'
import { ApiError, apiFetch } from '../http'

export class PrefeituraContratoApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'PrefeituraContratoApiError'
  }
}

function mapError(error: unknown): PrefeituraContratoApiError {
  if (error instanceof ApiError) {
    return new PrefeituraContratoApiError(error.message, error.status, error.code)
  }
  return new PrefeituraContratoApiError('Não foi possível completar a requisição.', 0)
}

export type PrefeituraPackageUsageApi = PrefeituraPackageUsageView & {
  filteredScope?: boolean
}

export type PrefeituraContratoDetailApi = PrefeituraContratoRecord & {
  utilizacao: PrefeituraContratoUtilizacao
  especialidades: PrefeituraContratoEspecialidade[]
  packageUsage: PrefeituraPackageUsageApi
}

export async function apiFetchPrefeituraUtilizacaoCiclo(
  accessToken: string,
  params?: { unidadeUbtId?: string; regionKey?: string },
): Promise<PrefeituraPackageUsageApi> {
  try {
    const query = new URLSearchParams()
    if (params?.unidadeUbtId) query.set('unidadeUbtId', params.unidadeUbtId)
    if (params?.regionKey) query.set('regionKey', params.regionKey)
    const suffix = query.toString() ? `?${query.toString()}` : ''
    return await apiFetch<PrefeituraPackageUsageApi>(
      `/prefeitura/contrato/utilizacao-ciclo${suffix}`,
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchPrefeituraContratos(
  accessToken: string,
): Promise<PrefeituraContratoOption[]> {
  try {
    const data = await apiFetch<{ contratos: PrefeituraContratoOption[] }>(
      '/prefeitura/contrato/contratos',
      { accessToken },
    )
    return data.contratos
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchPrefeituraContratoAtivo(
  accessToken: string,
): Promise<PrefeituraContratoDetailApi | null> {
  try {
    const data = await apiFetch<{ contrato: PrefeituraContratoDetailApi | null }>(
      '/prefeitura/contrato/contratos/ativo',
      { accessToken },
    )
    return data.contrato
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchPrefeituraContratoById(
  accessToken: string,
  contratoId: string,
): Promise<PrefeituraContratoDetailApi> {
  try {
    const data = await apiFetch<{ contrato: PrefeituraContratoDetailApi }>(
      `/prefeitura/contrato/contratos/${contratoId}`,
      { accessToken },
    )
    return data.contrato
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchPrefeituraContratoMonthDetail(
  accessToken: string,
  contratoId: string,
  year: number,
  month: number,
): Promise<PrefeituraContratoMonthDetail> {
  try {
    const data = await apiFetch<{ detail: PrefeituraContratoMonthDetail }>(
      `/prefeitura/contrato/contratos/${contratoId}/meses/${year}/${month}`,
      { accessToken },
    )
    return data.detail
  } catch (error) {
    throw mapError(error)
  }
}

export function isPrefeituraContratoApiError(error: unknown): error is PrefeituraContratoApiError {
  return error instanceof PrefeituraContratoApiError
}

export function mapApiContratoToRecord(contrato: PrefeituraContratoDetailApi): {
  record: PrefeituraContratoRecord
  utilizacao: PrefeituraContratoUtilizacao
  especialidades: PrefeituraContratoEspecialidade[]
  packageUsage: PrefeituraPackageUsageApi
} {
  const { utilizacao, especialidades, packageUsage, ...record } = contrato
  return { record, utilizacao, especialidades, packageUsage }
}
