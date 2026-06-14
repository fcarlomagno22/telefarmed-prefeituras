import type { ComponentType } from 'react'
import { PrefeituraAgendaComparecimentoReportDocument } from '../../components/prefeitura/relatorios/PrefeituraAgendaComparecimentoReportDocument'
import { PrefeituraAvaliacoesAtendimentosReportDocument } from '../../components/prefeitura/relatorios/PrefeituraAvaliacoesAtendimentosReportDocument'
import { PrefeituraCapacidadeOcupacaoReportDocument } from '../../components/prefeitura/relatorios/PrefeituraCapacidadeOcupacaoReportDocument'
import { PrefeituraDemandaEspecialidadeReportDocument } from '../../components/prefeitura/relatorios/PrefeituraDemandaEspecialidadeReportDocument'
import { PrefeituraDuracaoMediaReportDocument } from '../../components/prefeitura/relatorios/PrefeituraDuracaoMediaReportDocument'
import { PrefeituraEncaminhamentosEncaixesReportDocument } from '../../components/prefeitura/relatorios/PrefeituraEncaminhamentosEncaixesReportDocument'
import { PrefeituraFilaEsperaAbandonoReportDocument } from '../../components/prefeitura/relatorios/PrefeituraFilaEsperaAbandonoReportDocument'
import { PrefeituraFluxoTerminalReportDocument } from '../../components/prefeitura/relatorios/PrefeituraFluxoTerminalReportDocument'
import { PrefeituraHorariosPicoReportDocument } from '../../components/prefeitura/relatorios/PrefeituraHorariosPicoReportDocument'
import { PrefeituraInterrupcoesReconexoesReportDocument } from '../../components/prefeitura/relatorios/PrefeituraInterrupcoesReconexoesReportDocument'
import { PrefeituraMedicosPlantaoReportDocument } from '../../components/prefeitura/relatorios/PrefeituraMedicosPlantaoReportDocument'
import { PrefeituraProducaoUnidadeReportDocument } from '../../components/prefeitura/relatorios/PrefeituraProducaoUnidadeReportDocument'
import { PrefeituraRankingUbtsReportDocument } from '../../components/prefeitura/relatorios/PrefeituraRankingUbtsReportDocument'
import { PrefeituraSatisfacaoCidadaoReportDocument } from '../../components/prefeitura/relatorios/PrefeituraSatisfacaoCidadaoReportDocument'
import { PrefeituraUnidadesCriticasReportDocument } from '../../components/prefeitura/relatorios/PrefeituraUnidadesCriticasReportDocument'
import { PrefeituraNovosCadastrosReportDocument } from '../../components/prefeitura/relatorios/PrefeituraNovosCadastrosReportDocument'
import { PrefeituraCadastrosIncompletosReportDocument } from '../../components/prefeitura/relatorios/PrefeituraCadastrosIncompletosReportDocument'
import { PrefeituraPacientesInativosReportDocument } from '../../components/prefeitura/relatorios/PrefeituraPacientesInativosReportDocument'
import { PrefeituraPerfilTerritorialReportDocument } from '../../components/prefeitura/relatorios/PrefeituraPerfilTerritorialReportDocument'
import { PrefeituraRetornosPendentesReportDocument } from '../../components/prefeitura/relatorios/PrefeituraRetornosPendentesReportDocument'
import { prefeituraRelatorioCategoryCards } from '../../data/prefeituraRelatoriosHub'
import {
  fetchPrefeituraAgendaComparecimentoReport,
  fetchPrefeituraAvaliacoesAtendimentosReport,
  fetchPrefeituraCapacidadeOcupacaoReport,
  fetchPrefeituraDemandaEspecialidadeReport,
  fetchPrefeituraDuracaoMediaReport,
  fetchPrefeituraEncaminhamentosEncaixesReport,
  fetchPrefeituraFilaEsperaAbandonoReport,
  fetchPrefeituraFluxoTerminalReport,
  fetchPrefeituraHorariosPicoReport,
  fetchPrefeituraInterrupcoesReconexoesReport,
  fetchPrefeituraMedicosPlantaoReport,
  fetchPrefeituraProducaoUnidadeReport,
  fetchPrefeituraRankingUbtsReport,
  fetchPrefeituraSatisfacaoCidadaoReport,
  fetchPrefeituraUnidadesCriticasReport,
  fetchPrefeituraNovosCadastrosReport,
  fetchPrefeituraCadastrosIncompletosReport,
  fetchPrefeituraPacientesInativosReport,
  fetchPrefeituraPerfilTerritorialReport,
  fetchPrefeituraRetornosPendentesReport,
} from '../services/prefeitura/relatorios'
import type {
  AgendaComparecimentoReportApi,
  AvaliacoesAtendimentosReportApi,
  CapacidadeOcupacaoReportApi,
  DemandaEspecialidadeReportApi,
  DuracaoMediaReportApi,
  EncaminhamentosEncaixesReportApi,
  FilaEsperaAbandonoReportApi,
  FluxoTerminalReportApi,
  HorariosPicoReportApi,
  InterrupcoesReconexoesReportApi,
  MedicosPlantaoReportApi,
  PrefeituraRelatorioId,
  ProducaoUnidadeReportApi,
  RankingUbtsReportApi,
  SatisfacaoCidadaoReportApi,
  UnidadesCriticasReportApi,
  NovosCadastrosReportApi,
  CadastrosIncompletosReportApi,
  PacientesInativosReportApi,
  PerfilTerritorialReportApi,
  RetornosPendentesReportApi,
} from '../../types/prefeituraRelatorios'

