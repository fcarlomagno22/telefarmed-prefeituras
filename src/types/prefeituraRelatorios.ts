import type { PrefeituraConsultasDailyPoint, PrefeituraConsultasKpi } from '../../data/prefeituraConsultasMock'
import type { PrefeituraConsultasUnitRow } from '../../data/prefeituraConsultasMock'

export type FluxoTerminalHighlight = {
  id: string
  title: string
  subtitle: string
  tone: 'red' | 'green' | 'amber' | 'blue'
}

export type FluxoTerminalFunnelStage = {
  stage: 'chegada' | 'triagem' | 'encaminhamento' | 'conclusao'
  label: string
  count: number
  conversionPercent: number
  avgMinutes: number
}

export type FluxoTerminalOriginRow = {
  origin: 'agendado' | 'espontaneo'
  label: string
  count: number
  completionRatePercent: number
}

export type FluxoTerminalReportUnitRow = {
  id: string
  name: string
  region: string
  regionKey: string
  arrivals: number
  triaged: number
  referred: number
  completed: number
  abandoned: number
  completionRatePercent: number
  avgTriageMinutes: number
  avgJourneyMinutes: number
  completionVsNetworkPp: number
}

export type FluxoTerminalReportApi = {
  reportId: 'fluxo-terminal'
  title: string
  description: string
  periodStart: string
  periodEnd: string
  periodLabel: string
  generatedAt: string
  entidadeRazaoSocial: string
  generatedBy: string
  summary: {
    arrivals: number
    triaged: number
    referred: number
    completed: number
    abandoned: number
    completionRatePercent: number
    avgTriageMinutes: number
    avgJourneyMinutes: number
    unitsCount: number
    arrivalsDeltaPercent: number
    completionDeltaPp: number
    kpis: PrefeituraConsultasKpi[]
  }
  highlights: FluxoTerminalHighlight[]
  funnel: FluxoTerminalFunnelStage[]
  origins: FluxoTerminalOriginRow[]
  units: FluxoTerminalReportUnitRow[]
  evolution: {
    mode: 'daily' | 'monthly'
    arrivalPoints: PrefeituraConsultasDailyPoint[]
    completionPoints: PrefeituraConsultasDailyPoint[]
    completionRatePoints: PrefeituraConsultasDailyPoint[]
    triageTimePoints: PrefeituraConsultasDailyPoint[]
  }
}

export type RankingUbtsHighlight = {
  id: string
  title: string
  subtitle: string
  tone: 'red' | 'green' | 'amber' | 'blue'
}

export type RankingUbtsDimensionRanking = {
  position: number
  unitId: string
  unitName: string
  region: string
  value: number
  valueLabel: string
  variationPercent: number
}

export type RankingUbtsReportUnitRow = {
  id: string
  name: string
  region: string
  regionKey: string
  rank: number
  production: number
  completionRatePercent: number
  abandonmentRatePercent: number
  avgWaitMinutes: number
  attendanceRatePercent: number
  avgRating: number
  goalFulfillmentPercent: number
  compositeScore: number
  slaStatus: 'normal' | 'atencao' | 'critico'
  productionDeltaPercent: number
  compositeDeltaPp: number
}

export type RankingUbtsReportApi = {
  reportId: 'ranking-ubts'
  title: string
  description: string
  periodStart: string
  periodEnd: string
  periodLabel: string
  generatedAt: string
  entidadeRazaoSocial: string
  generatedBy: string
  summary: {
    unitsCount: number
    totalProduction: number
    productionDeltaPercent: number
    avgGoalFulfillmentPercent: number
    networkCompositeScore: number
    compositeDeltaPp: number
    unitsMeetingGoals: number
    topUnitName: string
    kpis: PrefeituraConsultasKpi[]
  }
  highlights: RankingUbtsHighlight[]
  units: RankingUbtsReportUnitRow[]
  rankings: {
    producao: RankingUbtsDimensionRanking[]
    eficiencia: RankingUbtsDimensionRanking[]
    abandono: RankingUbtsDimensionRanking[]
    metas: RankingUbtsDimensionRanking[]
  }
  evolution: {
    mode: 'daily' | 'monthly'
    compositePoints: PrefeituraConsultasDailyPoint[]
    productionPoints: PrefeituraConsultasDailyPoint[]
    goalPoints: PrefeituraConsultasDailyPoint[]
  }
  goals: {
    completionRatePercent: number
    maxAbandonmentRatePercent: number
    maxWaitMinutes: number
    minAttendanceRatePercent: number
  }
}

