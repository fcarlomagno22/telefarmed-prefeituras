import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/admin/profissionalRepasse'
import * as mock from '../../mockServices/admin/profissionalRepasse'

const useApi = isBackendApiEnabled()

export type AdminRepasseCompetenciasResponse = mock.AdminRepasseCompetenciasResponse
export type AdminRepasseCompetenciaMutationResponse = mock.AdminRepasseCompetenciaMutationResponse

export const AdminProfissionalRepasseApiError = useApi
  ? api.AdminProfissionalRepasseApiError
  : mock.AdminProfissionalRepasseApiError

export const fetchAdminRepasseCompetencias = useApi
  ? api.fetchAdminRepasseCompetencias
  : mock.fetchAdminRepasseCompetencias

export const approveAdminRepasseCompetencia = useApi
  ? api.approveAdminRepasseCompetencia
  : mock.approveAdminRepasseCompetencia

export const rejectAdminRepasseCompetencia = useApi
  ? api.rejectAdminRepasseCompetencia
  : mock.rejectAdminRepasseCompetencia

export const requestAdminRepasseCorrecao = useApi
  ? api.requestAdminRepasseCorrecao
  : mock.requestAdminRepasseCorrecao

export const submitAdminRepassePlantaoDecisao = useApi
  ? api.submitAdminRepassePlantaoDecisao
  : mock.submitAdminRepassePlantaoDecisao

export const markAdminRepasseCompetenciaPago = useApi
  ? api.markAdminRepasseCompetenciaPago
  : mock.markAdminRepasseCompetenciaPago

export const isAdminProfissionalRepasseApiError = useApi
  ? api.isAdminProfissionalRepasseApiError
  : mock.isAdminProfissionalRepasseApiError