export type CompiledReportHighlight = {
  label: string
  value: string
}

type CompiledRegistryItem<TReport> = {
  fetch: (
    accessToken: string,
    params: { periodStart: string; periodEnd: string },
  ) => Promise<TReport>
  Document: ComponentType<{
    report: TReport
    brandName: string
    logoUrl: string
    generatedAtLabel: string
  }>
  getHighlights: (report: TReport) => CompiledReportHighlight[]
  pdfOptions: { singlePage?: boolean; maxPages?: number }
}

export const PREFEITURA_RELATORIO_DISPLAY_ORDER: PrefeituraRelatorioId[] = [
  'producao-unidade',
  'fila-espera-abandono',
  'agenda-comparecimento',
  'ranking-ubts',
  'fluxo-terminal',
  'demanda-especialidade',
  'capacidade-ocupacao',
  'encaminhamentos-encaixes',
  'horarios-pico',
  'medicos-plantao',
  'duracao-media',
  'interrupcoes-reconexoes',
  'avaliacoes-atendimentos',
  'satisfacao-cidadao',
  'unidades-criticas',
  'novos-cadastros',
  'cadastros-incompletos',
  'pacientes-inativos',
  'perfil-territorial',
  'retornos-pendentes',
]

export const prefeituraRelatoriosCompiledRegistry: Record<
  PrefeituraRelatorioId,
  CompiledRegistryItem<never>
