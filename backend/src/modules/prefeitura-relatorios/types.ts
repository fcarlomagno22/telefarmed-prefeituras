import type {
  PrefeituraConsultasDailyPointDto,
  PrefeituraConsultasKpiDto,
  PrefeituraConsultasUnitRowDto,
} from '../prefeitura-consultas/types.js'

export type RankingUbtsHighlightDto = {
  id: string
  title: string
  subtitle: string
  tone: 'red' | 'green' | 'amber' | 'blue'
}

export type RankingUbtsDimensionRankingDto = {
  position: number
  unitId: string
  unitName: string
  region: string
  value: number
  valueLabel: string
  variationPercent: number
}

export type RankingUbtsReportUnitRowDto = {
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

export type RankingUbtsReportDto = {
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
    kpis: PrefeituraConsultasKpiDto[]
  }
  highlights: RankingUbtsHighlightDto[]
  units: RankingUbtsReportUnitRowDto[]
  rankings: {
    producao: RankingUbtsDimensionRankingDto[]
    eficiencia: RankingUbtsDimensionRankingDto[]
    abandono: RankingUbtsDimensionRankingDto[]
    metas: RankingUbtsDimensionRankingDto[]
  }
  evolution: {
    mode: 'daily' | 'monthly'
    compositePoints: PrefeituraConsultasDailyPointDto[]
    productionPoints: PrefeituraConsultasDailyPointDto[]
    goalPoints: PrefeituraConsultasDailyPointDto[]
  }
  goals: {
    completionRatePercent: number
    maxAbandonmentRatePercent: number
    maxWaitMinutes: number
    minAttendanceRatePercent: number
  }
}

export type AgendaComparecimentoHighlightDto = {
  id: string
  title: string
  subtitle: string
  tone: 'red' | 'green' | 'amber' | 'blue'
}

export type AgendaComparecimentoReportUnitRowDto = {
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

export type AgendaComparecimentoReportDto = {
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
    kpis: PrefeituraConsultasKpiDto[]
  }
  highlights: AgendaComparecimentoHighlightDto[]
  units: AgendaComparecimentoReportUnitRowDto[]
  evolution: {
    mode: 'daily' | 'monthly'
    attendancePoints: PrefeituraConsultasDailyPointDto[]
    noShowPoints: PrefeituraConsultasDailyPointDto[]
    rescheduledPoints: PrefeituraConsultasDailyPointDto[]
    volumePoints: PrefeituraConsultasDailyPointDto[]
  }
}

export type FilaEsperaAbandonoReportUnitRowDto = {
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

export type FilaEsperaAbandonoReportDto = {
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
    kpis: PrefeituraConsultasKpiDto[]
  }
  units: FilaEsperaAbandonoReportUnitRowDto[]
  evolution: {
    mode: 'daily' | 'monthly'
    waitPoints: PrefeituraConsultasDailyPointDto[]
    abandonmentPoints: PrefeituraConsultasDailyPointDto[]
    volumePoints: PrefeituraConsultasDailyPointDto[]
  }
}

export type ProducaoUnidadeReportUnitRowDto = PrefeituraConsultasUnitRowDto & {
  sharePercent: number
  volumeVsNetworkPercent: number
}

export type FluxoTerminalHighlightDto = {
  id: string
  title: string
  subtitle: string
  tone: 'red' | 'green' | 'amber' | 'blue'
}

export type FluxoTerminalFunnelStageDto = {
  stage: 'chegada' | 'triagem' | 'encaminhamento' | 'conclusao'
  label: string
  count: number
  conversionPercent: number
  avgMinutes: number
}

export type FluxoTerminalOriginRowDto = {
  origin: 'agendado' | 'espontaneo'
  label: string
  count: number
  completionRatePercent: number
}

export type FluxoTerminalReportUnitRowDto = {
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

export type FluxoTerminalReportDto = {
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
    kpis: PrefeituraConsultasKpiDto[]
  }
  highlights: FluxoTerminalHighlightDto[]
  funnel: FluxoTerminalFunnelStageDto[]
  origins: FluxoTerminalOriginRowDto[]
  units: FluxoTerminalReportUnitRowDto[]
  evolution: {
    mode: 'daily' | 'monthly'
    arrivalPoints: PrefeituraConsultasDailyPointDto[]
    completionPoints: PrefeituraConsultasDailyPointDto[]
    completionRatePoints: PrefeituraConsultasDailyPointDto[]
    triageTimePoints: PrefeituraConsultasDailyPointDto[]
  }
}

