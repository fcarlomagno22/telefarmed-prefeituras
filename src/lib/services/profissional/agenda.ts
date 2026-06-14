import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/profissional/agenda'
import * as mock from '../../mockServices/profissional/agenda'

const useApi = isBackendApiEnabled()

export type ProfissionalAgendaShiftStatsApi = api.ProfissionalAgendaShiftStatsApi
export type ProfissionalAgendaNoticeApi = api.ProfissionalAgendaNoticeApi
export type ProfissionalAgendaPlantaoApi = api.ProfissionalAgendaPlantaoApi
export type ProfissionalAgendaConsultaApi = api.ProfissionalAgendaConsultaApi
export type ProfissionalAgendaOverviewApi = api.ProfissionalAgendaOverviewApi

export const ProfissionalAgendaApiError = useApi
  ? api.ProfissionalAgendaApiError
  : mock.ProfissionalAgendaApiError

export const fetchProfissionalAgendaOverview = useApi
  ? api.fetchProfissionalAgendaOverview
  : mock.fetchProfissionalAgendaOverview

export const fetchProfissionalAgendaPlantaoConsultas = useApi
  ? api.fetchProfissionalAgendaPlantaoConsultas
  : mock.fetchProfissionalAgendaPlantaoConsultas

export const enterProfissionalAgendaPlantao = useApi ? api.enterProfissionalAgendaPlantao : async () => null

export const endProfissionalAgendaPlantao = useApi ? api.endProfissionalAgendaPlantao : async () => null

export const markProfissionalAgendaNaoCompareceu = useApi
  ? api.markProfissionalAgendaNaoCompareceu
  : async () => undefined

export const isProfissionalAgendaApiError = useApi
  ? api.isProfissionalAgendaApiError
  : mock.isProfissionalAgendaApiError

export const fetchProfissionalAgendaDay = mock.fetchProfissionalAgendaDay