export type AgendaComparecimentoHighlight = {
  id: string
  title: string
  subtitle: string
  tone: 'red' | 'green' | 'amber' | 'blue'
}

export type AgendaComparecimentoReportUnitRow = {
  id: string
  name: string
  region: string
  regionKey: string
  scheduled: number
  attended: number
  noShows: number
  pending: number
  rescheduled: number
  attendanceRatePercent: number
  absenceRatePercent: number
  attendanceVsNetworkPp: number
}

export type AgendaComparecimentoReportApi = {
  reportId: 'agenda-comparecimento'
  title: string
  description: string
  periodStart: string
  periodEnd: string
  periodLabel: string
  generatedAt: string
  entidadeRazaoSocial: string
  generatedBy: string
  summary: {
    scheduled: number
    attended: number
    noShows: number
    pending: number
    rescheduled: number
    attendanceRatePercent: number
    unitsCount: number
    attendanceDeltaPp: number
    noShowsDeltaPercent: number
    scheduledDeltaPercent: number
    kpis: PrefeituraConsultasKpi[]
  }
  highlights: AgendaComparecimentoHighlight[]
  units: AgendaComparecimentoReportUnitRow[]
  evolution: {
    mode: 'daily' | 'monthly'
    attendancePoints: PrefeituraConsultasDailyPoint[]
    noShowPoints: PrefeituraConsultasDailyPoint[]
    rescheduledPoints: PrefeituraConsultasDailyPoint[]
    volumePoints: PrefeituraConsultasDailyPoint[]
  }
}

export type FilaEsperaAbandonoReportUnitRow = {
  id: string
  name: string
  address: string
  region: string
  regionKey: string
  queueNow: number
  avgWaitMinutes: number
  filaProcessed: number
  abandoned: number
  cancelled: number
  completed: number
  abandonmentRatePercent: number
  absencesTotal: number
  waitVsNetworkMinutes: number
  abandonmentVsNetworkPp: number
}

export type FilaEsperaAbandonoReportApi = {
  reportId: 'fila-espera-abandono'
  title: string
  description: string
  periodStart: string
  periodEnd: string
  periodLabel: string
  generatedAt: string
  entidadeRazaoSocial: string
  generatedBy: string
  summary: {
    queueNow: number
    filaProcessed: number
    avgWaitMinutes: number
    abandonmentRatePercent: number
    absencesTotal: number
    unitsCount: number
    avgWaitDeltaMinutes: number
    abandonmentDeltaPp: number
    filaProcessedDeltaPercent: number
    kpis: PrefeituraConsultasKpi[]
  }
  units: FilaEsperaAbandonoReportUnitRow[]
  evolution: {
    mode: 'daily' | 'monthly'
    waitPoints: PrefeituraConsultasDailyPoint[]
    abandonmentPoints: PrefeituraConsultasDailyPoint[]
    volumePoints: PrefeituraConsultasDailyPoint[]
  }
}

export type ProducaoUnidadeReportUnitRow = PrefeituraConsultasUnitRow & {
  sharePercent: number
  volumeVsNetworkPercent: number
}