> = {
  'producao-unidade': {
    fetch: fetchPrefeituraProducaoUnidadeReport as CompiledRegistryItem<ProducaoUnidadeReportApi>['fetch'],
    Document: PrefeituraProducaoUnidadeReportDocument,
    getHighlights: (report: ProducaoUnidadeReportApi) => [
      { label: 'Produção no período', value: String(report.summary.periodTotal) },
      { label: 'Unidades', value: String(report.summary.unitsCount) },
    ],
    pdfOptions: { singlePage: true },
  },
  'fila-espera-abandono': {
    fetch: fetchPrefeituraFilaEsperaAbandonoReport as CompiledRegistryItem<FilaEsperaAbandonoReportApi>['fetch'],
    Document: PrefeituraFilaEsperaAbandonoReportDocument,
    getHighlights: (report: FilaEsperaAbandonoReportApi) => [
      {
        label: 'Espera média',
        value: report.summary.avgWaitMinutes > 0 ? `${report.summary.avgWaitMinutes} min` : '—',
      },
      { label: 'Taxa de abandono', value: `${report.summary.abandonmentRatePercent.toFixed(1).replace('.', ',')}%` },
    ],
    pdfOptions: { singlePage: true },
  },
  'agenda-comparecimento': {
    fetch: fetchPrefeituraAgendaComparecimentoReport as CompiledRegistryItem<AgendaComparecimentoReportApi>['fetch'],
    Document: PrefeituraAgendaComparecimentoReportDocument,
    getHighlights: (report: AgendaComparecimentoReportApi) => [
      { label: 'Agendamentos', value: String(report.summary.scheduled) },
      {
        label: 'Comparecimento',
        value: `${report.summary.attendanceRatePercent.toFixed(1).replace('.', ',')}%`,
      },
    ],
    pdfOptions: { maxPages: 2 },
  },
  'ranking-ubts': {
    fetch: fetchPrefeituraRankingUbtsReport as CompiledRegistryItem<RankingUbtsReportApi>['fetch'],
    Document: PrefeituraRankingUbtsReportDocument,
    getHighlights: (report: RankingUbtsReportApi) => [
      { label: 'Score da rede', value: report.summary.networkCompositeScore.toFixed(1).replace('.', ',') },
      { label: 'Líder', value: report.summary.topUnitName },
    ],
    pdfOptions: { maxPages: 2 },
  },
  'fluxo-terminal': {
    fetch: fetchPrefeituraFluxoTerminalReport as CompiledRegistryItem<FluxoTerminalReportApi>['fetch'],
    Document: PrefeituraFluxoTerminalReportDocument,
    getHighlights: (report: FluxoTerminalReportApi) => [
      { label: 'Chegadas', value: String(report.summary.arrivals) },
      {
        label: 'Conclusão da jornada',
        value: `${report.summary.completionRatePercent.toFixed(1).replace('.', ',')}%`,
      },
    ],
    pdfOptions: { maxPages: 2 },
  },
  'demanda-especialidade': {
    fetch: fetchPrefeituraDemandaEspecialidadeReport as CompiledRegistryItem<DemandaEspecialidadeReportApi>['fetch'],
    Document: PrefeituraDemandaEspecialidadeReportDocument,
    getHighlights: (report: DemandaEspecialidadeReportApi) => [
      { label: 'Solicitações', value: String(report.summary.requested) },
      {
        label: 'Conversão',
        value: `${report.summary.completionRatePercent.toFixed(1).replace('.', ',')}%`,
      },
    ],
    pdfOptions: { maxPages: 2 },
  },
  'capacidade-ocupacao': {
    fetch: fetchPrefeituraCapacidadeOcupacaoReport as CompiledRegistryItem<CapacidadeOcupacaoReportApi>['fetch'],
    Document: PrefeituraCapacidadeOcupacaoReportDocument,
    getHighlights: (report: CapacidadeOcupacaoReportApi) => [
      { label: 'Capacidade', value: String(report.summary.capacity) },
      {
        label: 'Ocupação',
        value: `${report.summary.occupancyPercent.toFixed(1).replace('.', ',')}%`,
      },
    ],
    pdfOptions: { maxPages: 2 },
  },
  'encaminhamentos-encaixes': {
    fetch: fetchPrefeituraEncaminhamentosEncaixesReport as CompiledRegistryItem<EncaminhamentosEncaixesReportApi>['fetch'],
    Document: PrefeituraEncaminhamentosEncaixesReportDocument,
    getHighlights: (report: EncaminhamentosEncaixesReportApi) => [
      { label: 'Não regular', value: String(report.summary.totalNonRegular) },
      { label: 'Encaixes', value: String(report.summary.encaixes) },
    ],
    pdfOptions: { maxPages: 2 },
  },
  'horarios-pico': {
    fetch: fetchPrefeituraHorariosPicoReport as CompiledRegistryItem<HorariosPicoReportApi>['fetch'],
    Document: PrefeituraHorariosPicoReportDocument,
    getHighlights: (report: HorariosPicoReportApi) => [
      { label: 'Pico horário', value: report.summary.peakHour },
      { label: 'Pico semanal', value: report.summary.peakWeekday },
    ],
    pdfOptions: { maxPages: 2 },
  },
  'medicos-plantao': {
    fetch: fetchPrefeituraMedicosPlantaoReport as CompiledRegistryItem<MedicosPlantaoReportApi>['fetch'],
    Document: PrefeituraMedicosPlantaoReportDocument,
    getHighlights: (report: MedicosPlantaoReportApi) => [
      { label: 'Plantões', value: String(report.summary.plantoesCount) },
      {
        label: 'Aderência',
        value: `${report.summary.adherencePercent.toFixed(1).replace('.', ',')}%`,
      },
    ],
    pdfOptions: { maxPages: 2 },
  },
  'duracao-media': {
    fetch: fetchPrefeituraDuracaoMediaReport as CompiledRegistryItem<DuracaoMediaReportApi>['fetch'],
    Document: PrefeituraDuracaoMediaReportDocument,
    getHighlights: (report: DuracaoMediaReportApi) => [
      { label: 'Duração média', value: `${report.summary.avgDurationMinutes.toFixed(1).replace('.', ',')} min` },
      { label: 'Outliers', value: String(report.summary.outliersCount) },
    ],
    pdfOptions: { maxPages: 2 },
  },
  'interrupcoes-reconexoes': {
    fetch: fetchPrefeituraInterrupcoesReconexoesReport as CompiledRegistryItem<InterrupcoesReconexoesReportApi>['fetch'],
    Document: PrefeituraInterrupcoesReconexoesReportDocument,
    getHighlights: (report: InterrupcoesReconexoesReportApi) => [
      { label: 'Interrupções', value: `${report.summary.interruptionRatePercent.toFixed(1).replace('.', ',')}%` },
      { label: 'Reconexões', value: String(report.summary.reconnections) },
    ],
    pdfOptions: { maxPages: 2 },
  },
  'avaliacoes-atendimentos': {
    fetch: fetchPrefeituraAvaliacoesAtendimentosReport as CompiledRegistryItem<AvaliacoesAtendimentosReportApi>['fetch'],
    Document: PrefeituraAvaliacoesAtendimentosReportDocument,
    getHighlights: (report: AvaliacoesAtendimentosReportApi) => [
      { label: 'Avaliações', value: String(report.summary.totalRatings) },
      { label: 'Nota média', value: report.summary.avgRating.toFixed(1).replace('.', ',') },
    ],
    pdfOptions: { maxPages: 2 },
  },
  'satisfacao-cidadao': {
    fetch: fetchPrefeituraSatisfacaoCidadaoReport as CompiledRegistryItem<SatisfacaoCidadaoReportApi>['fetch'],
    Document: PrefeituraSatisfacaoCidadaoReportDocument,
    getHighlights: (report: SatisfacaoCidadaoReportApi) => [
      { label: 'NPS', value: report.summary.nps.toFixed(1).replace('.', ',') },
      { label: 'Promotores', value: `${report.summary.promotersPercent.toFixed(1).replace('.', ',')}%` },
    ],
    pdfOptions: { maxPages: 2 },
  },
  'unidades-criticas': {
    fetch: fetchPrefeituraUnidadesCriticasReport as CompiledRegistryItem<UnidadesCriticasReportApi>['fetch'],
    Document: PrefeituraUnidadesCriticasReportDocument,
    getHighlights: (report: UnidadesCriticasReportApi) => [
      { label: 'Unidades críticas', value: String(report.summary.criticalUnitsCount) },
      { label: 'Itens de ação', value: String(report.summary.actionItemsCount) },
    ],
    pdfOptions: { maxPages: 2 },
  },
  'novos-cadastros': {
    fetch: fetchPrefeituraNovosCadastrosReport as CompiledRegistryItem<NovosCadastrosReportApi>['fetch'],
    Document: PrefeituraNovosCadastrosReportDocument,
    getHighlights: (report: NovosCadastrosReportApi) => [
      { label: 'Novos cadastros', value: String(report.summary.newRegistrations) },
      {
        label: 'Variação',
        value: `${report.summary.registrationsDeltaPercent.toFixed(1).replace('.', ',')}%`,
      },
    ],
    pdfOptions: { maxPages: 2 },
  },
  'cadastros-incompletos': {
    fetch: fetchPrefeituraCadastrosIncompletosReport as CompiledRegistryItem<CadastrosIncompletosReportApi>['fetch'],
    Document: PrefeituraCadastrosIncompletosReportDocument,
    getHighlights: (report: CadastrosIncompletosReportApi) => [
      { label: 'Cadastros incompletos', value: String(report.summary.incompleteCount) },
      {
        label: 'Taxa de incompletude',
        value: `${report.summary.incompleteRatePercent.toFixed(1).replace('.', ',')}%`,
      },
    ],
    pdfOptions: { maxPages: 2 },
  },
  'pacientes-inativos': {
    fetch: fetchPrefeituraPacientesInativosReport as CompiledRegistryItem<PacientesInativosReportApi>['fetch'],
    Document: PrefeituraPacientesInativosReportDocument,
    getHighlights: (report: PacientesInativosReportApi) => [
      { label: 'Pacientes inativos', value: String(report.summary.inactiveCount) },
      {
        label: 'Taxa de inatividade',
        value: `${report.summary.inactiveRatePercent.toFixed(1).replace('.', ',')}%`,
      },
    ],
    pdfOptions: { maxPages: 2 },
  },
  'perfil-territorial': {
    fetch: fetchPrefeituraPerfilTerritorialReport as CompiledRegistryItem<PerfilTerritorialReportApi>['fetch'],
    Document: PrefeituraPerfilTerritorialReportDocument,
    getHighlights: (report: PerfilTerritorialReportApi) => [
      { label: 'Base cadastral', value: String(report.summary.totalPatients) },
      {
        label: 'Cobertura territorial',
        value: `${report.summary.mappedPatientsPercent.toFixed(1).replace('.', ',')}%`,
      },
    ],
    pdfOptions: { maxPages: 2 },
  },
  'retornos-pendentes': {
    fetch: fetchPrefeituraRetornosPendentesReport as CompiledRegistryItem<RetornosPendentesReportApi>['fetch'],
    Document: PrefeituraRetornosPendentesReportDocument,
    getHighlights: (report: RetornosPendentesReportApi) => [
      { label: 'Retornos pendentes', value: String(report.summary.pendingCount) },
      { label: 'Atrasados', value: String(report.summary.overdueCount) },
    ],
    pdfOptions: { maxPages: 2 },
  },
}

