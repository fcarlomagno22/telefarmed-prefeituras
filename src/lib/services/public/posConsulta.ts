import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/public/posConsulta'
import {
  fetchPublicPosConsultaCheckin as mockFetchPublicPosConsultaCheckin,
  isPublicPosConsultaApiError as mockIsPublicPosConsultaApiError,
  PublicPosConsultaApiError as MockPublicPosConsultaApiError,
  submitPublicPosConsultaCheckin as mockSubmitPublicPosConsultaCheckin,
} from '../../mockServices/public/posConsulta'

export type {
  PosConsultaCheckinContext,
  PosConsultaCheckinRespostas,
  PosConsultaSubmitResult,
} from '../../../types/posConsulta'

const useApi = isBackendApiEnabled()

export const PublicPosConsultaApiError = useApi ? api.PublicPosConsultaApiError : MockPublicPosConsultaApiError

export const isPublicPosConsultaApiError = useApi
  ? api.isPublicPosConsultaApiError
  : mockIsPublicPosConsultaApiError

export async function fetchPublicPosConsultaCheckin(token: string) {
  if (useApi) {
    return api.apiFetchPublicPosConsultaCheckin(token)
  }
  return mockFetchPublicPosConsultaCheckin(token)
}

export async function submitPublicPosConsultaCheckin(
  token: string,
  respostas: import('../../../types/posConsulta').PosConsultaCheckinRespostas,
) {
  if (useApi) {
    return api.apiSubmitPublicPosConsultaCheckin(token, respostas)
  }
  return mockSubmitPublicPosConsultaCheckin(token, respostas)
}