export type ProducaoUnidadeReportDto = {
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
    kpis: PrefeituraConsultasKpiDto[]
  }
  units: ProducaoUnidadeReportUnitRowDto[]
  evolution: {
    mode: 'daily' | 'monthly'
    points: PrefeituraConsultasDailyPointDto[]
  }
}

export type DemandaEspecialidadeHighlightDto = {
  id: string
  title: string
  subtitle: string
  tone: 'red' | 'green' | 'amber' | 'blue'
}

export type DemandaEspecialidadeSpecialtyRowDto = {
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

export type DemandaEspecialidadeReportUnitRowDto = {
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

export type DemandaEspecialidadeReportDto = {
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
    kpis: PrefeituraConsultasKpiDto[]
  }
  highlights: DemandaEspecialidadeHighlightDto[]
  specialties: DemandaEspecialidadeSpecialtyRowDto[]
  units: DemandaEspecialidadeReportUnitRowDto[]
  evolution: {
    mode: 'daily' | 'monthly'
    volumePoints: PrefeituraConsultasDailyPointDto[]
    completionPoints: PrefeituraConsultasDailyPointDto[]
    completionRatePoints: PrefeituraConsultasDailyPointDto[]
  }
}

export type CapacidadeOcupacaoHighlightDto = {
  id: string
  title: string
  subtitle: string
  tone: 'red' | 'green' | 'amber' | 'blue'
}

export type CapacidadeOcupacaoSpecialtyRowDto = {
  id: string
  name: string
  capacity: number
  booked: number
  occupancyPercent: number
  sharePercent: number
}

export type CapacidadeOcupacaoReportUnitRowDto = {
  id: string
  name: string
  region: string
  regionKey: string
  capacity: number
  booked: number
  occupancyPercent: number
  occupancyVsNetworkPp: number
}

export type CapacidadeOcupacaoReportDto = {
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
    kpis: PrefeituraConsultasKpiDto[]
  }
  highlights: CapacidadeOcupacaoHighlightDto[]
  specialties: CapacidadeOcupacaoSpecialtyRowDto[]
  units: CapacidadeOcupacaoReportUnitRowDto[]
  evolution: {
    mode: 'daily' | 'monthly'
    occupancyPoints: PrefeituraConsultasDailyPointDto[]
    bookedPoints: PrefeituraConsultasDailyPointDto[]
  }
}

export type EncaminhamentosEncaixesHighlightDto = {
  id: string
  title: string
  subtitle: string
  tone: 'red' | 'green' | 'amber' | 'blue'
}

export type EncaminhamentosEncaixesBreakdownRowDto = {
  key: 'encaixe' | 'retorno' | 'consulta' | 'espontaneo' | 'encaminhamento_fila'
  label: string
  count: number
  sharePercent: number
  completionRatePercent: number
}

export type EncaminhamentosEncaixesReportUnitRowDto = {
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

export type EncaminhamentosEncaixesReportDto = {
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
    kpis: PrefeituraConsultasKpiDto[]
  }
  highlights: EncaminhamentosEncaixesHighlightDto[]
  breakdown: EncaminhamentosEncaixesBreakdownRowDto[]
  units: EncaminhamentosEncaixesReportUnitRowDto[]
  evolution: {
    mode: 'daily' | 'monthly'
    volumePoints: PrefeituraConsultasDailyPointDto[]
    encaixePoints: PrefeituraConsultasDailyPointDto[]
    espontaneoPoints: PrefeituraConsultasDailyPointDto[]
  }
}

export type HorariosPicoHighlightDto = {
  id: string
  title: string
  subtitle: string
  tone: 'red' | 'green' | 'amber' | 'blue'
}

export type HorariosPicoHourlyRowDto = {
  bucketIndex: number
  hour: string
  filaCount: number
  agendaCount: number
  totalCount: number
}

export type HorariosPicoWeekdayRowDto = {
  weekday: number
  label: string
  filaCount: number
  agendaCount: number
  totalCount: number
}

export type HorariosPicoReportUnitRowDto = {
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

export type HorariosPicoReportDto = {
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
    kpis: PrefeituraConsultasKpiDto[]
  }
  highlights: HorariosPicoHighlightDto[]
  hourly: HorariosPicoHourlyRowDto[]
  weekday: HorariosPicoWeekdayRowDto[]
  units: HorariosPicoReportUnitRowDto[]
  evolution: {
    mode: 'daily' | 'monthly'
    volumePoints: PrefeituraConsultasDailyPointDto[]
  }
}

