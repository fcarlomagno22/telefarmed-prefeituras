import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/profissional/posConsultaHistorico'
import {
  fetchProfissionalPacienteHistoricoEspecialidade as mockFetchProfissionalPacienteHistoricoEspecialidade,
  isProfissionalHistoricoApiError as mockIsProfissionalHistoricoApiError,
  ProfissionalHistoricoApiError as MockProfissionalHistoricoApiError,
} from '../../mockServices/profissional/posConsultaHistorico'

export type {
  ProfissionalConsultaHistoricoCheckin,
  ProfissionalConsultaHistoricoDocument,
  ProfissionalConsultaHistoricoItem,
  ProfissionalPacienteHistoricoResponse,
} from '../../../types/posConsultaHistorico'

const useApi = isBackendApiEnabled()

export const ProfissionalHistoricoApiError = useApi
  ? api.ProfissionalHistoricoApiError
  : MockProfissionalHistoricoApiError

export const isProfissionalHistoricoApiError = useApi
  ? api.isProfissionalHistoricoApiError
  : mockIsProfissionalHistoricoApiError

export async function fetchProfissionalPacienteHistoricoEspecialidade(
  accessToken: string,
  params: { pacienteId?: string; patientName?: string; specialty: string },
) {
  if (useApi) {
    if (!params.pacienteId) {
      return {
        pacienteId: '',
        patientName: params.patientName ?? 'Paciente',
        specialty: params.specialty,
        consultas: [],
      }
    }
    return api.apiFetchProfissionalPacienteHistoricoEspecialidade(accessToken, {
      pacienteId: params.pacienteId,
      specialty: params.specialty,
    })
  }
  return mockFetchProfissionalPacienteHistoricoEspecialidade(accessToken, params)
}
