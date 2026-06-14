import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/prefeitura/relatorios'
import {
  PrefeituraRelatoriosApiError as MockPrefeituraRelatoriosApiError,
  fetchPrefeituraCadastrosIncompletosReport as mockFetchPrefeituraCadastrosIncompletosReport,
  fetchPrefeituraProducaoUnidadeReport as mockFetchPrefeituraProducaoUnidadeReport,
  fetchPrefeituraNovosCadastrosReport as mockFetchPrefeituraNovosCadastrosReport,
  fetchPrefeituraFilaEsperaAbandonoReport as mockFetchPrefeituraFilaEsperaAbandonoReport,
  fetchPrefeituraPacientesInativosReport as mockFetchPrefeituraPacientesInativosReport,
  fetchPrefeituraPerfilTerritorialReport as mockFetchPrefeituraPerfilTerritorialReport,
  fetchPrefeituraAgendaComparecimentoReport as mockFetchPrefeituraAgendaComparecimentoReport,
  fetchPrefeituraRankingUbtsReport as mockFetchPrefeituraRankingUbtsReport,
  fetchPrefeituraRetornosPendentesReport as mockFetchPrefeituraRetornosPendentesReport,
  fetchPrefeituraFluxoTerminalReport as mockFetchPrefeituraFluxoTerminalReport,
  fetchPrefeituraDemandaEspecialidadeReport as mockFetchPrefeituraDemandaEspecialidadeReport,
  fetchPrefeituraCapacidadeOcupacaoReport as mockFetchPrefeituraCapacidadeOcupacaoReport,
  fetchPrefeituraEncaminhamentosEncaixesReport as mockFetchPrefeituraEncaminhamentosEncaixesReport,
  fetchPrefeituraHorariosPicoReport as mockFetchPrefeituraHorariosPicoReport,
  fetchPrefeituraMedicosPlantaoReport as mockFetchPrefeituraMedicosPlantaoReport,
  fetchPrefeituraDuracaoMediaReport as mockFetchPrefeituraDuracaoMediaReport,
  fetchPrefeituraInterrupcoesReconexoesReport as mockFetchPrefeituraInterrupcoesReconexoesReport,
  fetchPrefeituraAvaliacoesAtendimentosReport as mockFetchPrefeituraAvaliacoesAtendimentosReport,
  fetchPrefeituraSatisfacaoCidadaoReport as mockFetchPrefeituraSatisfacaoCidadaoReport,
  fetchPrefeituraUnidadesCriticasReport as mockFetchPrefeituraUnidadesCriticasReport,
  isPrefeituraRelatoriosApiError as mockIsPrefeituraRelatoriosApiError,
} from '../../mockServices/prefeitura/relatoriosReport'
import type {
  AgendaComparecimentoReportApi,
  AvaliacoesAtendimentosReportApi,
  CadastrosIncompletosReportApi,
  CapacidadeOcupacaoReportApi,
  DemandaEspecialidadeReportApi,
  DuracaoMediaReportApi,
  EncaminhamentosEncaixesReportApi,
  FilaEsperaAbandonoReportApi,
  FluxoTerminalReportApi,
  HorariosPicoReportApi,
  InterrupcoesReconexoesReportApi,
  MedicosPlantaoReportApi,
  NovosCadastrosReportApi,
  PacientesInativosReportApi,
  PerfilTerritorialReportApi,
  ProducaoUnidadeReportApi,
  RankingUbtsReportApi,
  RetornosPendentesReportApi,
  SatisfacaoCidadaoReportApi,
  UnidadesCriticasReportApi,
} from '../../../types/prefeituraRelatorios'

export type {
  AgendaComparecimentoReportApi,
  AvaliacoesAtendimentosReportApi,
  CadastrosIncompletosReportApi,
  CapacidadeOcupacaoReportApi,
  DemandaEspecialidadeReportApi,
  DuracaoMediaReportApi,
  EncaminhamentosEncaixesReportApi,
  FilaEsperaAbandonoReportApi,
  FluxoTerminalReportApi,
  HorariosPicoReportApi,
  InterrupcoesReconexoesReportApi,
  MedicosPlantaoReportApi,
  NovosCadastrosReportApi,
  PacientesInativosReportApi,
  PerfilTerritorialReportApi,
  ProducaoUnidadeReportApi,
  RankingUbtsReportApi,
  RetornosPendentesReportApi,
  SatisfacaoCidadaoReportApi,
  UnidadesCriticasReportApi,
}

export const PrefeituraRelatoriosApiError = isBackendApiEnabled()
  ? api.PrefeituraRelatoriosApiError
  : MockPrefeituraRelatoriosApiError