export type MedicosPlantaoHighlightDto = {
  id: string
  title: string
  subtitle: string
  tone: 'red' | 'green' | 'amber' | 'blue'
}

export type MedicosPlantaoProfessionalRowDto = {
  id: string
  name: string
  plantoesCount: number
  scheduledConsultas: number
  completedConsultas: number
  adherencePercent: number
  especialidadeName: string
}

export type MedicosPlantaoReportUnitRowDto = {
  id: string
  name: string
  region: string
  regionKey: string
  plantoesCount: number
  scheduledConsultas: number
  completedConsultas: number
  adherencePercent: number
}

export type MedicosPlantaoReportDto = {
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
    kpis: PrefeituraConsultasKpiDto[]
  }
  highlights: MedicosPlantaoHighlightDto[]
  professionals: MedicosPlantaoProfessionalRowDto[]
  units: MedicosPlantaoReportUnitRowDto[]
  evolution: {
    mode: 'daily' | 'monthly'
    plantoesPoints: PrefeituraConsultasDailyPointDto[]
    consultasPoints: PrefeituraConsultasDailyPointDto[]
  }
}

export type DuracaoMediaHighlightDto = {
  id: string
  title: string
  subtitle: string
  tone: 'red' | 'green' | 'amber' | 'blue'
}

export type DuracaoMediaSpecialtyRowDto = {
  id: string
  name: string
  avgMinutes: number
  medianMinutes: number
  consultaCount: number
  durationVsNetworkPercent: number
}

export type DuracaoMediaProfessionalRowDto = {
  id: string
  name: string
  especialidadeName: string
  avgMinutes: number
  medianMinutes: number
  consultaCount: number
}

export type DuracaoMediaReportUnitRowDto = {
  id: string
  name: string
  region: string
  regionKey: string
  avgMinutes: number
  medianMinutes: number
  consultaCount: number
  durationVsNetworkPercent: number
}

export type DuracaoMediaOutlierRowDto = {
  consultaId: string
  unitName: string
  specialtyName: string
  professionalName: string
  durationMinutes: number
  networkAvgMinutes: number
}

export type DuracaoMediaReportDto = {
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
    consultaCount: number
    outlierCount: number
    unitsCount: number
    specialtiesCount: number
    durationDeltaPercent: number
    avgDurationDeltaMinutes: number
    kpis: PrefeituraConsultasKpiDto[]
  }
  highlights: DuracaoMediaHighlightDto[]
  specialties: DuracaoMediaSpecialtyRowDto[]
  professionals: DuracaoMediaProfessionalRowDto[]
  units: DuracaoMediaReportUnitRowDto[]
  outliers: DuracaoMediaOutlierRowDto[]
  evolution: {
    mode: 'daily' | 'monthly'
    durationPoints: PrefeituraConsultasDailyPointDto[]
    volumePoints: PrefeituraConsultasDailyPointDto[]
  }
}

export type InterrupcoesReconexoesHighlightDto = {
  id: string
  title: string
  subtitle: string
  tone: 'red' | 'green' | 'amber' | 'blue'
}

export type InterrupcoesReconexoesBreakdownRowDto = {
  key: 'interrupcao' | 'reconexao' | 'concluida_sem_evento' | 'outros'
  label: string
  count: number
  sharePercent: number
  completionRatePercent: number
}

export type InterrupcoesReconexoesReportUnitRowDto = {
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

export type InterrupcoesReconexoesReportDto = {
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
    completionWithEventsPercent: number
    unitsCount: number
    interruptionDeltaPp: number
    reconnectionDeltaPp: number
    completionDeltaPp: number
    kpis: PrefeituraConsultasKpiDto[]
  }
  highlights: InterrupcoesReconexoesHighlightDto[]
  breakdown: InterrupcoesReconexoesBreakdownRowDto[]
  units: InterrupcoesReconexoesReportUnitRowDto[]
  evolution: {
    mode: 'daily' | 'monthly'
    interruptionPoints: PrefeituraConsultasDailyPointDto[]
    reconnectionPoints: PrefeituraConsultasDailyPointDto[]
    completionRatePoints: PrefeituraConsultasDailyPointDto[]
  }
}

export type AvaliacoesAtendimentosHighlightDto = {
  id: string
  title: string
  subtitle: string
  tone: 'red' | 'green' | 'amber' | 'blue'
}

