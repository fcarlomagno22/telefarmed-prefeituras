import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/admin/profissionais'
import * as mock from '../../mockServices/admin/profissionais'

const useApi = isBackendApiEnabled()

export type CandidaturasSummaryResponse = api.CandidaturasSummaryResponse

export const AdminProfissionaisApiError = useApi ? api.AdminProfissionaisApiError : mock.AdminProfissionaisApiError

export const fetchCandidaturasSummary = useApi ? api.fetchCandidaturasSummary : mock.fetchCandidaturasSummary
export const fetchCandidaturasRows = useApi ? api.fetchCandidaturasRows : mock.fetchCandidaturasRows
export const fetchCandidaturaDetail = useApi ? api.fetchCandidaturaDetail : mock.fetchCandidaturaDetail
export const reviewCandidaturaDocument = useApi ? api.reviewCandidaturaDocument : mock.reviewCandidaturaDocument
export const approveCandidatura = useApi ? api.approveCandidatura : mock.approveCandidatura
export const rejectCandidatura = useApi ? api.rejectCandidatura : mock.rejectCandidatura
export const requestCandidaturaCorrection = useApi
  ? api.requestCandidaturaCorrection
  : mock.requestCandidaturaCorrection
export const isAdminProfissionaisApiError = useApi ? api.isAdminProfissionaisApiError : mock.isAdminProfissionaisApiError