export function sortPrefeituraRelatorioIds(reportIds: PrefeituraRelatorioId[]) {
  const order = new Map(PREFEITURA_RELATORIO_DISPLAY_ORDER.map((id, index) => [id, index]))
  return [...reportIds].sort(
    (left, right) => (order.get(left) ?? 999) - (order.get(right) ?? 999),
  )
}

export function parsePrefeituraRelatorioIdsParam(value: string | null): PrefeituraRelatorioId[] {
  if (!value) return []

  const supported = new Set(PREFEITURA_RELATORIO_DISPLAY_ORDER)
  const unique = new Set<PrefeituraRelatorioId>()

  for (const part of value.split(',')) {
    const id = part.trim() as PrefeituraRelatorioId
    if (supported.has(id)) unique.add(id)
  }

  return sortPrefeituraRelatorioIds([...unique])
}

export function findPrefeituraRelatorioCatalogMeta(reportId: string) {
  for (const category of prefeituraRelatorioCategoryCards) {
    const report = category.reports.find((item) => item.id === reportId)
    if (report) {
      return {
        categoryId: category.id,
        categoryTitle: category.title,
        categoryDescription: category.description,
        reportName: report.name,
        reportDescription: report.description,
      }
    }
  }

  return null
}

export function findPrefeituraRelatorioCategoryMeta(categoryId: string | null | undefined) {
  if (!categoryId) return null
  const category = prefeituraRelatorioCategoryCards.find((item) => item.id === categoryId)
  if (!category) return null
  return {
    categoryId: category.id,
    categoryTitle: category.title,
    categoryDescription: category.description,
  }
}