export type ProducaoUnidadeReportApi = {
  reportId: 'producao-unidade'
  title: string
  description: string
  periodStart: string
  periodEnd: string
  periodLabel: string
  generatedAt: string
  entidadeRazaoSocial: string
  generatedBy: string
  summary: {
    periodTotal: number
    unitsCount: number
    networkAvgVolume: number
    volumeDeltaPercent: number
    kpis: PrefeituraConsultasKpi[]
  }
  units: ProducaoUnidadeReportUnitRow[]
  evolution: {
    mode: 'daily' | 'monthly'
    points: PrefeituraConsultasDailyPoint[]
  }
}

export type DemandaEspecialidadeHighlight = {
  id: string
  title: string
  subtitle: string
  tone: 'red' | 'green' | 'amber' | 'blue'
}

export type DemandaEspecialidadeSpecialtyRow = {
  id: string
  name: string
  requested: number
  agendaCount: number
  filaCount: number
  completed: number
  completionRatePercent: number
  sharePercent: number
  requestedDeltaPercent: number
}

export type DemandaEspecialidadeReportUnitRow = {
  id: string
  name: string
  region: string
  regionKey: string
  requested: number
  completed: number
  completionRatePercent: number
  topSpecialtyName: string
  topSpecialtySharePercent: number
  completionVsNetworkPp: number
}

export type DemandaEspecialidadeReportApi = {
  reportId: 'demanda-especialidade'
  title: string
  description: string
  periodStart: string
  periodEnd: string
  periodLabel: string
  generatedAt: string
  entidadeRazaoSocial: string
  generatedBy: string
  summary: {
    requested: number
    completed: number
    completionRatePercent: number
    specialtiesCount: number
    topSpecialtyName: string
    unitsCount: number
    requestedDeltaPercent: number
    completionDeltaPp: number
    kpis: PrefeituraConsultasKpi[]
  }
  highlights: DemandaEspecialidadeHighlight[]
  specialties: DemandaEspecialidadeSpecialtyRow[]
  units: DemandaEspecialidadeReportUnitRow[]
  evolution: {
    mode: 'daily' | 'monthly'
    volumePoints: PrefeituraConsultasDailyPoint[]
    completionPoints: PrefeituraConsultasDailyPoint[]
    completionRatePoints: PrefeituraConsultasDailyPoint[]
  }
}

export type CapacidadeOcupacaoHighlight = {
  id: string
  title: string
  subtitle: string
  tone: 'red' | 'green' | 'amber' | 'blue'
}

export type CapacidadeOcupacaoSpecialtyRow = {
  id: string
  name: string
  capacity: number
  booked: number
  occupancyPercent: number
  sharePercent: number
}

export type CapacidadeOcupacaoReportUnitRow = {
  id: string
  name: string
  region: string
  regionKey: string
  capacity: number
  booked: number
  occupancyPercent: number
  occupancyVsNetworkPp: number
}

export type CapacidadeOcupacaoReportApi = {
  reportId: 'capacidade-ocupacao'
  title: string
  description: string
  periodStart: string
  periodEnd: string
  periodLabel: string
  generatedAt: string
  entidadeRazaoSocial: string
  generatedBy: string
  summary: {
    capacity: number
    booked: number
    occupancyPercent: number
    specialtiesCount: number
    unitsCount: number
    occupancyDeltaPp: number
    bookedDeltaPercent: number
    kpis: PrefeituraConsultasKpi[]
  }
  highlights: CapacidadeOcupacaoHighlight[]
  specialties: CapacidadeOcupacaoSpecialtyRow[]
  units: CapacidadeOcupacaoReportUnitRow[]
  evolution: {
    mode: 'daily' | 'monthly'
    occupancyPoints: PrefeituraConsultasDailyPoint[]
    bookedPoints: PrefeituraConsultasDailyPoint[]
  }
}

export type EncaminhamentosEncaixesHighlight = {
  id: string
  title: string
  subtitle: string
  tone: 'red' | 'green' | 'amber' | 'blue'
}

export type EncaminhamentosEncaixesBreakdownRow = {
  key: 'encaixe' | 'retorno' | 'consulta' | 'espontaneo' | 'encaminhamento_fila'
  label: string
  count: number
  sharePercent: number
  completionRatePercent: number
}

