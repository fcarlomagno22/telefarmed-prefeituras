import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/profissional/escala'
import * as mock from '../../mockServices/profissional/escala'

const useApi = isBackendApiEnabled()

export type ProfissionalEscalaSummaryApi = api.ProfissionalEscalaSummaryApi
export type ProfissionalEscalaSlotApi = api.ProfissionalEscalaSlotApi
export type ProfissionalPlantaoApi = api.ProfissionalPlantaoApi

export const ProfissionalEscalaApiError = useApi
  ? api.ProfissionalEscalaApiError
  : mock.ProfissionalEscalaApiError

export const fetchProfissionalEscalaDisponiveis = useApi
  ? api.fetchProfissionalEscalaDisponiveis
  : mock.fetchProfissionalEscalaDisponiveis

export const fetchProfissionalMeusPlantoes = useApi
  ? api.fetchProfissionalMeusPlantoes
  : mock.fetchProfissionalMeusPlantoes

export const fetchProfissionalEscalaSummary = useApi
  ? api.fetchProfissionalEscalaSummary
  : mock.fetchProfissionalEscalaSummary

export const inscreverProfissionalEscalaSlot = useApi
  ? api.inscreverProfissionalEscalaSlot
  : mock.inscreverProfissionalEscalaSlot

export const cancelarProfissionalEscalaInscricao = useApi
  ? api.cancelarProfissionalEscalaInscricao
  : mock.cancelarProfissionalEscalaInscricao

export const cancelarProfissionalEscalaPlantao = useApi
  ? api.cancelarProfissionalEscalaPlantao
  : mock.cancelarProfissionalEscalaPlantao

export const isProfissionalEscalaApiError = useApi
  ? api.isProfissionalEscalaApiError
  : mock.isProfissionalEscalaApiError