export type AvaliacoesAtendimentosDistributionRowDto = {
  stars: number
  count: number
  sharePercent: number
}

export type AvaliacoesAtendimentosCommentSampleDto = {
  id: string
  unitName: string
  professionalName: string
  nota: number
  notaProfissional: number | null
  notaTeleconsulta: number | null
  comentario: string
  avaliadoEm: string
}

export type AvaliacoesAtendimentosReportUnitRowDto = {
  id: string
  name: string
  region: string
  regionKey: string
  ratingCount: number
  avgNota: number
  avgNotaProfissional: number
  avgNotaTeleconsulta: number
  avgVsNetworkPp: number
}

export type AvaliacoesAtendimentosReportDto = {
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
    ratingCount: number
    avgNota: number
    avgNotaProfissional: number
    avgNotaTeleconsulta: number
    unitsCount: number
    ratingCountDeltaPercent: number
    avgNotaDeltaPp: number
    kpis: PrefeituraConsultasKpiDto[]
  }
  highlights: AvaliacoesAtendimentosHighlightDto[]
  distribution: AvaliacoesAtendimentosDistributionRowDto[]
  comments: AvaliacoesAtendimentosCommentSampleDto[]
  units: AvaliacoesAtendimentosReportUnitRowDto[]
  evolution: {
    mode: 'daily' | 'monthly'
    ratingCountPoints: PrefeituraConsultasDailyPointDto[]
    avgRatingPoints: PrefeituraConsultasDailyPointDto[]
  }
}

export type SatisfacaoCidadaoHighlightDto = {
  id: string
  title: string
  subtitle: string
  tone: 'red' | 'green' | 'amber' | 'blue'
}

export type SatisfacaoCidadaoDimensionScoreDto = {
  key: 'profissional' | 'teleconsulta' | 'geral'
  label: string
  avgScore: number
  scoreDeltaPp: number
}

export type SatisfacaoCidadaoReportUnitRowDto = {
  id: string
  name: string
  region: string
  regionKey: string
  nps: number
  avgRating: number
  ratingCount: number
  npsVsNetworkPp: number
}

export type SatisfacaoCidadaoReportDto = {
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
    ratingCount: number
    npsDeltaPp: number
    avgRatingDeltaPp: number
    unitsCount: number
    kpis: PrefeituraConsultasKpiDto[]
  }
  highlights: SatisfacaoCidadaoHighlightDto[]
  dimensions: SatisfacaoCidadaoDimensionScoreDto[]
  units: SatisfacaoCidadaoReportUnitRowDto[]
  evolution: {
    mode: 'daily' | 'monthly'
    npsPoints: PrefeituraConsultasDailyPointDto[]
    avgRatingPoints: PrefeituraConsultasDailyPointDto[]
  }
}

export type UnidadesCriticasHighlightDto = {
  id: string
  title: string
  subtitle: string
  tone: 'red' | 'green' | 'amber' | 'blue'
  severity?: 'warning' | 'critical'
}

export type UnidadesCriticasIssueDto = {
  key: 'completion' | 'rating' | 'interruption' | 'nps' | 'duration'
  label: string
  value: number
  threshold: number
  severity: 'warning' | 'critical'
}

export type UnidadesCriticasEntityRowDto = {
  id: string
  name: string
  type: 'unit' | 'specialty'
  region?: string
  regionKey?: string
  severity: 'warning' | 'critical'
  issueCount: number
  issues: UnidadesCriticasIssueDto[]
  completionRatePercent: number
  avgRating: number
  interruptionRatePercent: number
  nps: number
  avgDurationMinutes: number
}

export type UnidadesCriticasReportDto = {
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
    warningUnitsCount: number
    unitsAnalyzed: number
    specialtiesAnalyzed: number
    criticalDeltaCount: number
    kpis: PrefeituraConsultasKpiDto[]
  }
  highlights: UnidadesCriticasHighlightDto[]
  units: UnidadesCriticasEntityRowDto[]
  specialties: UnidadesCriticasEntityRowDto[]
  evolution: {
    mode: 'daily' | 'monthly'
    criticalCountPoints: PrefeituraConsultasDailyPointDto[]
  }
  thresholds: {
    minCompletionRatePercent: number
    minAvgRating: number
    maxInterruptionRatePercent: number
    minNps: number
    maxAvgDurationMinutes: number
    minAvgDurationMinutes: number
  }
}

export * from './patient-reports.types.js'