export type EncaminhamentosEncaixesReportUnitRow = {
  id: string
  name: string
  region: string
  regionKey: string
  encaixes: number
  retornos: number
  consultasRegulares: number
  espontaneos: number
  encaminhamentosFila: number
  totalNonRegular: number
  sharePercent: number
}

export type EncaminhamentosEncaixesReportApi = {
  reportId: 'encaminhamentos-encaixes'
  title: string
  description: string
  periodStart: string
  periodEnd: string
  periodLabel: string
  generatedAt: string
  entidadeRazaoSocial: string
  generatedBy: string
  summary: {
    totalNonRegular: number
    encaixes: number
    retornos: number
    consultasRegulares: number
    espontaneos: number
    encaminhamentosFila: number
    unitsCount: number
    totalDeltaPercent: number
    kpis: PrefeituraConsultasKpi[]
  }
  highlights: EncaminhamentosEncaixesHighlight[]
  breakdown: EncaminhamentosEncaixesBreakdownRow[]
  units: EncaminhamentosEncaixesReportUnitRow[]
  evolution: {
    mode: 'daily' | 'monthly'
    volumePoints: PrefeituraConsultasDailyPoint[]
    encaixePoints: PrefeituraConsultasDailyPoint[]
    espontaneoPoints: PrefeituraConsultasDailyPoint[]
  }
}

export type HorariosPicoHighlight = {
  id: string
  title: string
  subtitle: string
  tone: 'red' | 'green' | 'amber' | 'blue'
}

export type HorariosPicoHourlyRow = {
  bucketIndex: number
  hour: string
  filaCount: number
  agendaCount: number
  totalCount: number
}

export type HorariosPicoWeekdayRow = {
  weekday: number
  label: string
  filaCount: number
  agendaCount: number
  totalCount: number
}

export type HorariosPicoReportUnitRow = {
  id: string
  name: string
  region: string
  regionKey: string
  peakHour: string
  peakWeekday: string
  peakVolume: number
  filaPeakHour: string
  agendaPeakHour: string
}

export type HorariosPicoReportApi = {
  reportId: 'horarios-pico'
  title: string
  description: string
  periodStart: string
  periodEnd: string
  periodLabel: string
  generatedAt: string
  entidadeRazaoSocial: string
  generatedBy: string
  summary: {
    peakHour: string
    peakWeekday: string
    peakHourVolume: number
    peakDayVolume: number
    totalVolume: number
    unitsCount: number
    volumeDeltaPercent: number
    kpis: PrefeituraConsultasKpi[]
  }
  highlights: HorariosPicoHighlight[]
  hourly: HorariosPicoHourlyRow[]
  weekday: HorariosPicoWeekdayRow[]
  units: HorariosPicoReportUnitRow[]
  evolution: {
    mode: 'daily' | 'monthly'
    volumePoints: PrefeituraConsultasDailyPoint[]
  }
}

export type MedicosPlantaoHighlight = {
  id: string
  title: string
  subtitle: string
  tone: 'red' | 'green' | 'amber' | 'blue'
}

export type MedicosPlantaoProfessionalRow = {
  id: string
  name: string
  plantoesCount: number
  scheduledConsultas: number
  completedConsultas: number
  adherencePercent: number
  especialidadeName: string
}

export type MedicosPlantaoReportUnitRow = {
  id: string
  name: string
  region: string
  regionKey: string
  plantoesCount: number
  scheduledConsultas: number
  completedConsultas: number
  adherencePercent: number
}

