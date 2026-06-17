import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/admin/profissionaisAtivos'
import * as mock from '../../mockServices/admin/profissionaisAtivos'

const useApi = isBackendApiEnabled()

export type AtivosSummaryResponse = api.AtivosSummaryResponse

export const AdminProfissionaisAtivosApiError = useApi
  ? api.AdminProfissionaisAtivosApiError
  : mock.AdminProfissionaisAtivosApiError

export const fetchAtivosSummary = useApi ? api.fetchAtivosSummary : mock.fetchAtivosSummary
export const fetchProfissionaisAtivosRows = useApi
  ? api.fetchProfissionaisAtivosRows
  : mock.fetchProfissionaisAtivosRows
export const fetchProfissionalAtivoDetail = useApi
  ? api.fetchProfissionalAtivoDetail
  : mock.fetchProfissionalAtivoDetail
export const fetchProfissionalAtendimentoDocumentDownloadUrl = useApi
  ? api.fetchProfissionalAtendimentoDocumentDownloadUrl
  : mock.fetchProfissionalAtendimentoDocumentDownloadUrl
export const updateProfissionalAtivo = useApi ? api.updateProfissionalAtivo : mock.updateProfissionalAtivo
export const inactivateProfissionalAtivo = useApi
  ? api.inactivateProfissionalAtivo
  : mock.inactivateProfissionalAtivo
export const reactivateProfissionalAtivo = useApi
  ? api.reactivateProfissionalAtivo
  : mock.reactivateProfissionalAtivo
export const createProfissionalAtivo = useApi ? api.createProfissionalAtivo : mock.createProfissionalAtivo
export const isAdminProfissionaisAtivosApiError = useApi
  ? api.isAdminProfissionaisAtivosApiError
  : mock.isAdminProfissionaisAtivosApiError
