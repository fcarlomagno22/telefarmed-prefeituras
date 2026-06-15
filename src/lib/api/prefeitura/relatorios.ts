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
import { ApiError, apiFetch } from '../http'
import {
  mapAvaliacoesAtendimentosReport,
  mapDuracaoMediaReport,
  mapInterrupcoesReconexoesReport,
  mapSatisfacaoCidadaoReport,
  mapUnidadesCriticasReport,
} from './relatoriosQualityMappers'

export class PrefeituraRelatoriosApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'PrefeituraRelatoriosApiError'
  }
}

function mapError(error: unknown): PrefeituraRelatoriosApiError {
  if (error instanceof ApiError) {
    return new PrefeituraRelatoriosApiError(error.message, error.status, error.code)
  }
  return new PrefeituraRelatoriosApiError('Não foi possível completar a requisição.', 0)
}

export async function apiFetchPrefeituraProducaoUnidadeReport(
  accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<ProducaoUnidadeReportApi> {
  try {
    const query = new URLSearchParams({
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
    })
    if (params.unidadeUbtId) query.set('unidadeUbtId', params.unidadeUbtId)
    if (params.regionKey) query.set('regionKey', params.regionKey)

    return await apiFetch<ProducaoUnidadeReportApi>(
      `/prefeitura/relatorios/producao-unidade?${query.toString()}`,
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchPrefeituraFilaEsperaAbandonoReport(
  accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<FilaEsperaAbandonoReportApi> {
  try {
    const query = new URLSearchParams({
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
    })
    if (params.unidadeUbtId) query.set('unidadeUbtId', params.unidadeUbtId)
    if (params.regionKey) query.set('regionKey', params.regionKey)

    return await apiFetch<FilaEsperaAbandonoReportApi>(
      `/prefeitura/relatorios/fila-espera-abandono?${query.toString()}`,
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchPrefeituraAgendaComparecimentoReport(
  accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<AgendaComparecimentoReportApi> {
  try {
    const query = new URLSearchParams({
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
    })
    if (params.unidadeUbtId) query.set('unidadeUbtId', params.unidadeUbtId)
    if (params.regionKey) query.set('regionKey', params.regionKey)

    return await apiFetch<AgendaComparecimentoReportApi>(
      `/prefeitura/relatorios/agenda-comparecimento?${query.toString()}`,
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchPrefeituraRankingUbtsReport(
  accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<RankingUbtsReportApi> {
  try {
    const query = new URLSearchParams({
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
    })
    if (params.unidadeUbtId) query.set('unidadeUbtId', params.unidadeUbtId)
    if (params.regionKey) query.set('regionKey', params.regionKey)

    return await apiFetch<RankingUbtsReportApi>(
      `/prefeitura/relatorios/ranking-ubts?${query.toString()}`,
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchPrefeituraFluxoTerminalReport(
  accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<FluxoTerminalReportApi> {
  try {
    const query = new URLSearchParams({
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
    })
    if (params.unidadeUbtId) query.set('unidadeUbtId', params.unidadeUbtId)
    if (params.regionKey) query.set('regionKey', params.regionKey)

    return await apiFetch<FluxoTerminalReportApi>(
      `/prefeitura/relatorios/fluxo-terminal?${query.toString()}`,
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

function buildReportQuery(params: {
  periodStart: string
  periodEnd: string
  unidadeUbtId?: string
  regionKey?: string
}) {
  const query = new URLSearchParams({
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
  })
  if (params.unidadeUbtId) query.set('unidadeUbtId', params.unidadeUbtId)
  if (params.regionKey) query.set('regionKey', params.regionKey)
  return query
}

export async function apiFetchPrefeituraDemandaEspecialidadeReport(
  accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<DemandaEspecialidadeReportApi> {
  try {
    return await apiFetch<DemandaEspecialidadeReportApi>(
      `/prefeitura/relatorios/demanda-especialidade?${buildReportQuery(params).toString()}`,
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchPrefeituraCapacidadeOcupacaoReport(
  accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<CapacidadeOcupacaoReportApi> {
  try {
    return await apiFetch<CapacidadeOcupacaoReportApi>(
      `/prefeitura/relatorios/capacidade-ocupacao?${buildReportQuery(params).toString()}`,
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchPrefeituraEncaminhamentosEncaixesReport(
  accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<EncaminhamentosEncaixesReportApi> {
  try {
    return await apiFetch<EncaminhamentosEncaixesReportApi>(
      `/prefeitura/relatorios/encaminhamentos-encaixes?${buildReportQuery(params).toString()}`,
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchPrefeituraHorariosPicoReport(
  accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<HorariosPicoReportApi> {
  try {
    return await apiFetch<HorariosPicoReportApi>(
      `/prefeitura/relatorios/horarios-pico?${buildReportQuery(params).toString()}`,
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchPrefeituraMedicosPlantaoReport(
  accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<MedicosPlantaoReportApi> {
  try {
    return await apiFetch<MedicosPlantaoReportApi>(
      `/prefeitura/relatorios/medicos-plantao?${buildReportQuery(params).toString()}`,
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchPrefeituraDuracaoMediaReport(
  accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<DuracaoMediaReportApi> {
  try {
    const raw = await apiFetch(
      `/prefeitura/relatorios/duracao-media?${buildReportQuery(params).toString()}`,
      { accessToken },
    )
    return mapDuracaoMediaReport(raw)
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchPrefeituraInterrupcoesReconexoesReport(
  accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<InterrupcoesReconexoesReportApi> {
  try {
    const raw = await apiFetch(
      `/prefeitura/relatorios/interrupcoes-reconexoes?${buildReportQuery(params).toString()}`,
      { accessToken },
    )
    return mapInterrupcoesReconexoesReport(raw)
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchPrefeituraAvaliacoesAtendimentosReport(
  accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<AvaliacoesAtendimentosReportApi> {
  try {
    const raw = await apiFetch(
      `/prefeitura/relatorios/avaliacoes-atendimentos?${buildReportQuery(params).toString()}`,
      { accessToken },
    )
    return mapAvaliacoesAtendimentosReport(raw)
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchPrefeituraSatisfacaoCidadaoReport(
  accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<SatisfacaoCidadaoReportApi> {
  try {
    const raw = await apiFetch(
      `/prefeitura/relatorios/satisfacao-cidadao?${buildReportQuery(params).toString()}`,
      { accessToken },
    )
    return mapSatisfacaoCidadaoReport(raw)
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchPrefeituraUnidadesCriticasReport(
  accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<UnidadesCriticasReportApi> {
  try {
    const raw = await apiFetch(
      `/prefeitura/relatorios/unidades-criticas?${buildReportQuery(params).toString()}`,
      { accessToken },
    )
    return mapUnidadesCriticasReport(raw)
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchPrefeituraNovosCadastrosReport(
  accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<NovosCadastrosReportApi> {
  try {
    return await apiFetch<NovosCadastrosReportApi>(
      `/prefeitura/relatorios/novos-cadastros?${buildReportQuery(params).toString()}`,
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchPrefeituraCadastrosIncompletosReport(
  accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<CadastrosIncompletosReportApi> {
  try {
    return await apiFetch<CadastrosIncompletosReportApi>(
      `/prefeitura/relatorios/cadastros-incompletos?${buildReportQuery(params).toString()}`,
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchPrefeituraPacientesInativosReport(
  accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<PacientesInativosReportApi> {
  try {
    return await apiFetch<PacientesInativosReportApi>(
      `/prefeitura/relatorios/pacientes-inativos?${buildReportQuery(params).toString()}`,
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchPrefeituraPerfilTerritorialReport(
  accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<PerfilTerritorialReportApi> {
  try {
    return await apiFetch<PerfilTerritorialReportApi>(
      `/prefeitura/relatorios/perfil-territorial?${buildReportQuery(params).toString()}`,
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchPrefeituraRetornosPendentesReport(
  accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<RetornosPendentesReportApi> {
  try {
    return await apiFetch<RetornosPendentesReportApi>(
      `/prefeitura/relatorios/retornos-pendentes?${buildReportQuery(params).toString()}`,
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export function isPrefeituraRelatoriosApiError(
  error: unknown,
): error is PrefeituraRelatoriosApiError {
  return error instanceof PrefeituraRelatoriosApiError
}

export async function apiFetchPrefeituraRelatorioAgendamento(accessToken: string) {
  try {
    return await apiFetch<{ agendamento: import('../../../types/prefeituraRelatorioAgendamento').PrefeituraRelatorioAgendamento | null }>(
      '/prefeitura/relatorios/agendamento',
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiUpsertPrefeituraRelatorioAgendamento(
  accessToken: string,
  body: import('../../../types/prefeituraRelatorioAgendamento').UpsertPrefeituraRelatorioAgendamentoInput,
) {
  try {
    return await apiFetch<{ agendamento: import('../../../types/prefeituraRelatorioAgendamento').PrefeituraRelatorioAgendamento }>(
      '/prefeitura/relatorios/agendamento',
      {
        accessToken,
        method: 'PUT',
        json: body,
      },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchPrefeituraRelatorioDestinatariosCadastrados(accessToken: string) {
  try {
    return await apiFetch<{ destinatarios: import('../../../types/prefeituraRelatorioAgendamento').PrefeituraRelatorioDestinatarioCadastrado[] }>(
      '/prefeitura/relatorios/agendamento/destinatarios',
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}