export type MedicosPlantaoReportApi = {
  reportId: 'medicos-plantao'
  title: string
  description: string
  periodStart: string
  periodEnd: string
  periodLabel: string
  generatedAt: string
  entidadeRazaoSocial: string
  generatedBy: string
  summary: {
    plantoesCount: number
    professionalsCount: number
    scheduledConsultas: number
    completedConsultas: number
    adherencePercent: number
    avgConsultasPerPlantao: number
    unitsCount: number
    plantoesDeltaPercent: number
    adherenceDeltaPp: number
    kpis: PrefeituraConsultasKpi[]
  }
  highlights: MedicosPlantaoHighlight[]
  professionals: MedicosPlantaoProfessionalRow[]
  units: MedicosPlantaoReportUnitRow[]
  evolution: {
    mode: 'daily' | 'monthly'
    plantoesPoints: PrefeituraConsultasDailyPoint[]
    consultasPoints: PrefeituraConsultasDailyPoint[]
  }
}

export type DuracaoMediaHighlight = {
  id: string
  title: string
  subtitle: string
  tone: 'red' | 'green' | 'amber' | 'blue'
}

export type DuracaoMediaSpecialtyRow = {
  id: string
  name: string
  avgDurationMinutes: number
  medianDurationMinutes: number
  completedCount: number
  sharePercent: number
  avgDurationDeltaMinutes: number
  isOutlier: boolean
}

export type DuracaoMediaProfessionalRow = {
  id: string
  name: string
  especialidadeName: string
  avgDurationMinutes: number
  completedCount: number
  isOutlier: boolean
}

export type DuracaoMediaReportUnitRow = {
  id: string
  name: string
  region: string
  regionKey: string
  avgDurationMinutes: number
  medianDurationMinutes: number
  completedCount: number
  durationVsNetworkMinutes: number
  isOutlier: boolean
}

export type DuracaoMediaReportApi = {
  reportId: 'duracao-media'
  title: string
  description: string
  periodStart: string
  periodEnd: string
  periodLabel: string
  generatedAt: string
  entidadeRazaoSocial: string
  generatedBy: string
  summary: {
    avgDurationMinutes: number
    medianDurationMinutes: number
    completedCount: number
    specialtiesCount: number
    unitsCount: number
    outliersCount: number
    avgDurationDeltaMinutes: number
    kpis: PrefeituraConsultasKpi[]
  }
  highlights: DuracaoMediaHighlight[]
  specialties: DuracaoMediaSpecialtyRow[]
  professionals: DuracaoMediaProfessionalRow[]
  units: DuracaoMediaReportUnitRow[]
  evolution: {
    mode: 'daily' | 'monthly'
    durationPoints: PrefeituraConsultasDailyPoint[]
    volumePoints: PrefeituraConsultasDailyPoint[]
  }
}

export type InterrupcoesReconexoesHighlight = {
  id: string
  title: string
  subtitle: string
  tone: 'red' | 'green' | 'amber' | 'blue'
}

export type InterrupcoesReconexoesBreakdownRow = {
  key: 'interrupcao' | 'reconexao' | 'normal'
  label: string
  count: number
  sharePercent: number
  completionRatePercent: number
}

export type InterrupcoesReconexoesReportUnitRow = {
  id: string
  name: string
  region: string
  regionKey: string
  totalConsultas: number
  interruptions: number
  reconnections: number
  interruptionRatePercent: number
  reconnectionRatePercent: number
  completionRatePercent: number
  completionVsNetworkPp: number
}

export type InterrupcoesReconexoesReportApi = {
  reportId: 'interrupcoes-reconexoes'
  title: string
  description: string
  periodStart: string
  periodEnd: string
  periodLabel: string
  generatedAt: string
  entidadeRazaoSocial: string
  generatedBy: string
  summary: {
    totalConsultas: number
    interruptions: number
    reconnections: number
    interruptionRatePercent: number
    reconnectionRatePercent: number
    completionRatePercent: number
    unitsCount: number
    interruptionDeltaPp: number
    completionDeltaPp: number
    kpis: PrefeituraConsultasKpi[]
  }
  highlights: InterrupcoesReconexoesHighlight[]
  breakdown: InterrupcoesReconexoesBreakdownRow[]
  units: InterrupcoesReconexoesReportUnitRow[]
  evolution: {
    mode: 'daily' | 'monthly'
    interruptionPoints: PrefeituraConsultasDailyPoint[]
    reconnectionPoints: PrefeituraConsultasDailyPoint[]
    completionRatePoints: PrefeituraConsultasDailyPoint[]
  }
}

