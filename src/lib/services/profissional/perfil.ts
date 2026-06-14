import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/profissional/perfil'
import * as mock from '../../mockServices/profissional/perfil'

const useApi = isBackendApiEnabled()

export type { ProfissionalPerfil } from '../../../types/profissionalPerfil'

export const ProfissionalPerfilApiError = useApi
  ? api.ProfissionalPerfilApiError
  : mock.ProfissionalPerfilApiError

export const isProfissionalPerfilApiError = useApi
  ? api.isProfissionalPerfilApiError
  : mock.isProfissionalPerfilApiError

export const fetchProfissionalPerfil = useApi
  ? api.fetchProfissionalPerfil
  : mock.fetchProfissionalPerfil

export const patchProfissionalPerfil = useApi ? api.patchProfissionalPerfil : mock.patchProfissionalPerfil

export const uploadProfissionalPerfilFoto = useApi
  ? api.uploadProfissionalPerfilFoto
  : mock.uploadProfissionalPerfilFoto

export const fetchProfissionalDocumentoPreview = useApi
  ? api.fetchProfissionalDocumentoPreview
  : mock.fetchProfissionalDocumentoPreview

export const replaceProfissionalDocumento = useApi
  ? api.replaceProfissionalDocumento
  : mock.replaceProfissionalDocumento

export const vincularProfissionalCertificadoConselho = useApi
  ? api.vincularProfissionalCertificadoConselho
  : mock.vincularProfissionalCertificadoConselho

export const uploadProfissionalCertificadoA1 = useApi
  ? api.uploadProfissionalCertificadoA1
  : mock.uploadProfissionalCertificadoA1
