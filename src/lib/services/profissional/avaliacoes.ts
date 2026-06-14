import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/profissional/avaliacoes'
import * as mock from '../../mockServices/profissional/avaliacoes'

const useApi = isBackendApiEnabled()

export const ProfissionalAvaliacoesApiError = useApi
  ? api.ProfissionalAvaliacoesApiError
  : mock.ProfissionalAvaliacoesApiError

export const fetchProfissionalAvaliacoesSummary = useApi
  ? api.fetchProfissionalAvaliacoesSummary
  : mock.fetchProfissionalAvaliacoesSummary

export const fetchProfissionalAvaliacoesList = useApi
  ? api.fetchProfissionalAvaliacoesList
  : mock.fetchProfissionalAvaliacoesList

export const isProfissionalAvaliacoesApiError = useApi
  ? api.isProfissionalAvaliacoesApiError
  : mock.isProfissionalAvaliacoesApiError