export type AvaliacoesAtendimentosHighlight = {
  id: string
  title: string
  subtitle: string
  tone: 'red' | 'green' | 'amber' | 'blue'
}

export type AvaliacoesAtendimentosDistributionRow = {
  rating: number
  count: number
  sharePercent: number
}

export type AvaliacoesAtendimentosCommentRow = {
  id: string
  unitName: string
  professionalName: string
  rating: number
  comment: string
  avaliadoEm: string
}

export type AvaliacoesAtendimentosReportUnitRow = {
  id: string
  name: string
  region: string
  regionKey: string
  ratingsCount: number
  avgRating: number
  avgNotaProfissional: number
  avgNotaTeleconsulta: number
  avgRatingVsNetworkPp: number
}

export type AvaliacoesAtendimentosReportApi = {
  reportId: 'avaliacoes-atendimentos'
  title: string
  description: string
  periodStart: string
  periodEnd: string
  periodLabel: string
  generatedAt: string
  entidadeRazaoSocial: string
  generatedBy: string
  summary: {
    totalRatings: number
    avgRating: number
    avgNotaProfissional: number
    avgNotaTeleconsulta: number
    unitsCount: number
    ratingsDeltaPercent: number
    avgRatingDeltaPp: number
    kpis: PrefeituraConsultasKpi[]
  }
  highlights: AvaliacoesAtendimentosHighlight[]
  distribution: AvaliacoesAtendimentosDistributionRow[]
  comments: AvaliacoesAtendimentosCommentRow[]
  units: AvaliacoesAtendimentosReportUnitRow[]
  evolution: {
    mode: 'daily' | 'monthly'
    ratingCountPoints: PrefeituraConsultasDailyPoint[]
    avgRatingPoints: PrefeituraConsultasDailyPoint[]
  }
}

export type SatisfacaoCidadaoHighlight = {
  id: string
  title: string
  subtitle: string
  tone: 'red' | 'green' | 'amber' | 'blue'
}

export type SatisfacaoCidadaoDimensionRow = {
  key: 'profissional' | 'teleconsulta' | 'geral'
  label: string
  avgScore: number
  deltaPp: number
}

export type SatisfacaoCidadaoReportUnitRow = {
  id: string
  name: string
  region: string
  regionKey: string
  nps: number
  avgRating: number
  ratingsCount: number
  npsVsNetworkPp: number
}

export type SatisfacaoCidadaoReportApi = {
  reportId: 'satisfacao-cidadao'
  title: string
  description: string
  periodStart: string
  periodEnd: string
  periodLabel: string
  generatedAt: string
  entidadeRazaoSocial: string
  generatedBy: string
  summary: {
    nps: number
    promotersPercent: number
    passivesPercent: number
    detractorsPercent: number
    avgRating: number
    ratingsCount: number
    unitsCount: number
    npsDeltaPp: number
    avgRatingDeltaPp: number
    kpis: PrefeituraConsultasKpi[]
  }
  highlights: SatisfacaoCidadaoHighlight[]
  dimensions: SatisfacaoCidadaoDimensionRow[]
  units: SatisfacaoCidadaoReportUnitRow[]
  evolution: {
    mode: 'daily' | 'monthly'
    npsPoints: PrefeituraConsultasDailyPoint[]
    avgRatingPoints: PrefeituraConsultasDailyPoint[]
  }
}

export type UnidadesCriticasHighlight = {
  id: string
  title: string
  subtitle: string
  tone: 'red' | 'green' | 'amber' | 'blue'
}

export type UnidadesCriticasIssueRow = {
  key: string
  label: string
  value: number
  threshold: number
  direction: 'below' | 'above'
}