export function isPrefeituraRelatoriosApiError(
  error: unknown,
): error is InstanceType<typeof PrefeituraRelatoriosApiError> {
  if (isBackendApiEnabled()) {
    return api.isPrefeituraRelatoriosApiError(error)
  }
  return mockIsPrefeituraRelatoriosApiError(error)
}

export const fetchPrefeituraProducaoUnidadeReport = isBackendApiEnabled()
  ? api.apiFetchPrefeituraProducaoUnidadeReport
  : mockFetchPrefeituraProducaoUnidadeReport

export const fetchPrefeituraFilaEsperaAbandonoReport = isBackendApiEnabled()
  ? api.apiFetchPrefeituraFilaEsperaAbandonoReport
  : mockFetchPrefeituraFilaEsperaAbandonoReport

export const fetchPrefeituraAgendaComparecimentoReport = isBackendApiEnabled()
  ? api.apiFetchPrefeituraAgendaComparecimentoReport
  : mockFetchPrefeituraAgendaComparecimentoReport

export const fetchPrefeituraRankingUbtsReport = isBackendApiEnabled()
  ? api.apiFetchPrefeituraRankingUbtsReport
  : mockFetchPrefeituraRankingUbtsReport

export const fetchPrefeituraFluxoTerminalReport = isBackendApiEnabled()
  ? api.apiFetchPrefeituraFluxoTerminalReport
  : mockFetchPrefeituraFluxoTerminalReport

export const fetchPrefeituraDemandaEspecialidadeReport = isBackendApiEnabled()
  ? api.apiFetchPrefeituraDemandaEspecialidadeReport
  : mockFetchPrefeituraDemandaEspecialidadeReport

export const fetchPrefeituraCapacidadeOcupacaoReport = isBackendApiEnabled()
  ? api.apiFetchPrefeituraCapacidadeOcupacaoReport
  : mockFetchPrefeituraCapacidadeOcupacaoReport

export const fetchPrefeituraEncaminhamentosEncaixesReport = isBackendApiEnabled()
  ? api.apiFetchPrefeituraEncaminhamentosEncaixesReport
  : mockFetchPrefeituraEncaminhamentosEncaixesReport

export const fetchPrefeituraHorariosPicoReport = isBackendApiEnabled()
  ? api.apiFetchPrefeituraHorariosPicoReport
  : mockFetchPrefeituraHorariosPicoReport

export const fetchPrefeituraMedicosPlantaoReport = isBackendApiEnabled()
  ? api.apiFetchPrefeituraMedicosPlantaoReport
  : mockFetchPrefeituraMedicosPlantaoReport

export const fetchPrefeituraDuracaoMediaReport = isBackendApiEnabled()
  ? api.apiFetchPrefeituraDuracaoMediaReport
  : mockFetchPrefeituraDuracaoMediaReport

export const fetchPrefeituraInterrupcoesReconexoesReport = isBackendApiEnabled()
  ? api.apiFetchPrefeituraInterrupcoesReconexoesReport
  : mockFetchPrefeituraInterrupcoesReconexoesReport

export const fetchPrefeituraAvaliacoesAtendimentosReport = isBackendApiEnabled()
  ? api.apiFetchPrefeituraAvaliacoesAtendimentosReport
  : mockFetchPrefeituraAvaliacoesAtendimentosReport

export const fetchPrefeituraSatisfacaoCidadaoReport = isBackendApiEnabled()
  ? api.apiFetchPrefeituraSatisfacaoCidadaoReport
  : mockFetchPrefeituraSatisfacaoCidadaoReport

export const fetchPrefeituraUnidadesCriticasReport = isBackendApiEnabled()
  ? api.apiFetchPrefeituraUnidadesCriticasReport
  : mockFetchPrefeituraUnidadesCriticasReport

export const fetchPrefeituraNovosCadastrosReport = isBackendApiEnabled()
  ? api.apiFetchPrefeituraNovosCadastrosReport
  : mockFetchPrefeituraNovosCadastrosReport

export const fetchPrefeituraCadastrosIncompletosReport = isBackendApiEnabled()
  ? api.apiFetchPrefeituraCadastrosIncompletosReport
  : mockFetchPrefeituraCadastrosIncompletosReport

export const fetchPrefeituraPacientesInativosReport = isBackendApiEnabled()
  ? api.apiFetchPrefeituraPacientesInativosReport
  : mockFetchPrefeituraPacientesInativosReport

export const fetchPrefeituraPerfilTerritorialReport = isBackendApiEnabled()
  ? api.apiFetchPrefeituraPerfilTerritorialReport
  : mockFetchPrefeituraPerfilTerritorialReport

export const fetchPrefeituraRetornosPendentesReport = isBackendApiEnabled()
  ? api.apiFetchPrefeituraRetornosPendentesReport
  : mockFetchPrefeituraRetornosPendentesReport
