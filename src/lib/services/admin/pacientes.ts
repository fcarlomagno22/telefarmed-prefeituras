import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/admin/pacientes'
import * as mock from '../../mockServices/admin/pacientes'

const useApi = isBackendApiEnabled()

export type PacientesSummaryResponse = api.PacientesSummaryResponse
export type PreCadastroRegistrationPayload = api.PreCadastroRegistrationPayload
export type CreatePacientePayload = api.CreatePacientePayload
export type PreCadastroCreateResponse = api.PreCadastroCreateResponse
export type ListPacientesParams = api.ListPacientesParams
export type UpdatePacientePayload = api.UpdatePacientePayload

export const AdminPacientesApiError = useApi ? api.AdminPacientesApiError : mock.AdminPacientesApiError

export const fetchPacientesSummary = useApi ? api.fetchPacientesSummary : mock.fetchPacientesSummary
export const fetchPacientesRows = useApi ? api.fetchPacientesRows : mock.fetchPacientesRows
export const fetchPacienteDetail = useApi ? api.fetchPacienteDetail : mock.fetchPacienteDetail
export const fetchPacienteProntuario = useApi ? api.fetchPacienteProntuario : mock.fetchPacienteProntuario
export const fetchPacienteByCpf = useApi ? api.fetchPacienteByCpf : mock.fetchPacienteByCpf
export const fetchPacientesContractingEntities = useApi
  ? api.fetchPacientesContractingEntities
  : mock.fetchPacientesContractingEntities
export const fetchPacientesMunicipios = useApi ? api.fetchPacientesMunicipios : mock.fetchPacientesMunicipios
export const createPaciente = useApi ? api.createPaciente : mock.createPaciente
export const createPacientePreCadastroDraft = useApi
  ? api.createPacientePreCadastroDraft
  : mock.createPacientePreCadastroDraft
export const concludePacientePreCadastro = useApi
  ? api.concludePacientePreCadastro
  : mock.concludePacientePreCadastro
export const cancelPacientePreCadastro = useApi
  ? api.cancelPacientePreCadastro
  : mock.cancelPacientePreCadastro
export const submitPacientePreCadastro = useApi
  ? api.submitPacientePreCadastro
  : mock.submitPacientePreCadastro
export const inactivatePaciente = useApi ? api.inactivatePaciente : mock.inactivatePaciente
export const updatePaciente = useApi ? api.updatePaciente : mock.updatePaciente
export const downloadPacientesExport = useApi ? api.downloadPacientesExport : mock.downloadPacientesExport
export const isAdminPacientesApiError = useApi ? api.isAdminPacientesApiError : mock.isAdminPacientesApiError

export type {
  AdminContractStatus,
  AdminMunicipalPatient,
  AdminMunicipalPatientDetail,
  AdminPatientContractingEntity,
} from '../../api/admin/pacientes'