export type UnidadesCriticasReportUnitRow = {
  id: string
  name: string
  region: string
  regionKey: string
  severity: 'critico' | 'atencao'
  issuesCount: number
  completionRatePercent: number
  avgRating: number
  interruptionRatePercent: number
  nps: number
  avgDurationMinutes: number
  issues: UnidadesCriticasIssueRow[]
}

export type UnidadesCriticasSpecialtyRow = {
  id: string
  name: string
  unitId: string
  unitName: string
  severity: 'critico' | 'atencao'
  issuesCount: number
  issues: UnidadesCriticasIssueRow[]
}

export type UnidadesCriticasReportApi = {
  reportId: 'unidades-criticas'
  title: string
  description: string
  periodStart: string
  periodEnd: string
  periodLabel: string
  generatedAt: string
  entidadeRazaoSocial: string
  generatedBy: string
  summary: {
    criticalUnitsCount: number
    criticalSpecialtiesCount: number
    unitsCount: number
    actionItemsCount: number
    criticalDeltaCount: number
    kpis: PrefeituraConsultasKpi[]
  }
  highlights: UnidadesCriticasHighlight[]
  thresholds: {
    minCompletionRatePercent: number
    maxAbandonmentRatePercent: number
    minAvgRating: number
    maxInterruptionRatePercent: number
    minNps: number
    maxAvgDurationMinutes: number
    minAvgDurationMinutes: number
  }
  units: UnidadesCriticasReportUnitRow[]
  specialties: UnidadesCriticasSpecialtyRow[]
  evolution: {
    mode: 'daily' | 'monthly'
    criticalCountPoints: PrefeituraConsultasDailyPoint[]
  }
}

export type PatientReportHighlight = {
  id: string
  title: string
  subtitle: string
  tone: 'red' | 'green' | 'amber' | 'blue'
}

export type PatientReportUnitRow = {
  id: string
  name: string
  region: string
  regionKey: string
  count: number
  sharePercent: number
}

export type NovosCadastrosChannelRow = {
  key: string
  label: string
  count: number
  sharePercent: number
}

export type NovosCadastrosReportApi = {
  reportId: 'novos-cadastros'
  title: string
  description: string
  periodStart: string
  periodEnd: string
  periodLabel: string
  generatedAt: string
  entidadeRazaoSocial: string
  generatedBy: string
  summary: {
    newRegistrations: number
    previousNewRegistrations: number
    registrationsDeltaPercent: number
    channelsCount: number
    unitsCount: number
    avgPerDay: number
    kpis: PrefeituraConsultasKpi[]
  }
  highlights: PatientReportHighlight[]
  channels: NovosCadastrosChannelRow[]
  units: PatientReportUnitRow[]
  evolution: {
    mode: 'daily' | 'monthly'
    registrationPoints: PrefeituraConsultasDailyPoint[]
  }
}

export type CadastrosIncompletosFieldRow = {
  key: string
  label: string
  count: number
  sharePercent: number
}

export type CadastrosIncompletosSampleRow = {
  id: string
  name: string
  unitName: string
  missingFields: string[]
  missingCount: number
}

export type CadastrosIncompletosReportApi = {
  reportId: 'cadastros-incompletos'
  title: string
  description: string
  periodStart: string
  periodEnd: string
  periodLabel: string
  generatedAt: string
  entidadeRazaoSocial: string
  generatedBy: string
  summary: {
    incompleteCount: number
    totalPatients: number
    incompleteRatePercent: number
    unitsCount: number
    incompleteDeltaCount: number
    kpis: PrefeituraConsultasKpi[]
  }
  highlights: PatientReportHighlight[]
  fields: CadastrosIncompletosFieldRow[]
  units: PatientReportUnitRow[]
  samples: CadastrosIncompletosSampleRow[]
  evolution: {
    mode: 'daily' | 'monthly'
    incompletePoints: PrefeituraConsultasDailyPoint[]
  }
}

export type PacientesInativosBandRow = {
  key: '6m' | '12m' | 'never'
  label: string
  count: number
  sharePercent: number
}

