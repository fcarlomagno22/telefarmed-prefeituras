import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/prefeitura/contrato'
import type { PrefeituraContratoMonthDetail } from '../../../data/prefeituraContratoMonthConsultations'
import {
  PrefeituraContratoApiError as MockPrefeituraContratoApiError,
  fetchPrefeituraContratoAtivo as mockFetchPrefeituraContratoAtivo,
  fetchPrefeituraContratoById as mockFetchPrefeituraContratoById,
  fetchPrefeituraContratoMonthDetail as mockFetchPrefeituraContratoMonthDetail,
  fetchPrefeituraContratos as mockFetchPrefeituraContratos,
  isPrefeituraContratoApiError as mockIsPrefeituraContratoApiError,
  mapApiContratoToRecord as mockMapApiContratoToRecord,
} from '../../mockServices/prefeitura/contrato'
import {
  computePrefeituraPackageUsage,
  type PrefeituraPackageUsageView,
} from '../../../utils/prefeituraConsultationPackage'
import type {
  PrefeituraContratoEspecialidade,
  PrefeituraContratoOption,
  PrefeituraContratoRecord,
  PrefeituraContratoUtilizacao,
} from '../../../types/prefeituraContrato'

export type { PrefeituraPackageUsageView }

export const PrefeituraContratoApiError = isBackendApiEnabled()
  ? api.PrefeituraContratoApiError
  : MockPrefeituraContratoApiError

export function isPrefeituraContratoApiError(
  error: unknown,
): error is InstanceType<typeof PrefeituraContratoApiError> {
  if (isBackendApiEnabled()) {
    return api.isPrefeituraContratoApiError(error)
  }
  return mockIsPrefeituraContratoApiError(error)
}

export const fetchPrefeituraContratos = isBackendApiEnabled()
  ? api.apiFetchPrefeituraContratos
  : mockFetchPrefeituraContratos

export async function fetchPrefeituraContratoAtivo(accessToken: string) {
  if (isBackendApiEnabled()) {
    return api.apiFetchPrefeituraContratoAtivo(accessToken)
  }
  return mockFetchPrefeituraContratoAtivo(accessToken)
}

export async function fetchPrefeituraContratoById(accessToken: string, contratoId: string) {
  if (isBackendApiEnabled()) {
    return api.apiFetchPrefeituraContratoById(accessToken, contratoId)
  }
  return mockFetchPrefeituraContratoById(accessToken, contratoId)
}

export function mapApiContratoToRecord(contrato: Parameters<typeof mockMapApiContratoToRecord>[0]): {
  record: PrefeituraContratoRecord
  utilizacao: PrefeituraContratoUtilizacao
  especialidades: PrefeituraContratoEspecialidade[]
  packageUsage?: PrefeituraPackageUsageView
} {
  if (isBackendApiEnabled()) {
    return api.mapApiContratoToRecord(
      contrato as Parameters<typeof api.mapApiContratoToRecord>[0],
    )
  }
  return mockMapApiContratoToRecord(contrato)
}

export async function fetchPrefeituraUtilizacaoCiclo(
  accessToken: string,
  params?: { unidadeUbtId?: string; regionKey?: string },
): Promise<PrefeituraPackageUsageView> {
  if (isBackendApiEnabled()) {
    const usage = await api.apiFetchPrefeituraUtilizacaoCiclo(accessToken, params)
    const { filteredScope: _filteredScope, ...view } = usage
    return view
  }

  const shareRatio = params?.unidadeUbtId || params?.regionKey ? 0.35 : 1
  return computePrefeituraPackageUsage(
    {
      period: '30d',
      region: params?.regionKey ?? 'todas',
      ubt: params?.unidadeUbtId ?? 'todas',
    },
    shareRatio,
  )
}

export async function fetchPrefeituraContratoMonthDetail(
  accessToken: string,
  contratoId: string,
  year: number,
  month: number,
  contractMeta?: Parameters<typeof mockFetchPrefeituraContratoMonthDetail>[4],
): Promise<PrefeituraContratoMonthDetail> {
  if (isBackendApiEnabled()) {
    return api.apiFetchPrefeituraContratoMonthDetail(accessToken, contratoId, year, month)
  }
  return mockFetchPrefeituraContratoMonthDetail(accessToken, contratoId, year, month, contractMeta)
}

export async function fetchPrefeituraActiveContratoEspecialidadeIds(
  accessToken: string,
): Promise<string[]> {
  const contratos = await fetchPrefeituraContratos(accessToken)
  const active = contratos.filter((contrato) => contrato.status === 'active')
  if (active.length === 0) return []

  const ids = new Set<string>()
  await Promise.all(
    active.map(async (contrato) => {
      const detail = await fetchPrefeituraContratoById(accessToken, contrato.id)
      for (const especialidade of detail.especialidades) {
        ids.add(especialidade.id)
      }
    }),
  )

  return [...ids]
}