export type PacientesInativosReportApi = {
  reportId: 'pacientes-inativos'
  title: string
  description: string
  periodStart: string
  periodEnd: string
  periodLabel: string
  generatedAt: string
  entidadeRazaoSocial: string
  generatedBy: string
  summary: {
    inactiveCount: number
    totalPatients: number
    inactiveRatePercent: number
    neverConsultedCount: number
    unitsCount: number
    inactiveDeltaCount: number
    kpis: PrefeituraConsultasKpi[]
  }
  highlights: PatientReportHighlight[]
  bands: PacientesInativosBandRow[]
  units: PatientReportUnitRow[]
  evolution: {
    mode: 'daily' | 'monthly'
    inactivePoints: PrefeituraConsultasDailyPoint[]
  }
}

export type PerfilTerritorialNeighborhoodRow = {
  key: string
  label: string
  patientsCount: number
  sharePercent: number
}

export type PerfilTerritorialRegionRow = {
  key: string
  label: string
  patientsCount: number
  sharePercent: number
}

export type PerfilTerritorialReportApi = {
  reportId: 'perfil-territorial'
  title: string
  description: string
  periodStart: string
  periodEnd: string
  periodLabel: string
  generatedAt: string
  entidadeRazaoSocial: string
  generatedBy: string
  summary: {
    totalPatients: number
    neighborhoodsCount: number
    regionsCount: number
    mappedPatientsPercent: number
    unitsCount: number
    newInPeriod: number
    kpis: PrefeituraConsultasKpi[]
  }
  highlights: PatientReportHighlight[]
  neighborhoods: PerfilTerritorialNeighborhoodRow[]
  regions: PerfilTerritorialRegionRow[]
  units: PatientReportUnitRow[]
  evolution: {
    mode: 'daily' | 'monthly'
    patientsPoints: PrefeituraConsultasDailyPoint[]
  }
}

export type RetornosPendentesBreakdownRow = {
  key: 'nao_agendado' | 'nao_realizado' | 'atrasado'
  label: string
  count: number
  sharePercent: number
}

export type RetornosPendentesPatientRow = {
  id: string
  patientName: string
  unitName: string
  scheduledDate: string
  status: string
  kind: 'nao_agendado' | 'nao_realizado'
  daysOverdue: number
}

export type RetornosPendentesReportApi = {
  reportId: 'retornos-pendentes'
  title: string
  description: string
  periodStart: string
  periodEnd: string
  periodLabel: string
  generatedAt: string
  entidadeRazaoSocial: string
  generatedBy: string
  summary: {
    pendingCount: number
    notScheduledCount: number
    notPerformedCount: number
    overdueCount: number
    unitsCount: number
    pendingDeltaCount: number
    kpis: PrefeituraConsultasKpi[]
  }
  highlights: PatientReportHighlight[]
  breakdown: RetornosPendentesBreakdownRow[]
  units: PatientReportUnitRow[]
  patients: RetornosPendentesPatientRow[]
  evolution: {
    mode: 'daily' | 'monthly'
    pendingPoints: PrefeituraConsultasDailyPoint[]
  }
}

export type PrefeituraRelatorioId =
  | 'producao-unidade'
  | 'fila-espera-abandono'
  | 'agenda-comparecimento'
  | 'ranking-ubts'
  | 'fluxo-terminal'
  | 'demanda-especialidade'
  | 'capacidade-ocupacao'
  | 'encaminhamentos-encaixes'
  | 'horarios-pico'
  | 'medicos-plantao'
  | 'duracao-media'
  | 'interrupcoes-reconexoes'
  | 'avaliacoes-atendimentos'
  | 'satisfacao-cidadao'
  | 'unidades-criticas'
  | 'novos-cadastros'
  | 'cadastros-incompletos'
  | 'pacientes-inativos'
  | 'perfil-territorial'
  | 'retornos-pendentes'

export const SUPPORTED_PREFEITURA_RELATORIO_IDS = new Set<PrefeituraRelatorioId>([
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
])
