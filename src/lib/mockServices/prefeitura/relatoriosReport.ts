import {
  prefeituraConsultasDailySeries,
  prefeituraConsultasKpiCards,
  prefeituraConsultasPeriodTotal,
  prefeituraConsultasSpecialties,
  prefeituraConsultasUnitRows,
} from '../../../data/prefeituraConsultasMock'
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
import {
  prefeituraAgendasAttendanceByUbs,
  prefeituraAgendasHighlights,
} from '../../../data/prefeituraAgendasMock'
import { mockDelay } from '../delay'

export class PrefeituraRelatoriosApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'PrefeituraRelatoriosApiError'
    this.status = status
    this.code = code
  }
}

export function isPrefeituraRelatoriosApiError(
  error: unknown,
): error is PrefeituraRelatoriosApiError {
  return error instanceof PrefeituraRelatoriosApiError
}

export async function fetchPrefeituraProducaoUnidadeReport(
  _accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<ProducaoUnidadeReportApi> {
  void _accessToken
  await mockDelay()

  const units = prefeituraConsultasUnitRows.map((unit) => ({
    ...unit,
    sharePercent:
      prefeituraConsultasPeriodTotal > 0
        ? Math.round((unit.volumeTotal / prefeituraConsultasPeriodTotal) * 1000) / 10
        : 0,
    volumeVsNetworkPercent:
      prefeituraConsultasUnitRows.length > 0
        ? Math.round(
            ((unit.volumeTotal -
              prefeituraConsultasPeriodTotal / prefeituraConsultasUnitRows.length) /
              Math.max(1, prefeituraConsultasPeriodTotal / prefeituraConsultasUnitRows.length)) *
              1000,
          ) / 10
        : 0,
  }))

  return {
    reportId: 'producao-unidade',
    title: 'Produção por unidade',
    description:
      'Volume de consultas realizadas por UBT no período, com comparativo entre unidades e evolução diária ou mensal.',
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    periodLabel: `${params.periodStart} – ${params.periodEnd}`,
    generatedAt: new Date().toISOString(),
    entidadeRazaoSocial: 'Prefeitura Municipal',
    generatedBy: 'Gestor municipal',
    summary: {
      periodTotal: prefeituraConsultasPeriodTotal,
      unitsCount: units.length,
      networkAvgVolume: Math.round(
        prefeituraConsultasPeriodTotal / Math.max(1, prefeituraConsultasUnitRows.length),
      ),
      volumeDeltaPercent: 12,
      kpis: prefeituraConsultasKpiCards,
    },
    units,
    evolution: {
      mode: 'daily',
      points: prefeituraConsultasDailySeries,
    },
  }
}

export async function fetchPrefeituraFilaEsperaAbandonoReport(
  _accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<FilaEsperaAbandonoReportApi> {
  void _accessToken
  await mockDelay()

  const units = prefeituraConsultasUnitRows.map((unit, index) => {
    const abandoned = Math.round(unit.volumeTotal * 0.04) + (index % 3)
    const filaProcessed = unit.volumeTotal + abandoned
    const abandonmentRatePercent =
      unit.completed + unit.cancelled + abandoned > 0
        ? Math.round(
            ((unit.cancelled + abandoned) / (unit.completed + unit.cancelled + abandoned)) * 1000,
          ) / 10
        : 0

    return {
      id: unit.id,
      name: unit.name,
      address: unit.address,
      region: unit.region,
      regionKey: unit.regionKey,
      queueNow: 2 + (index % 5),
      avgWaitMinutes: 8 + index * 3,
      filaProcessed,
      abandoned,
      cancelled: unit.cancelled,
      completed: unit.completed,
      abandonmentRatePercent,
      absencesTotal: abandoned + unit.cancelled,
      waitVsNetworkMinutes: 0,
      abandonmentVsNetworkPp: 0,
    }
  })

  const networkAvgWait =
    units.length > 0
      ? Math.round(units.reduce((sum, unit) => sum + unit.avgWaitMinutes, 0) / units.length)
      : 0
  const networkAbandonment =
    units.length > 0
      ? Math.round(
          (units.reduce((sum, unit) => sum + unit.abandonmentRatePercent, 0) / units.length) * 10,
        ) / 10
      : 0

  const unitsWithDelta = units
    .map((unit) => ({
      ...unit,
      waitVsNetworkMinutes: unit.avgWaitMinutes - networkAvgWait,
      abandonmentVsNetworkPp: unit.abandonmentRatePercent - networkAbandonment,
    }))
    .sort((a, b) => b.abandonmentRatePercent - a.abandonmentRatePercent)

  const filaProcessed = unitsWithDelta.reduce((sum, unit) => sum + unit.filaProcessed, 0)
  const absencesTotal = unitsWithDelta.reduce((sum, unit) => sum + unit.absencesTotal, 0)
  const queueNow = unitsWithDelta.reduce((sum, unit) => sum + unit.queueNow, 0)

  const waitPoints = prefeituraConsultasDailySeries.map((point, index) => ({
    ...point,
    value: 10 + (index % 7) * 2,
  }))
  const abandonmentPoints = prefeituraConsultasDailySeries.map((point, index) => ({
    ...point,
    value: 6 + (index % 5),
  }))
  const volumePoints = prefeituraConsultasDailySeries

  const summary = {
    queueNow,
    filaProcessed,
    avgWaitMinutes: networkAvgWait,
    abandonmentRatePercent: networkAbandonment,
    absencesTotal,
    unitsCount: unitsWithDelta.length,
    avgWaitDeltaMinutes: -2,
    abandonmentDeltaPp: -0.8,
    filaProcessedDeltaPercent: 5,
    kpis: [
      {
        label: 'Fila na rede (agora)',
        value: String(queueNow),
        footer: 'Pacientes aguardando ou chamados no terminal',
        footerTone: 'neutral' as const,
        topBar: 'from-orange-400 to-amber-500',
      },
      {
        label: 'Tempo médio de espera',
        value: `${networkAvgWait} min`,
        footer: '-2 min vs período anterior',
        footerTone: 'positive' as const,
        footerIcon: 'down' as const,
        topBar: 'from-cyan-400 to-sky-500',
      },
      {
        label: 'Taxa de abandono',
        value: `${networkAbandonment.toFixed(1).replace('.', ',')}%`,
        footer: '-0,8 p.p. vs período anterior',
        footerTone: 'positive' as const,
        footerIcon: 'down' as const,
        topBar: 'from-rose-400 to-red-500',
      },
      {
        label: 'Pacientes na fila (período)',
        value: String(filaProcessed),
        footer: 'Entradas finalizadas ou com desistência no terminal',
        footerTone: 'neutral' as const,
        topBar: 'from-indigo-400 to-blue-600',
      },
      {
        label: 'Desistências e cancelamentos',
        value: String(absencesTotal),
        footer: 'Desistências na fila + consultas canceladas ou interrompidas',
        footerTone: 'muted' as const,
        topBar: 'from-violet-400 to-purple-600',
      },
    ],
  }

  return {
    reportId: 'fila-espera-abandono',
    title: 'Fila, espera e abandono',
    description:
      'Tempo médio de espera, tamanho da fila e taxa de abandono antes ou durante o atendimento no terminal.',
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    periodLabel: `${params.periodStart} – ${params.periodEnd}`,
    generatedAt: new Date().toISOString(),
    entidadeRazaoSocial: 'Prefeitura Municipal',
    generatedBy: 'Gestor municipal',
    summary,
    units: unitsWithDelta,
    evolution: {
      mode: 'daily',
      waitPoints,
      abandonmentPoints,
      volumePoints,
    },
  }
}

export async function fetchPrefeituraAgendaComparecimentoReport(
  _accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<AgendaComparecimentoReportApi> {
  void _accessToken
  await mockDelay()

  const scheduled = 2856
  const attended = 2124
  const noShows = 732
  const rescheduled = 186
  const pending = scheduled - attended - noShows
  const attendanceRatePercent = 74

  const units = prefeituraAgendasAttendanceByUbs.slice(0, 8).map((unit) => {
    const unitScheduled = unit.attended + unit.absences + 12
    const unitAttendanceRate =
      unit.attended + unit.absences > 0
        ? Math.round((unit.attended / (unit.attended + unit.absences)) * 1000) / 10
        : 0

    return {
      id: unit.id,
      name: unit.label,
      region: 'Região',
      regionKey: 'centro',
      scheduled: unitScheduled,
      attended: unit.attended,
      noShows: unit.absences,
      pending: 12,
      rescheduled: Math.round(unit.absences * 0.25),
      attendanceRatePercent: unitAttendanceRate,
      absenceRatePercent: unit.absenceRate,
      attendanceVsNetworkPp: unitAttendanceRate - attendanceRatePercent,
    }
  })

  const attendancePoints = prefeituraConsultasDailySeries.map((point, index) => ({
    ...point,
    value: 68 + (index % 6) * 2,
  }))
  const noShowPoints = prefeituraConsultasDailySeries.map((point, index) => ({
    ...point,
    value: 18 + (index % 4) * 3,
  }))
  const rescheduledPoints = prefeituraConsultasDailySeries.map((point, index) => ({
    ...point,
    value: 4 + (index % 3),
  }))
  const volumePoints = prefeituraConsultasDailySeries.map((point) => ({
    ...point,
    value: Math.round(point.value * 1.4),
  }))

  return {
    reportId: 'agenda-comparecimento',
    title: 'Agenda vs comparecimento',
    description:
      'Relação entre horários agendados e consultas efetivamente realizadas, incluindo faltas e remarcações.',
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    periodLabel: `${params.periodStart} – ${params.periodEnd}`,
    generatedAt: new Date().toISOString(),
    entidadeRazaoSocial: 'Prefeitura Municipal',
    generatedBy: 'Gestor municipal',
    summary: {
      scheduled,
      attended,
      noShows,
      pending,
      rescheduled,
      attendanceRatePercent,
      unitsCount: units.length,
      attendanceDeltaPp: 2.4,
      noShowsDeltaPercent: -5,
      scheduledDeltaPercent: 8,
      kpis: [
        {
          label: 'Agendamentos no período',
          value: String(scheduled),
          footer: 'Horários reservados nas agendas das UBTs',
          footerTone: 'neutral',
          topBar: 'from-orange-400 to-amber-500',
        },
        {
          label: 'Comparecimentos',
          value: String(attended),
          footer: 'Consultas com presença confirmada ou em andamento',
          footerTone: 'neutral',
          topBar: 'from-emerald-400 to-green-500',
        },
        {
          label: 'Taxa de comparecimento',
          value: '74,0%',
          footer: '+2,4 p.p. vs período anterior',
          footerTone: 'positive',
          footerIcon: 'up',
          topBar: 'from-sky-400 to-blue-500',
        },
        {
          label: 'Faltas',
          value: String(noShows),
          footer: '-5,0% vs período anterior',
          footerTone: 'positive',
          footerIcon: 'down',
          topBar: 'from-rose-400 to-red-500',
        },
        {
          label: 'Remarcações e cancelamentos',
          value: String(rescheduled),
          footer: 'Agendamentos cancelados ou reagendados no período',
          footerTone: 'muted',
          topBar: 'from-violet-400 to-purple-600',
        },
      ],
    },
    highlights: prefeituraAgendasHighlights,
    units,
    evolution: {
      mode: 'daily',
      attendancePoints,
      noShowPoints,
      rescheduledPoints,
      volumePoints,
    },
  }
}

export async function fetchPrefeituraRankingUbtsReport(
  _accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<RankingUbtsReportApi> {
  void _accessToken
  await mockDelay()

  const units = prefeituraConsultasUnitRows.map((unit, index) => {
    const abandonmentRatePercent = unit.cancelledRate + 4 + (index % 3)
    const attendanceRatePercent = 72 + (index % 5) * 3
    const goalFulfillmentPercent = 68 + (index % 6) * 4
    const compositeScore = 62 + (index % 7) * 4

    return {
      id: unit.id,
      name: unit.name,
      region: unit.region,
      regionKey: unit.regionKey,
      rank: 0,
      production: unit.completed,
      completionRatePercent: unit.completionRate,
      abandonmentRatePercent,
      avgWaitMinutes: 10 + index * 2,
      attendanceRatePercent,
      avgRating: 4.2 + (index % 3) * 0.2,
      goalFulfillmentPercent,
      compositeScore,
      slaStatus: unit.status,
      productionDeltaPercent: 6 - index,
      compositeDeltaPp: 2 - (index % 4),
    }
  })
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .map((unit, index) => ({ ...unit, rank: index + 1 }))

  const totalProduction = units.reduce((sum, unit) => sum + unit.production, 0)
  const avgGoalFulfillmentPercent =
    units.length > 0
      ? Math.round(
          (units.reduce((sum, unit) => sum + unit.goalFulfillmentPercent, 0) / units.length) * 10,
        ) / 10
      : 0
  const networkCompositeScore =
    units.length > 0
      ? Math.round((units.reduce((sum, unit) => sum + unit.compositeScore, 0) / units.length) * 10) /
        10
      : 0

  const buildRanking = (
    picker: (unit: (typeof units)[number]) => number,
    format: (value: number) => string,
    ascending = false,
  ) =>
    [...units]
      .sort((a, b) => (ascending ? picker(a) - picker(b) : picker(b) - picker(a)))
      .map((unit, index) => ({
        position: index + 1,
        unitId: unit.id,
        unitName: unit.name,
        region: unit.region,
        value: picker(unit),
        valueLabel: format(picker(unit)),
        variationPercent: unit.productionDeltaPercent,
      }))

  const compositePoints = prefeituraConsultasDailySeries.map((point, index) => ({
    ...point,
    value: 60 + (index % 5) * 2,
  }))
  const productionPoints = prefeituraConsultasDailySeries
  const goalPoints = prefeituraConsultasDailySeries.map((point, index) => ({
    ...point,
    value: 70 + (index % 4) * 2,
  }))

  return {
    reportId: 'ranking-ubts',
    title: 'Ranking de UBTs',
    description:
      'Classificação das unidades por produção, eficiência operacional e cumprimento de metas da rede municipal.',
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    periodLabel: `${params.periodStart} – ${params.periodEnd}`,
    generatedAt: new Date().toISOString(),
    entidadeRazaoSocial: 'Prefeitura Municipal',
    generatedBy: 'Gestor municipal',
    summary: {
      unitsCount: units.length,
      totalProduction,
      productionDeltaPercent: 9,
      avgGoalFulfillmentPercent,
      networkCompositeScore,
      compositeDeltaPp: 1.8,
      unitsMeetingGoals: units.filter((unit) => unit.goalFulfillmentPercent >= 75).length,
      topUnitName: units[0]?.name ?? '—',
      kpis: [
        {
          label: 'Unidades classificadas',
          value: String(units.length),
          footer: 'UBTs ativas no recorte do relatório',
          footerTone: 'neutral',
          topBar: 'from-orange-400 to-amber-500',
        },
        {
          label: 'Produção total',
          value: String(totalProduction),
          footer: '+9,0% vs período anterior',
          footerTone: 'positive',
          footerIcon: 'up',
          topBar: 'from-sky-400 to-blue-500',
        },
        {
          label: 'Cumprimento médio de metas',
          value: `${avgGoalFulfillmentPercent.toFixed(1).replace('.', ',')}%`,
          footer: 'Média das metas de conclusão, abandono, espera e comparecimento',
          footerTone: 'neutral',
          topBar: 'from-emerald-400 to-green-500',
        },
        {
          label: 'Score composto da rede',
          value: networkCompositeScore.toFixed(1).replace('.', ','),
          footer: '+1,8 p.p. vs período anterior',
          footerTone: 'positive',
          footerIcon: 'up',
          topBar: 'from-violet-400 to-purple-600',
        },
        {
          label: 'Unidades em meta',
          value: String(units.filter((unit) => unit.goalFulfillmentPercent >= 75).length),
          footer: 'UBTs com cumprimento de metas igual ou superior a 75%',
          footerTone: 'neutral',
          topBar: 'from-indigo-400 to-blue-600',
        },
      ],
    },
    highlights: [
      {
        id: 'top-production',
        title: 'Maior produção',
        subtitle: `${units.sort((a, b) => b.production - a.production)[0]?.name ?? '—'} · ${units[0]?.production ?? 0} consultas`,
        tone: 'blue',
      },
      {
        id: 'top-efficiency',
        title: 'Melhor eficiência',
        subtitle: `${units.sort((a, b) => b.completionRatePercent - a.completionRatePercent)[0]?.name ?? '—'} · ${units[0]?.completionRatePercent ?? 0}% conclusão`,
        tone: 'green',
      },
      {
        id: 'low-abandonment',
        title: 'Menor abandono',
        subtitle: `${units.sort((a, b) => a.abandonmentRatePercent - b.abandonmentRatePercent)[0]?.name ?? '—'} · ${units[0]?.abandonmentRatePercent ?? 0}% abandono`,
        tone: 'amber',
      },
      {
        id: 'top-goals',
        title: 'Cumprimento de metas',
        subtitle: `${units.sort((a, b) => b.goalFulfillmentPercent - a.goalFulfillmentPercent)[0]?.name ?? '—'} · ${units[0]?.goalFulfillmentPercent ?? 0}% metas`,
        tone: 'red',
      },
    ],
    units,
    rankings: {
      producao: buildRanking((unit) => unit.production, (value) => String(value)),
      eficiencia: buildRanking(
        (unit) => unit.completionRatePercent,
        (value) => `${value.toFixed(1).replace('.', ',')}%`,
      ),
      abandono: buildRanking(
        (unit) => unit.abandonmentRatePercent,
        (value) => `${value.toFixed(1).replace('.', ',')}%`,
        true,
      ),
      metas: buildRanking(
        (unit) => unit.goalFulfillmentPercent,
        (value) => `${value.toFixed(1).replace('.', ',')}%`,
      ),
    },
    evolution: {
      mode: 'daily',
      compositePoints,
      productionPoints,
      goalPoints,
    },
    goals: {
      completionRatePercent: 92,
      maxAbandonmentRatePercent: 15,
      maxWaitMinutes: 15,
      minAttendanceRatePercent: 75,
    },
  }
}

export async function fetchPrefeituraFluxoTerminalReport(
  _accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<FluxoTerminalReportApi> {
  void _accessToken
  await mockDelay()

  const units = prefeituraConsultasUnitRows.map((unit, index) => {
    const arrivals = unit.volumeTotal + 8 + (index % 4)
    const triaged = Math.round(arrivals * 0.92)
    const referred = Math.round(triaged * 0.88)
    const completed = Math.round(referred * 0.86)
    const abandoned = Math.max(0, arrivals - triaged + (index % 2))

    return {
      id: unit.id,
      name: unit.name,
      region: unit.region,
      regionKey: unit.regionKey,
      arrivals,
      triaged,
      referred,
      completed,
      abandoned,
      completionRatePercent:
        arrivals > 0 ? Math.round((completed / arrivals) * 1000) / 10 : 0,
      avgTriageMinutes: 7 + index * 2,
      avgJourneyMinutes: 28 + index * 3,
      completionVsNetworkPp: 0,
    }
  })

  const totalArrivals = units.reduce((sum, unit) => sum + unit.arrivals, 0)
  const totalTriaged = units.reduce((sum, unit) => sum + unit.triaged, 0)
  const totalReferred = units.reduce((sum, unit) => sum + unit.referred, 0)
  const totalCompleted = units.reduce((sum, unit) => sum + unit.completed, 0)
  const totalAbandoned = units.reduce((sum, unit) => sum + unit.abandoned, 0)
  const networkCompletion =
    totalArrivals > 0 ? Math.round((totalCompleted / totalArrivals) * 1000) / 10 : 0
  const networkTriage =
    units.length > 0
      ? Math.round(units.reduce((sum, unit) => sum + unit.avgTriageMinutes, 0) / units.length)
      : 0
  const networkJourney =
    units.length > 0
      ? Math.round(units.reduce((sum, unit) => sum + unit.avgJourneyMinutes, 0) / units.length)
      : 0

  const unitsWithDelta = units.map((unit) => ({
    ...unit,
    completionVsNetworkPp: unit.completionRatePercent - networkCompletion,
  }))

  const arrivalPoints = prefeituraConsultasDailySeries
  const completionPoints = prefeituraConsultasDailySeries.map((point, index) => ({
    ...point,
    value: Math.round(point.value * 0.82) + (index % 3),
  }))
  const completionRatePoints = prefeituraConsultasDailySeries.map((point, index) => ({
    ...point,
    value: 72 + (index % 5) * 2,
  }))
  const triageTimePoints = prefeituraConsultasDailySeries.map((point, index) => ({
    ...point,
    value: 8 + (index % 4) * 2,
  }))

  const funnel = [
    {
      stage: 'chegada' as const,
      label: 'Chegada no terminal',
      count: totalArrivals,
      conversionPercent: 100,
      avgMinutes: 0,
    },
    {
      stage: 'triagem' as const,
      label: 'Triagem concluída',
      count: totalTriaged,
      conversionPercent:
        totalArrivals > 0 ? Math.round((totalTriaged / totalArrivals) * 1000) / 10 : 0,
      avgMinutes: networkTriage,
    },
    {
      stage: 'encaminhamento' as const,
      label: 'Encaminhamento à consulta',
      count: totalReferred,
      conversionPercent:
        totalTriaged > 0 ? Math.round((totalReferred / totalTriaged) * 1000) / 10 : 0,
      avgMinutes: 0,
    },
    {
      stage: 'conclusao' as const,
      label: 'Consulta concluída',
      count: totalCompleted,
      conversionPercent:
        totalReferred > 0 ? Math.round((totalCompleted / totalReferred) * 1000) / 10 : 0,
      avgMinutes: networkJourney,
    },
  ]

  const topArrivals = [...unitsWithDelta].sort((a, b) => b.arrivals - a.arrivals)[0]
  const topCompletion = [...unitsWithDelta].sort(
    (a, b) => b.completionRatePercent - a.completionRatePercent,
  )[0]

  return {
    reportId: 'fluxo-terminal',
    title: 'Fluxo do terminal',
    description:
      'Jornada do paciente no terminal de autoatendimento: chegada, triagem, encaminhamento e conclusão da consulta.',
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    periodLabel: `${params.periodStart} – ${params.periodEnd}`,
    generatedAt: new Date().toISOString(),
    entidadeRazaoSocial: 'Prefeitura Municipal',
    generatedBy: 'Gestor municipal',
    summary: {
      arrivals: totalArrivals,
      triaged: totalTriaged,
      referred: totalReferred,
      completed: totalCompleted,
      abandoned: totalAbandoned,
      completionRatePercent: networkCompletion,
      avgTriageMinutes: networkTriage,
      avgJourneyMinutes: networkJourney,
      unitsCount: unitsWithDelta.length,
      arrivalsDeltaPercent: 7,
      completionDeltaPp: 1.4,
      kpis: [
        {
          label: 'Chegadas no terminal',
          value: String(totalArrivals),
          footer: '+7,0% vs período anterior',
          footerTone: 'positive',
          footerIcon: 'up',
          topBar: 'from-orange-400 to-amber-500',
        },
        {
          label: 'Taxa de conclusão da jornada',
          value: `${networkCompletion.toFixed(1).replace('.', ',')}%`,
          footer: '+1,4 p.p. vs período anterior',
          footerTone: 'positive',
          footerIcon: 'up',
          topBar: 'from-emerald-400 to-green-500',
        },
        {
          label: 'Tempo médio de triagem',
          value: `${networkTriage} min`,
          footer: 'Da chegada até a chamada ou início do atendimento presencial',
          footerTone: 'neutral',
          topBar: 'from-cyan-400 to-sky-500',
        },
        {
          label: 'Encaminhamentos realizados',
          value: String(totalReferred),
          footer: 'Pacientes encaminhados à teleconsulta após triagem',
          footerTone: 'neutral',
          topBar: 'from-indigo-400 to-blue-600',
        },
        {
          label: 'Desistências no terminal',
          value: String(totalAbandoned),
          footer: 'Pacientes que abandonaram a jornada antes da conclusão',
          footerTone: 'muted',
          topBar: 'from-rose-400 to-red-500',
        },
      ],
    },
    highlights: [
      {
        id: 'top-arrivals',
        title: 'Maior fluxo de chegadas',
        subtitle: `${topArrivals?.name ?? '—'} · ${topArrivals?.arrivals ?? 0} pacientes`,
        tone: 'blue',
      },
      {
        id: 'top-completion',
        title: 'Melhor conclusão da jornada',
        subtitle: `${topCompletion?.name ?? '—'} · ${topCompletion?.completionRatePercent ?? 0}% concluídos`,
        tone: 'green',
      },
      {
        id: 'fastest-triage',
        title: 'Triagem mais rápida',
        subtitle: `${unitsWithDelta.sort((a, b) => a.avgTriageMinutes - b.avgTriageMinutes)[0]?.name ?? '—'} · ${networkTriage} min em média`,
        tone: 'amber',
      },
      {
        id: 'highest-abandonment',
        title: 'Maior abandono no terminal',
        subtitle: `${unitsWithDelta.sort((a, b) => b.abandoned - a.abandoned)[0]?.name ?? '—'} · ${totalAbandoned} desistências`,
        tone: 'red',
      },
    ],
    funnel,
    origins: [
      {
        origin: 'agendado',
        label: 'Agendado',
        count: Math.round(totalArrivals * 0.68),
        completionRatePercent: networkCompletion + 4,
      },
      {
        origin: 'espontaneo',
        label: 'Espontâneo',
        count: Math.round(totalArrivals * 0.32),
        completionRatePercent: Math.max(0, networkCompletion - 6),
      },
    ],
    units: unitsWithDelta,
    evolution: {
      mode: 'daily',
      arrivalPoints,
      completionPoints,
      completionRatePoints,
      triageTimePoints,
    },
  }
}

function mockReportMeta(params: { periodStart: string; periodEnd: string }) {
  return {
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    periodLabel: `${params.periodStart} – ${params.periodEnd}`,
    generatedAt: new Date().toISOString(),
    entidadeRazaoSocial: 'Prefeitura Municipal',
    generatedBy: 'Gestor municipal',
  }
}

export async function fetchPrefeituraDemandaEspecialidadeReport(
  _accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<DemandaEspecialidadeReportApi> {
  void _accessToken
  await mockDelay()

  const requested = 3840
  const completed = 2910
  const completionRatePercent = 75.8

  const specialties = prefeituraConsultasSpecialties.map((item, index) => {
    const specRequested = Math.round((item.sharePercent / 100) * requested)
    const agendaCount = Math.round(specRequested * 0.82)
    const filaCount = specRequested - agendaCount
    const specCompleted = Math.round(specRequested * (0.7 + (index % 3) * 0.05))
    return {
      id: item.key,
      name: item.label,
      requested: specRequested,
      agendaCount,
      filaCount,
      completed: specCompleted,
      completionRatePercent:
        specRequested > 0 ? Math.round((specCompleted / specRequested) * 1000) / 10 : 0,
      sharePercent: item.sharePercent,
      requestedDeltaPercent: 6 - index,
    }
  })

  const units = prefeituraConsultasUnitRows.map((unit, index) => {
    const unitRequested = Math.round(unit.volumeTotal * 0.3)
    const unitCompleted = Math.round(unit.completed * 0.28)
    const unitCompletion =
      unitRequested > 0 ? Math.round((unitCompleted / unitRequested) * 1000) / 10 : 0
    return {
      id: unit.id,
      name: unit.name,
      region: unit.region,
      regionKey: unit.regionKey,
      requested: unitRequested,
      completed: unitCompleted,
      completionRatePercent: unitCompletion,
      topSpecialtyName: specialties[index % specialties.length]?.name ?? '—',
      topSpecialtySharePercent: specialties[index % specialties.length]?.sharePercent ?? 0,
      completionVsNetworkPp: unitCompletion - completionRatePercent,
    }
  })

  const volumePoints = prefeituraConsultasDailySeries.map((point) => ({
    ...point,
    value: Math.round(point.value * 0.35),
  }))
  const completionPoints = prefeituraConsultasDailySeries.map((point, index) => ({
    ...point,
    value: Math.round(point.value * 0.28) + (index % 2),
  }))
  const completionRatePoints = prefeituraConsultasDailySeries.map((point, index) => ({
    ...point,
    value: 72 + (index % 5) * 2,
  }))

  return {
    reportId: 'demanda-especialidade',
    title: 'Demanda por especialidade',
    description:
      'Distribuição das consultas solicitadas e realizadas entre especialidades médicas e de apoio.',
    ...mockReportMeta(params),
    summary: {
      requested,
      completed,
      completionRatePercent,
      specialtiesCount: specialties.length,
      topSpecialtyName: specialties[0]?.name ?? '—',
      unitsCount: units.length,
      requestedDeltaPercent: 8.5,
      completionDeltaPp: 1.6,
      kpis: [
        {
          label: 'Solicitações no período',
          value: String(requested),
          footer: '+8,5% vs período anterior',
          footerTone: 'positive',
          footerIcon: 'up',
          topBar: 'from-sky-400 to-blue-500',
        },
        {
          label: 'Consultas realizadas',
          value: String(completed),
          footer: `${completionRatePercent.toFixed(1).replace('.', ',')}% de conversão`,
          footerTone: 'neutral',
          topBar: 'from-emerald-400 to-green-500',
        },
        {
          label: 'Especialidades ativas',
          value: String(specialties.length),
          footer: 'Com demanda registrada no período',
          footerTone: 'neutral',
          topBar: 'from-orange-400 to-amber-500',
        },
        {
          label: 'Líder de demanda',
          value: specialties[0]?.name ?? '—',
          footer: `${specialties[0]?.sharePercent ?? 0}% do total solicitado`,
          footerTone: 'neutral',
          topBar: 'from-violet-400 to-purple-600',
        },
      ],
    },
    highlights: [
      {
        id: 'top-specialty',
        title: 'Maior demanda',
        subtitle: `${specialties[0]?.name ?? '—'} · ${specialties[0]?.requested ?? 0} solicitações`,
        tone: 'blue',
      },
      {
        id: 'fastest-growing',
        title: 'Maior crescimento',
        subtitle: `${specialties[1]?.name ?? '—'} · +${specialties[1]?.requestedDeltaPercent ?? 0}% vs período anterior`,
        tone: 'amber',
      },
    ],
    specialties,
    units,
    evolution: {
      mode: 'daily',
      volumePoints,
      completionPoints,
      completionRatePoints,
    },
  }
}

export async function fetchPrefeituraCapacidadeOcupacaoReport(
  _accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<CapacidadeOcupacaoReportApi> {
  void _accessToken
  await mockDelay()

  const capacity = 5200
  const booked = 4180
  const occupancyPercent = 80.4

  const specialties = prefeituraConsultasSpecialties.map((item, index) => {
    const specCapacity = Math.round((item.sharePercent / 100) * capacity)
    const specBooked = Math.round(specCapacity * (0.72 + (index % 4) * 0.05))
    return {
      id: item.key,
      name: item.label,
      capacity: specCapacity,
      booked: specBooked,
      occupancyPercent:
        specCapacity > 0 ? Math.round((specBooked / specCapacity) * 1000) / 10 : 0,
      sharePercent: item.sharePercent,
    }
  }).sort((a, b) => b.occupancyPercent - a.occupancyPercent)

  const units = prefeituraConsultasUnitRows.map((unit, index) => {
    const unitCapacity = 800 + index * 120
    const unitBooked = Math.round(unitCapacity * (0.68 + (index % 3) * 0.08))
    const unitOccupancy =
      unitCapacity > 0 ? Math.round((unitBooked / unitCapacity) * 1000) / 10 : 0
    return {
      id: unit.id,
      name: unit.name,
      region: unit.region,
      regionKey: unit.regionKey,
      capacity: unitCapacity,
      booked: unitBooked,
      occupancyPercent: unitOccupancy,
      occupancyVsNetworkPp: unitOccupancy - occupancyPercent,
    }
  }).sort((a, b) => b.occupancyPercent - a.occupancyPercent)

  const occupancyPoints = prefeituraConsultasDailySeries.map((point, index) => ({
    ...point,
    value: 74 + (index % 4) * 2,
  }))
  const bookedPoints = prefeituraConsultasDailySeries.map((point) => ({
    ...point,
    value: Math.round(point.value * 0.32),
  }))

  return {
    reportId: 'capacidade-ocupacao',
    title: 'Capacidade x ocupação',
    description:
      'Comparativo entre vagas disponíveis na agenda e taxa de utilização por especialidade ou unidade.',
    ...mockReportMeta(params),
    summary: {
      capacity,
      booked,
      occupancyPercent,
      specialtiesCount: specialties.length,
      unitsCount: units.length,
      occupancyDeltaPp: 2.1,
      bookedDeltaPercent: 6.4,
      kpis: [
        {
          label: 'Capacidade total',
          value: String(capacity),
          footer: 'Vagas disponíveis no período',
          footerTone: 'neutral',
          topBar: 'from-sky-400 to-blue-500',
        },
        {
          label: 'Agendamentos',
          value: String(booked),
          footer: `${occupancyPercent.toFixed(1).replace('.', ',')}% de ocupação`,
          footerTone: 'neutral',
          topBar: 'from-orange-400 to-amber-500',
        },
        {
          label: 'Variação de ocupação',
          value: '+2,1 p.p.',
          footer: 'vs período anterior',
          footerTone: 'positive',
          footerIcon: 'up',
          topBar: 'from-emerald-400 to-green-500',
        },
        {
          label: 'Especialidade mais ocupada',
          value: specialties[0]?.name ?? '—',
          footer: `${specialties[0]?.occupancyPercent.toFixed(1).replace('.', ',') ?? '0'}% de utilização`,
          footerTone: 'neutral',
          topBar: 'from-violet-400 to-purple-600',
        },
      ],
    },
    highlights: [
      {
        id: 'highest-occupancy',
        title: 'Maior ocupação',
        subtitle: `${specialties[0]?.name ?? '—'} · ${specialties[0]?.occupancyPercent.toFixed(1).replace('.', ',') ?? '0'}%`,
        tone: 'amber',
      },
      {
        id: 'lowest-occupancy',
        title: 'Menor ocupação',
        subtitle: `${specialties[specialties.length - 1]?.name ?? '—'} · ${specialties[specialties.length - 1]?.occupancyPercent.toFixed(1).replace('.', ',') ?? '0'}%`,
        tone: 'green',
      },
    ],
    specialties,
    units,
    evolution: {
      mode: 'daily',
      occupancyPoints,
      bookedPoints,
    },
  }
}

export async function fetchPrefeituraEncaminhamentosEncaixesReport(
  _accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<EncaminhamentosEncaixesReportApi> {
  void _accessToken
  await mockDelay()

  const encaixes = 186
  const retornos = 142
  const consultasRegulares = 2680
  const espontaneos = 324
  const encaminhamentosFila = 218
  const totalNonRegular = encaixes + retornos + espontaneos + encaminhamentosFila

  const breakdown = [
    { key: 'encaixe' as const, label: 'Encaixes', count: encaixes, sharePercent: 12.4, completionRatePercent: 88.2 },
    { key: 'retorno' as const, label: 'Retornos', count: retornos, sharePercent: 9.5, completionRatePercent: 91.0 },
    { key: 'espontaneo' as const, label: 'Espontâneos', count: espontaneos, sharePercent: 21.6, completionRatePercent: 76.4 },
    { key: 'encaminhamento_fila' as const, label: 'Encaminhamentos internos', count: encaminhamentosFila, sharePercent: 14.5, completionRatePercent: 82.6 },
    { key: 'consulta' as const, label: 'Consultas regulares', count: consultasRegulares, sharePercent: 42.0, completionRatePercent: 93.1 },
  ]

  const units = prefeituraConsultasUnitRows.map((unit, index) => {
    const unitEncaixes = 12 + (index % 4) * 3
    const unitRetornos = 8 + index * 2
    const unitEspontaneos = 24 + index * 5
    const unitEncaminhamentos = 18 + index * 4
    const unitRegulares = Math.round(unit.volumeTotal * 0.22)
    const unitNonRegular = unitEncaixes + unitRetornos + unitEspontaneos + unitEncaminhamentos
    const unitTotal = unitNonRegular + unitRegulares
    return {
      id: unit.id,
      name: unit.name,
      region: unit.region,
      regionKey: unit.regionKey,
      encaixes: unitEncaixes,
      retornos: unitRetornos,
      consultasRegulares: unitRegulares,
      espontaneos: unitEspontaneos,
      encaminhamentosFila: unitEncaminhamentos,
      totalNonRegular: unitNonRegular,
      sharePercent: unitTotal > 0 ? Math.round((unitNonRegular / totalNonRegular) * 1000) / 10 : 0,
    }
  }).sort((a, b) => b.totalNonRegular - a.totalNonRegular)

  const volumePoints = prefeituraConsultasDailySeries.map((point, index) => ({
    ...point,
    value: 28 + (index % 5) * 4,
  }))
  const encaixePoints = prefeituraConsultasDailySeries.map((point, index) => ({
    ...point,
    value: 4 + (index % 3),
  }))
  const espontaneoPoints = prefeituraConsultasDailySeries.map((point, index) => ({
    ...point,
    value: 8 + (index % 4) * 2,
  }))

  return {
    reportId: 'encaminhamentos-encaixes',
    title: 'Encaminhamentos e encaixes',
    description:
      'Volume de encaixes, encaminhamentos internos e consultas fora do fluxo regular da agenda.',
    ...mockReportMeta(params),
    summary: {
      totalNonRegular,
      encaixes,
      retornos,
      consultasRegulares,
      espontaneos,
      encaminhamentosFila,
      unitsCount: units.length,
      totalDeltaPercent: 5.2,
      kpis: prefeituraConsultasKpiCards.slice(0, 4),
    },
    highlights: [
      {
        id: 'encaixes',
        title: 'Encaixes',
        subtitle: `${encaixes} consultas fora da grade regular`,
        tone: 'amber',
      },
      {
        id: 'encaminhamentos',
        title: 'Encaminhamentos',
        subtitle: `${encaminhamentosFila} pacientes encaminhados após triagem`,
        tone: 'blue',
      },
      {
        id: 'non-regular',
        title: 'Fora do fluxo regular',
        subtitle: `${totalNonRegular} atendimentos não previstos na agenda`,
        tone: 'red',
      },
    ],
    breakdown,
    units,
    evolution: {
      mode: 'daily',
      volumePoints,
      encaixePoints,
      espontaneoPoints,
    },
  }
}

export async function fetchPrefeituraHorariosPicoReport(
  _accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<HorariosPicoReportApi> {
  void _accessToken
  await mockDelay()

  const hourLabels = ['7h', '8h', '9h', '10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h']
  const weekdayLabels = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']

  const hourly = hourLabels.map((hour, bucketIndex) => {
    const agendaCount = 40 + (bucketIndex % 5) * 12 + (bucketIndex === 7 ? 48 : 0)
    const filaCount = 18 + (bucketIndex % 4) * 6 + (bucketIndex === 7 ? 32 : 0)
    return {
      bucketIndex,
      hour,
      agendaCount,
      filaCount,
      totalCount: agendaCount + filaCount,
    }
  })

  const weekday = weekdayLabels.map((label, weekdayIndex) => {
    const agendaCount = 180 + weekdayIndex * 24
    const filaCount = 60 + weekdayIndex * 10
    return {
      weekday: weekdayIndex,
      label,
      agendaCount,
      filaCount,
      totalCount: agendaCount + filaCount,
    }
  })

  const peakHourRow = hourly.reduce((best, row) => (row.totalCount > best.totalCount ? row : best), hourly[0]!)
  const peakDayRow = weekday.reduce((best, row) => (row.totalCount > best.totalCount ? row : best), weekday[0]!)
  const totalVolume = hourly.reduce((sum, row) => sum + row.totalCount, 0)

  const units = prefeituraConsultasUnitRows.map((unit, index) => ({
    id: unit.id,
    name: unit.name,
    region: unit.region,
    regionKey: unit.regionKey,
    peakHour: hourLabels[(7 + index) % hourLabels.length] ?? '14h',
    peakWeekday: weekdayLabels[(2 + index) % weekdayLabels.length] ?? 'SEG',
    peakVolume: 120 + index * 18,
    filaPeakHour: hourLabels[(8 + index) % hourLabels.length] ?? '15h',
    agendaPeakHour: hourLabels[(6 + index) % hourLabels.length] ?? '13h',
  }))

  const volumePoints = prefeituraConsultasDailySeries.map((point) => ({
    ...point,
    value: Math.round(point.value * 0.15),
  }))

  return {
    reportId: 'horarios-pico',
    title: 'Horários de pico',
    description:
      'Faixas horárias e dias da semana com maior concentração de demanda e fila de espera.',
    ...mockReportMeta(params),
    summary: {
      peakHour: peakHourRow.hour,
      peakWeekday: peakDayRow.label,
      peakHourVolume: peakHourRow.totalCount,
      peakDayVolume: peakDayRow.totalCount,
      totalVolume,
      unitsCount: units.length,
      volumeDeltaPercent: 4.8,
      kpis: [
        {
          label: 'Pico horário',
          value: peakHourRow.hour,
          footer: `${peakHourRow.totalCount} registros`,
          footerTone: 'neutral',
          topBar: 'from-amber-400 to-orange-500',
        },
        {
          label: 'Pico semanal',
          value: peakDayRow.label,
          footer: `${peakDayRow.totalCount} registros`,
          footerTone: 'neutral',
          topBar: 'from-sky-400 to-blue-500',
        },
        {
          label: 'Volume total',
          value: String(totalVolume),
          footer: 'Agenda + fila no período',
          footerTone: 'neutral',
          topBar: 'from-emerald-400 to-green-500',
        },
        {
          label: 'Unidades',
          value: String(units.length),
          footer: 'UBTs no recorte',
          footerTone: 'neutral',
          topBar: 'from-violet-400 to-purple-600',
        },
      ],
    },
    highlights: [
      {
        id: 'peak-hour',
        title: 'Horário de pico',
        subtitle: `${peakHourRow.hour} — ${peakHourRow.totalCount} atendimentos`,
        tone: 'amber',
      },
      {
        id: 'peak-weekday',
        title: 'Dia de maior demanda',
        subtitle: `${peakDayRow.label} — ${peakDayRow.totalCount} registros`,
        tone: 'blue',
      },
    ],
    hourly,
    weekday,
    units,
    evolution: {
      mode: 'daily',
      volumePoints,
    },
  }
}

export async function fetchPrefeituraMedicosPlantaoReport(
  _accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<MedicosPlantaoReportApi> {
  void _accessToken
  await mockDelay()

  const plantoesCount = 86
  const scheduledConsultas = 1240
  const completedConsultas = 1086
  const adherencePercent = 87.6
  const professionalsCount = 24

  const professionals = [
    { id: 'prof-1', name: 'Dra. Ana Silva', plantoesCount: 8, scheduledConsultas: 96, completedConsultas: 88, adherencePercent: 91.7, especialidadeName: 'Clínico Geral' },
    { id: 'prof-2', name: 'Dr. Carlos Mendes', plantoesCount: 7, scheduledConsultas: 84, completedConsultas: 76, adherencePercent: 90.5, especialidadeName: 'Pediatria' },
    { id: 'prof-3', name: 'Dra. Fernanda Lima', plantoesCount: 6, scheduledConsultas: 72, completedConsultas: 61, adherencePercent: 84.7, especialidadeName: 'Ginecologia' },
    { id: 'prof-4', name: 'Dr. Roberto Alves', plantoesCount: 6, scheduledConsultas: 68, completedConsultas: 58, adherencePercent: 85.3, especialidadeName: 'Cardiologia' },
    { id: 'prof-5', name: 'Dra. Juliana Costa', plantoesCount: 5, scheduledConsultas: 60, completedConsultas: 52, adherencePercent: 86.7, especialidadeName: 'Psicologia' },
  ]

  const units = prefeituraConsultasUnitRows.map((unit, index) => {
    const unitPlantoes = 12 + index * 2
    const unitScheduled = 140 + index * 24
    const unitCompleted = Math.round(unitScheduled * (0.82 + (index % 3) * 0.04))
    return {
      id: unit.id,
      name: unit.name,
      region: unit.region,
      regionKey: unit.regionKey,
      plantoesCount: unitPlantoes,
      scheduledConsultas: unitScheduled,
      completedConsultas: unitCompleted,
      adherencePercent:
        unitScheduled > 0 ? Math.round((unitCompleted / unitScheduled) * 1000) / 10 : 0,
    }
  }).sort((a, b) => b.adherencePercent - a.adherencePercent)

  const plantoesPoints = prefeituraConsultasDailySeries.map((point, index) => ({
    ...point,
    value: 3 + (index % 3),
  }))
  const consultasPoints = prefeituraConsultasDailySeries.map((point) => ({
    ...point,
    value: Math.round(point.value * 0.08),
  }))

  return {
    reportId: 'medicos-plantao',
    title: 'Médicos em plantão',
    description:
      'Profissionais escalados, consultas realizadas por plantão e aderência à cobertura contratada.',
    ...mockReportMeta(params),
    summary: {
      plantoesCount,
      professionalsCount,
      scheduledConsultas,
      completedConsultas,
      adherencePercent,
      avgConsultasPerPlantao: Math.round((completedConsultas / plantoesCount) * 10) / 10,
      unitsCount: units.length,
      plantoesDeltaPercent: 6.2,
      adherenceDeltaPp: 1.8,
      kpis: [
        {
          label: 'Plantões no período',
          value: String(plantoesCount),
          footer: '+6,2% vs período anterior',
          footerTone: 'positive',
          footerIcon: 'up',
          topBar: 'from-orange-400 to-amber-500',
        },
        {
          label: 'Aderência média',
          value: `${adherencePercent.toFixed(1).replace('.', ',')}%`,
          footer: '+1,8 p.p. vs período anterior',
          footerTone: 'positive',
          footerIcon: 'up',
          topBar: 'from-emerald-400 to-green-500',
        },
        {
          label: 'Profissionais escalados',
          value: String(professionalsCount),
          footer: 'Médicos e especialistas distintos',
          footerTone: 'neutral',
          topBar: 'from-sky-400 to-blue-500',
        },
        {
          label: 'Consultas por plantão',
          value: String(Math.round((completedConsultas / plantoesCount) * 10) / 10),
          footer: 'Média de atendimentos concluídos',
          footerTone: 'neutral',
          topBar: 'from-violet-400 to-purple-600',
        },
      ],
    },
    highlights: [
      {
        id: 'best-adherence',
        title: 'Melhor aderência',
        subtitle: `${professionals[0]?.name ?? '—'} · ${professionals[0]?.adherencePercent.toFixed(1).replace('.', ',') ?? '0'}%`,
        tone: 'green',
      },
      {
        id: 'most-plantoes',
        title: 'Mais plantões',
        subtitle: `${professionals[0]?.name ?? '—'} · ${professionals[0]?.plantoesCount ?? 0} escalas`,
        tone: 'blue',
      },
      {
        id: 'top-unit',
        title: 'Unidade destaque',
        subtitle: `${units[0]?.name ?? '—'} · ${units[0]?.adherencePercent.toFixed(1).replace('.', ',') ?? '0'}% aderência`,
        tone: 'amber',
      },
    ],
    professionals,
    units,
    evolution: {
      mode: 'daily',
      plantoesPoints,
      consultasPoints,
    },
  }
}

export async function fetchPrefeituraDuracaoMediaReport(
  _accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<DuracaoMediaReportApi> {
  void _accessToken
  await mockDelay()

  const avgDurationMinutes = 14.6
  const medianDurationMinutes = 13.2
  const completedCount = 2910

  const specialties = prefeituraConsultasSpecialties.map((item, index) => {
    const specCompleted = Math.round((item.sharePercent / 100) * completedCount)
    const avg = 12 + index * 1.4
    return {
      id: item.key,
      name: item.label,
      avgDurationMinutes: Math.round(avg * 10) / 10,
      medianDurationMinutes: Math.round((avg - 1.2) * 10) / 10,
      completedCount: specCompleted,
      sharePercent: item.sharePercent,
      avgDurationDeltaMinutes: index % 2 === 0 ? -0.8 : 1.2,
      isOutlier: avg > avgDurationMinutes * 1.5,
    }
  })

  const professionals = [
    { id: 'prof-1', name: 'Dra. Ana Silva', especialidadeName: 'Clínico Geral', avgDurationMinutes: 12.4, completedCount: 186, isOutlier: false },
    { id: 'prof-2', name: 'Dr. Carlos Mendes', especialidadeName: 'Pediatria', avgDurationMinutes: 15.8, completedCount: 142, isOutlier: false },
    { id: 'prof-3', name: 'Dra. Fernanda Lima', especialidadeName: 'Ginecologia', avgDurationMinutes: 22.6, completedCount: 98, isOutlier: true },
    { id: 'prof-4', name: 'Dr. Roberto Alves', especialidadeName: 'Cardiologia', avgDurationMinutes: 18.1, completedCount: 76, isOutlier: false },
    { id: 'prof-5', name: 'Dra. Juliana Costa', especialidadeName: 'Psicologia', avgDurationMinutes: 28.4, completedCount: 64, isOutlier: true },
  ]

  const units = prefeituraConsultasUnitRows.map((unit, index) => {
    const unitCompleted = Math.round(unit.completed * 0.85)
    const avg = 13 + index * 1.1
    return {
      id: unit.id,
      name: unit.name,
      region: unit.region,
      regionKey: unit.regionKey,
      avgDurationMinutes: Math.round(avg * 10) / 10,
      medianDurationMinutes: Math.round((avg - 0.9) * 10) / 10,
      completedCount: unitCompleted,
      durationVsNetworkMinutes: Math.round((avg - avgDurationMinutes) * 10) / 10,
      isOutlier: avg > avgDurationMinutes * 1.5,
    }
  })

  const durationPoints = prefeituraConsultasDailySeries.map((point, index) => ({
    ...point,
    value: Math.round((14 + (index % 4) * 0.6) * 10) / 10,
  }))
  const volumePoints = prefeituraConsultasDailySeries.map((point) => ({
    ...point,
    value: Math.round(point.value * 0.28),
  }))

  return {
    reportId: 'duracao-media',
    title: 'Duração média das consultas',
    description:
      'Tempo médio de atendimento por especialidade, profissional ou unidade, com outliers e desvios.',
    ...mockReportMeta(params),
    summary: {
      avgDurationMinutes,
      medianDurationMinutes,
      completedCount,
      specialtiesCount: specialties.length,
      unitsCount: units.length,
      outliersCount: professionals.filter((item) => item.isOutlier).length + units.filter((item) => item.isOutlier).length,
      avgDurationDeltaMinutes: -0.6,
      kpis: [
        { label: 'Duração média', value: `${avgDurationMinutes.toFixed(1).replace('.', ',')} min`, footer: '-0,6 min vs período anterior', footerTone: 'positive', footerIcon: 'down', topBar: 'from-orange-400 to-amber-500' },
        { label: 'Mediana da rede', value: `${medianDurationMinutes.toFixed(1).replace('.', ',')} min`, footer: 'Metade dos atendimentos abaixo deste tempo', footerTone: 'neutral', topBar: 'from-cyan-400 to-sky-500' },
        { label: 'Consultas analisadas', value: String(completedCount), footer: 'Atendimentos concluídos com duração registrada', footerTone: 'neutral', topBar: 'from-emerald-400 to-green-500' },
        { label: 'Outliers detectados', value: String(professionals.filter((item) => item.isOutlier).length), footer: 'Profissionais ou unidades acima de 1,5× a média', footerTone: 'muted', topBar: 'from-rose-400 to-red-500' },
      ],
    },
    highlights: [
      { id: 'fastest-specialty', title: 'Especialidade mais ágil', subtitle: `${specialties[specialties.length - 1]?.name ?? '—'} · ${specialties[specialties.length - 1]?.avgDurationMinutes ?? 0} min`, tone: 'green' },
      { id: 'slowest-specialty', title: 'Maior duração média', subtitle: `${specialties[0]?.name ?? '—'} · ${specialties[0]?.avgDurationMinutes ?? 0} min`, tone: 'amber' },
      { id: 'outlier-prof', title: 'Outlier de duração', subtitle: `${professionals.find((item) => item.isOutlier)?.name ?? '—'} · ${professionals.find((item) => item.isOutlier)?.avgDurationMinutes ?? 0} min`, tone: 'red' },
      { id: 'volume-leader', title: 'Maior volume', subtitle: `${units[0]?.name ?? '—'} · ${units[0]?.completedCount ?? 0} consultas`, tone: 'blue' },
    ],
    specialties,
    professionals,
    units,
    evolution: { mode: 'daily', durationPoints, volumePoints },
  }
}

export async function fetchPrefeituraInterrupcoesReconexoesReport(
  _accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<InterrupcoesReconexoesReportApi> {
  void _accessToken
  await mockDelay()

  const totalConsultas = 3240
  const interruptions = 86
  const reconnections = 142
  const interruptionRatePercent = Math.round((interruptions / totalConsultas) * 1000) / 10
  const reconnectionRatePercent = Math.round((reconnections / totalConsultas) * 1000) / 10
  const completionRatePercent = 94.2

  const breakdown = [
    { key: 'interrupcao' as const, label: 'Interrompidas', count: interruptions, sharePercent: interruptionRatePercent, completionRatePercent: 62.4 },
    { key: 'reconexao' as const, label: 'Com reconexão', count: reconnections, sharePercent: reconnectionRatePercent, completionRatePercent: 91.8 },
    { key: 'normal' as const, label: 'Sem intercorrências', count: totalConsultas - interruptions, sharePercent: Math.round(((totalConsultas - interruptions) / totalConsultas) * 1000) / 10, completionRatePercent: 97.6 },
  ]

  const units = prefeituraConsultasUnitRows.map((unit, index) => {
    const unitTotal = Math.round(unit.volumeTotal * 0.92)
    const unitInterruptions = 6 + (index % 4)
    const unitReconnections = 10 + index * 2
    const unitCompletion = 92 + (index % 5)
    return {
      id: unit.id,
      name: unit.name,
      region: unit.region,
      regionKey: unit.regionKey,
      totalConsultas: unitTotal,
      interruptions: unitInterruptions,
      reconnections: unitReconnections,
      interruptionRatePercent: unitTotal > 0 ? Math.round((unitInterruptions / unitTotal) * 1000) / 10 : 0,
      reconnectionRatePercent: unitTotal > 0 ? Math.round((unitReconnections / unitTotal) * 1000) / 10 : 0,
      completionRatePercent: unitCompletion,
      completionVsNetworkPp: unitCompletion - completionRatePercent,
    }
  }).sort((a, b) => b.interruptionRatePercent - a.interruptionRatePercent)

  const interruptionPoints = prefeituraConsultasDailySeries.map((point, index) => ({ ...point, value: 2 + (index % 3) }))
  const reconnectionPoints = prefeituraConsultasDailySeries.map((point, index) => ({ ...point, value: 4 + (index % 4) }))
  const completionRatePoints = prefeituraConsultasDailySeries.map((point, index) => ({ ...point, value: 92 + (index % 4) }))

  return {
    reportId: 'interrupcoes-reconexoes',
    title: 'Interrupções e reconexões',
    description:
      'Ocorrências de queda de chamada, reconexões e impacto na conclusão das teleconsultas.',
    ...mockReportMeta(params),
    summary: {
      totalConsultas,
      interruptions,
      reconnections,
      interruptionRatePercent,
      reconnectionRatePercent,
      completionRatePercent,
      unitsCount: units.length,
      interruptionDeltaPp: -0.4,
      completionDeltaPp: 0.8,
      kpis: [
        { label: 'Taxa de interrupção', value: `${interruptionRatePercent.toFixed(1).replace('.', ',')}%`, footer: '-0,4 p.p. vs período anterior', footerTone: 'positive', footerIcon: 'down', topBar: 'from-rose-400 to-red-500' },
        { label: 'Reconexões detectadas', value: String(reconnections), footer: `${reconnectionRatePercent.toFixed(1).replace('.', ',')}% das consultas`, footerTone: 'neutral', topBar: 'from-amber-400 to-orange-500' },
        { label: 'Conclusão após instabilidade', value: `${completionRatePercent.toFixed(1).replace('.', ',')}%`, footer: '+0,8 p.p. vs período anterior', footerTone: 'positive', footerIcon: 'up', topBar: 'from-emerald-400 to-green-500' },
        { label: 'Consultas analisadas', value: String(totalConsultas), footer: 'Teleconsultas no período selecionado', footerTone: 'neutral', topBar: 'from-sky-400 to-blue-500' },
      ],
    },
    highlights: [
      { id: 'worst-unit', title: 'Maior taxa de interrupção', subtitle: `${units[0]?.name ?? '—'} · ${units[0]?.interruptionRatePercent ?? 0}%`, tone: 'red' },
      { id: 'best-completion', title: 'Melhor conclusão', subtitle: `${units.sort((a, b) => b.completionRatePercent - a.completionRatePercent)[0]?.name ?? '—'} · ${completionRatePercent}%`, tone: 'green' },
      { id: 'reconnections', title: 'Reconexões no período', subtitle: `${reconnections} consultas retomadas após queda`, tone: 'amber' },
      { id: 'impact', title: 'Impacto na conclusão', subtitle: 'Interrompidas concluem 35 p.p. abaixo da média', tone: 'blue' },
    ],
    breakdown,
    units,
    evolution: { mode: 'daily', interruptionPoints, reconnectionPoints, completionRatePoints },
  }
}

export async function fetchPrefeituraAvaliacoesAtendimentosReport(
  _accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<AvaliacoesAtendimentosReportApi> {
  void _accessToken
  await mockDelay()

  const totalRatings = 1846
  const avgRating = 4.6
  const avgNotaProfissional = 4.7
  const avgNotaTeleconsulta = 4.5

  const distribution = [1, 2, 3, 4, 5].map((rating) => {
    const counts = [18, 42, 126, 486, 1174]
    const count = counts[rating - 1] ?? 0
    return {
      rating,
      count,
      sharePercent: totalRatings > 0 ? Math.round((count / totalRatings) * 1000) / 10 : 0,
    }
  })

  const comments = [
    { id: 'c1', unitName: 'UBS Centro', professionalName: 'Dra. Ana Silva', rating: 5, comment: 'Atendimento excelente, médica muito atenciosa.', avaliadoEm: '2026-06-10T14:22:00.000Z' },
    { id: 'c2', unitName: 'UBS Norte', professionalName: 'Dr. Carlos Mendes', rating: 4, comment: 'Boa consulta, apenas a conexão oscilou no início.', avaliadoEm: '2026-06-09T11:05:00.000Z' },
    { id: 'c3', unitName: 'UBS Sul', professionalName: 'Dra. Fernanda Lima', rating: 5, comment: 'Resolveu minha dúvida rapidamente.', avaliadoEm: '2026-06-08T16:40:00.000Z' },
    { id: 'c4', unitName: 'UBS Leste', professionalName: 'Dr. Roberto Alves', rating: 3, comment: 'Espera um pouco longa para entrar na chamada.', avaliadoEm: '2026-06-07T09:18:00.000Z' },
  ]

  const units = prefeituraConsultasUnitRows.map((unit, index) => {
    const ratingsCount = 120 + index * 28
    const unitAvg = 4.2 + (index % 4) * 0.15
    return {
      id: unit.id,
      name: unit.name,
      region: unit.region,
      regionKey: unit.regionKey,
      ratingsCount,
      avgRating: Math.round(unitAvg * 10) / 10,
      avgNotaProfissional: Math.round((unitAvg + 0.1) * 10) / 10,
      avgNotaTeleconsulta: Math.round((unitAvg - 0.05) * 10) / 10,
      avgRatingVsNetworkPp: Math.round((unitAvg - avgRating) * 10) / 10,
    }
  }).sort((a, b) => b.avgRating - a.avgRating)

  const ratingCountPoints = prefeituraConsultasDailySeries.map((point) => ({ ...point, value: Math.round(point.value * 0.12) }))
  const avgRatingPoints = prefeituraConsultasDailySeries.map((point, index) => ({ ...point, value: Math.round((4.4 + (index % 3) * 0.1) * 10) / 10 }))

  return {
    reportId: 'avaliacoes-atendimentos',
    title: 'Avaliações dos atendimentos',
    description:
      'Notas e comentários registrados pelos pacientes após a consulta, agregados por período e unidade.',
    ...mockReportMeta(params),
    summary: {
      totalRatings,
      avgRating,
      avgNotaProfissional,
      avgNotaTeleconsulta,
      unitsCount: units.length,
      ratingsDeltaPercent: 12.4,
      avgRatingDeltaPp: 0.2,
      kpis: [
        { label: 'Avaliações recebidas', value: String(totalRatings), footer: '+12,4% vs período anterior', footerTone: 'positive', footerIcon: 'up', topBar: 'from-orange-400 to-amber-500' },
        { label: 'Nota média geral', value: avgRating.toFixed(1).replace('.', ','), footer: '+0,2 p.p. vs período anterior', footerTone: 'positive', footerIcon: 'up', topBar: 'from-emerald-400 to-green-500' },
        { label: 'Nota do profissional', value: avgNotaProfissional.toFixed(1).replace('.', ','), footer: 'Média das notas de atendimento clínico', footerTone: 'neutral', topBar: 'from-violet-400 to-purple-600' },
        { label: 'Nota da teleconsulta', value: avgNotaTeleconsulta.toFixed(1).replace('.', ','), footer: 'Experiência tecnológica reportada', footerTone: 'neutral', topBar: 'from-cyan-400 to-sky-500' },
      ],
    },
    highlights: [
      { id: 'top-rated', title: 'Unidade melhor avaliada', subtitle: `${units[0]?.name ?? '—'} · ${units[0]?.avgRating ?? 0}`, tone: 'green' },
      { id: 'five-stars', title: 'Notas máximas', subtitle: `${distribution[4]?.sharePercent ?? 0}% das avaliações com 5 estrelas`, tone: 'blue' },
      { id: 'low-scores', title: 'Atenção a notas baixas', subtitle: `${distribution[0]?.count ?? 0 + (distribution[1]?.count ?? 0)} avaliações com 1 ou 2 estrelas`, tone: 'red' },
      { id: 'comments', title: 'Comentários qualitativos', subtitle: `${comments.length} amostras destacadas no relatório`, tone: 'amber' },
    ],
    distribution,
    comments,
    units,
    evolution: { mode: 'daily', ratingCountPoints, avgRatingPoints },
  }
}

export async function fetchPrefeituraSatisfacaoCidadaoReport(
  _accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<SatisfacaoCidadaoReportApi> {
  void _accessToken
  await mockDelay()

  const nps = 68.4
  const promotersPercent = 78.2
  const passivesPercent = 12.0
  const detractorsPercent = 9.8
  const avgRating = 4.6
  const ratingsCount = 1846

  const dimensions = [
    { key: 'profissional' as const, label: 'Atendimento do profissional', avgScore: 4.7, deltaPp: 0.3 },
    { key: 'teleconsulta' as const, label: 'Experiência da teleconsulta', avgScore: 4.5, deltaPp: 0.1 },
    { key: 'geral' as const, label: 'Satisfação geral', avgScore: avgRating, deltaPp: 0.2 },
  ]

  const units = prefeituraConsultasUnitRows.map((unit, index) => {
    const unitNps = 52 + index * 6
    const unitRatings = 100 + index * 22
    return {
      id: unit.id,
      name: unit.name,
      region: unit.region,
      regionKey: unit.regionKey,
      nps: unitNps,
      avgRating: Math.round((4.2 + (index % 4) * 0.15) * 10) / 10,
      ratingsCount: unitRatings,
      npsVsNetworkPp: unitNps - nps,
    }
  }).sort((a, b) => b.nps - a.nps)

  const npsPoints = prefeituraConsultasDailySeries.map((point, index) => ({ ...point, value: 62 + (index % 5) * 2 }))
  const avgRatingPoints = prefeituraConsultasDailySeries.map((point, index) => ({ ...point, value: Math.round((4.4 + (index % 3) * 0.1) * 10) / 10 }))

  return {
    reportId: 'satisfacao-cidadao',
    title: 'Satisfação do cidadão',
    description:
      'Indicadores consolidados de satisfação com o serviço, incluindo NPS e tendências de melhoria ou queda.',
    ...mockReportMeta(params),
    summary: {
      nps,
      promotersPercent,
      passivesPercent,
      detractorsPercent,
      avgRating,
      ratingsCount,
      unitsCount: units.length,
      npsDeltaPp: 4.2,
      avgRatingDeltaPp: 0.2,
      kpis: [
        { label: 'NPS da rede', value: String(nps).replace('.', ','), footer: '+4,2 p.p. vs período anterior', footerTone: 'positive', footerIcon: 'up', topBar: 'from-orange-400 to-amber-500' },
        { label: 'Promotores', value: `${promotersPercent.toFixed(1).replace('.', ',')}%`, footer: 'Notas 5 estrelas', footerTone: 'positive', topBar: 'from-emerald-400 to-green-500' },
        { label: 'Detratores', value: `${detractorsPercent.toFixed(1).replace('.', ',')}%`, footer: 'Notas 1 a 3 estrelas', footerTone: 'muted', topBar: 'from-rose-400 to-red-500' },
        { label: 'Base de avaliações', value: String(ratingsCount), footer: 'Respostas válidas no período', footerTone: 'neutral', topBar: 'from-sky-400 to-blue-500' },
      ],
    },
    highlights: [
      { id: 'nps-leader', title: 'Melhor NPS', subtitle: `${units[0]?.name ?? '—'} · NPS ${units[0]?.nps ?? 0}`, tone: 'green' },
      { id: 'promoters', title: 'Alta recomendação', subtitle: `${promotersPercent}% dos cidadãos são promotores`, tone: 'blue' },
      { id: 'detractors', title: 'Detratores', subtitle: `${detractorsPercent}% requerem plano de recuperação`, tone: 'red' },
      { id: 'trend', title: 'Tendência positiva', subtitle: 'NPS cresceu 4,2 p.p. vs período anterior', tone: 'amber' },
    ],
    dimensions,
    units,
    evolution: { mode: 'daily', npsPoints, avgRatingPoints },
  }
}

export async function fetchPrefeituraUnidadesCriticasReport(
  _accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<UnidadesCriticasReportApi> {
  void _accessToken
  await mockDelay()

  const thresholds = {
    minCompletionRatePercent: 92,
    maxAbandonmentRatePercent: 15,
    minAvgRating: 4,
    maxInterruptionRatePercent: 5,
    minNps: 50,
    maxAvgDurationMinutes: 25,
    minAvgDurationMinutes: 5,
  }

  const units = prefeituraConsultasUnitRows.slice(0, 4).map((unit, index) => {
    const severity = index < 2 ? ('critico' as const) : ('atencao' as const)
    const issues = [
      { key: 'completion', label: 'Taxa de conclusão', value: 88 - index * 2, threshold: thresholds.minCompletionRatePercent, direction: 'below' as const },
      { key: 'rating', label: 'Nota média', value: 3.6 + index * 0.1, threshold: thresholds.minAvgRating, direction: 'below' as const },
      ...(index === 0 ? [{ key: 'interruption', label: 'Taxa de interrupção', value: 7.2, threshold: thresholds.maxInterruptionRatePercent, direction: 'above' as const }] : []),
    ]
    return {
      id: unit.id,
      name: unit.name,
      region: unit.region,
      regionKey: unit.regionKey,
      severity,
      issuesCount: issues.length,
      completionRatePercent: 88 - index * 2,
      avgRating: 3.6 + index * 0.1,
      interruptionRatePercent: 4 + index * 1.2,
      nps: 42 - index * 4,
      avgDurationMinutes: 22 + index * 2,
      issues,
    }
  })

  const specialties = [
    { id: 'esp-1', name: 'Cardiologia', unitId: units[0]?.id ?? 'u1', unitName: units[0]?.name ?? 'UBS', severity: 'critico' as const, issuesCount: 2, issues: [{ key: 'rating', label: 'Nota média', value: 3.4, threshold: thresholds.minAvgRating, direction: 'below' as const }, { key: 'duration', label: 'Duração média', value: 28, threshold: thresholds.maxAvgDurationMinutes, direction: 'above' as const }] },
    { id: 'esp-2', name: 'Psicologia', unitId: units[1]?.id ?? 'u2', unitName: units[1]?.name ?? 'UBS', severity: 'atencao' as const, issuesCount: 1, issues: [{ key: 'nps', label: 'NPS', value: 46, threshold: thresholds.minNps, direction: 'below' as const }] },
  ]

  const criticalCountPoints = prefeituraConsultasDailySeries.map((point, index) => ({ ...point, value: 3 + (index % 3) }))

  return {
    reportId: 'unidades-criticas',
    title: 'Unidades críticas',
    description:
      'UBTs ou especialidades abaixo dos parâmetros mínimos de qualidade e que exigem plano de ação.',
    ...mockReportMeta(params),
    summary: {
      criticalUnitsCount: units.filter((item) => item.severity === 'critico').length,
      criticalSpecialtiesCount: specialties.filter((item) => item.severity === 'critico').length,
      unitsCount: prefeituraConsultasUnitRows.length,
      actionItemsCount: units.reduce((sum, item) => sum + item.issuesCount, 0) + specialties.reduce((sum, item) => sum + item.issuesCount, 0),
      criticalDeltaCount: -1,
      kpis: [
        { label: 'Unidades críticas', value: String(units.filter((item) => item.severity === 'critico').length), footer: 'Abaixo dos parâmetros mínimos', footerTone: 'negative', topBar: 'from-rose-400 to-red-500' },
        { label: 'Em atenção', value: String(units.filter((item) => item.severity === 'atencao').length), footer: 'Requerem monitoramento próximo', footerTone: 'muted', topBar: 'from-amber-400 to-orange-500' },
        { label: 'Itens de ação', value: String(units.reduce((sum, item) => sum + item.issuesCount, 0)), footer: 'Indicadores fora do limite por unidade', footerTone: 'neutral', topBar: 'from-sky-400 to-blue-500' },
        { label: 'Especialidades críticas', value: String(specialties.filter((item) => item.severity === 'critico').length), footer: 'Linhas assistenciais prioritárias', footerTone: 'negative', topBar: 'from-violet-400 to-purple-600' },
      ],
    },
    highlights: [
      { id: 'critical-unit', title: 'Unidade prioritária', subtitle: `${units[0]?.name ?? '—'} · ${units[0]?.issuesCount ?? 0} indicadores fora do limite`, tone: 'red' },
      { id: 'action-plan', title: 'Plano de ação', subtitle: `${units.reduce((sum, item) => sum + item.issuesCount, 0)} itens mapeados para correção`, tone: 'amber' },
      { id: 'improvement', title: 'Evolução positiva', subtitle: '1 unidade saiu da zona crítica vs período anterior', tone: 'green' },
      { id: 'specialty', title: 'Especialidade em risco', subtitle: `${specialties[0]?.name ?? '—'} em ${specialties[0]?.unitName ?? '—'}`, tone: 'blue' },
    ],
    thresholds,
    units,
    specialties,
    evolution: { mode: 'daily', criticalCountPoints },
  }
}

export async function fetchPrefeituraNovosCadastrosReport(
  _accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<NovosCadastrosReportApi> {
  void _accessToken
  await mockDelay()

  const newRegistrations = 684
  const previousNewRegistrations = 598
  const channels = [
    { key: 'ubt', label: 'Cadastro assistido na UBT', count: 286, sharePercent: 41.8 },
    { key: 'portal', label: 'Portal municipal', count: 212, sharePercent: 31.0 },
    { key: 'whatsapp', label: 'WhatsApp', count: 134, sharePercent: 19.6 },
    { key: 'outros', label: 'Outros canais', count: 52, sharePercent: 7.6 },
  ]
  const units = prefeituraConsultasUnitRows.slice(0, 8).map((unit, index) => ({
    id: unit.id,
    name: unit.name,
    region: unit.region,
    regionKey: unit.regionKey,
    count: 102 - index * 9,
    sharePercent: Math.round(((102 - index * 9) / newRegistrations) * 1000) / 10,
  }))
  const registrationPoints = prefeituraConsultasDailySeries.map((point, index) => ({
    ...point,
    value: 18 + (index % 6) * 4,
  }))

  return {
    reportId: 'novos-cadastros',
    title: 'Novos cadastros',
    description:
      'Entrada de novos pacientes no sistema por período, unidade de origem e canal de cadastramento.',
    ...mockReportMeta(params),
    summary: {
      newRegistrations,
      previousNewRegistrations,
      registrationsDeltaPercent: 14.4,
      channelsCount: channels.length,
      unitsCount: units.length,
      avgPerDay: 22.8,
      kpis: [
        {
          label: 'Novos cadastros',
          value: String(newRegistrations),
          footer: '+14,4% vs período anterior',
          footerTone: 'positive',
          footerIcon: 'up',
          topBar: 'from-orange-400 to-amber-500',
        },
        {
          label: 'Média diária',
          value: '22,8',
          footer: 'Pacientes novos por dia no período',
          footerTone: 'neutral',
          topBar: 'from-sky-400 to-blue-500',
        },
        {
          label: 'Canais ativos',
          value: String(channels.length),
          footer: 'Frentes de captação com registro',
          footerTone: 'neutral',
          topBar: 'from-emerald-400 to-green-500',
        },
        {
          label: 'Unidades com entrada',
          value: String(units.length),
          footer: 'UBTs com pelo menos 1 novo cadastro',
          footerTone: 'neutral',
          topBar: 'from-violet-400 to-purple-600',
        },
      ],
    },
    highlights: [
      { id: 'new-registrations', title: 'Cadastros no período', subtitle: `${newRegistrations} pacientes`, tone: 'blue' },
      { id: 'top-channel', title: 'Canal líder', subtitle: `${channels[0]?.label ?? '—'} · ${channels[0]?.sharePercent ?? 0}%`, tone: 'green' },
      { id: 'avg-per-day', title: 'Média por dia', subtitle: '22,8 novos pacientes/dia', tone: 'amber' },
    ],
    channels,
    units,
    evolution: {
      mode: 'daily',
      registrationPoints,
    },
  }
}

export async function fetchPrefeituraCadastrosIncompletosReport(
  _accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<CadastrosIncompletosReportApi> {
  void _accessToken
  await mockDelay()

  const incompleteCount = 438
  const totalPatients = 6240
  const fields = [
    { key: 'telefone', label: 'Telefone principal', count: 172, sharePercent: 39.3 },
    { key: 'endereco', label: 'Endereço completo', count: 138, sharePercent: 31.5 },
    { key: 'cpf', label: 'CPF', count: 74, sharePercent: 16.9 },
    { key: 'data_nascimento', label: 'Data de nascimento', count: 54, sharePercent: 12.3 },
  ]
  const units = prefeituraConsultasUnitRows.slice(0, 8).map((unit, index) => ({
    id: unit.id,
    name: unit.name,
    region: unit.region,
    regionKey: unit.regionKey,
    count: 82 - index * 7,
    sharePercent: Math.round(((82 - index * 7) / incompleteCount) * 1000) / 10,
  }))
  const samples = [
    {
      id: 'ci-1',
      name: 'Maria Souza',
      unitName: units[0]?.name ?? 'UBS Centro',
      missingFields: ['Telefone principal', 'Endereço completo'],
      missingCount: 2,
    },
    {
      id: 'ci-2',
      name: 'João Oliveira',
      unitName: units[1]?.name ?? 'UBS Norte',
      missingFields: ['CPF'],
      missingCount: 1,
    },
    {
      id: 'ci-3',
      name: 'Carla Ferreira',
      unitName: units[2]?.name ?? 'UBS Sul',
      missingFields: ['Data de nascimento', 'Telefone principal'],
      missingCount: 2,
    },
  ]
  const incompletePoints = prefeituraConsultasDailySeries.map((point, index) => ({
    ...point,
    value: 9 + (index % 5) * 2,
  }))

  return {
    reportId: 'cadastros-incompletos',
    title: 'Cadastros incompletos',
    description:
      'Registros com campos obrigatórios pendentes que podem impedir agendamento ou continuidade do cuidado.',
    ...mockReportMeta(params),
    summary: {
      incompleteCount,
      totalPatients,
      incompleteRatePercent: 7.0,
      unitsCount: units.length,
      incompleteDeltaCount: -36,
      kpis: [
        {
          label: 'Cadastros incompletos',
          value: String(incompleteCount),
          footer: '-36 vs período anterior',
          footerTone: 'positive',
          footerIcon: 'down',
          topBar: 'from-rose-400 to-red-500',
        },
        {
          label: 'Taxa de incompletude',
          value: '7,0%',
          footer: 'Percentual da base com pendências',
          footerTone: 'neutral',
          topBar: 'from-amber-400 to-orange-500',
        },
        {
          label: 'Pacientes na base',
          value: String(totalPatients),
          footer: 'Total cadastrado no município',
          footerTone: 'neutral',
          topBar: 'from-sky-400 to-blue-500',
        },
        {
          label: 'Unidades impactadas',
          value: String(units.length),
          footer: 'UBTs com pendências de cadastro',
          footerTone: 'neutral',
          topBar: 'from-violet-400 to-purple-600',
        },
      ],
    },
    highlights: [
      { id: 'incomplete-count', title: 'Pendências abertas', subtitle: `${incompleteCount} cadastros`, tone: 'red' },
      { id: 'incomplete-rate', title: 'Taxa de incompletude', subtitle: '7,0% da base atual', tone: 'amber' },
    ],
    fields,
    units,
    samples,
    evolution: {
      mode: 'daily',
      incompletePoints,
    },
  }
}

export async function fetchPrefeituraPacientesInativosReport(
  _accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<PacientesInativosReportApi> {
  void _accessToken
  await mockDelay()

  const inactiveCount = 1298
  const totalPatients = 6240
  const bands = [
    { key: '6m' as const, label: 'Sem consulta há 6+ meses', count: 618, sharePercent: 47.6 },
    { key: '12m' as const, label: 'Sem consulta há 12+ meses', count: 384, sharePercent: 29.6 },
    { key: 'never' as const, label: 'Nunca consultaram', count: 296, sharePercent: 22.8 },
  ]
  const units = prefeituraConsultasUnitRows.slice(0, 8).map((unit, index) => ({
    id: unit.id,
    name: unit.name,
    region: unit.region,
    regionKey: unit.regionKey,
    count: 188 - index * 16,
    sharePercent: Math.round(((188 - index * 16) / inactiveCount) * 1000) / 10,
  }))
  const inactivePoints = prefeituraConsultasDailySeries.map((point, index) => ({
    ...point,
    value: 42 + (index % 4) * 3,
  }))

  return {
    reportId: 'pacientes-inativos',
    title: 'Pacientes inativos',
    description:
      'Usuários sem consulta ou interação há determinado tempo, útil para campanhas de reengajamento.',
    ...mockReportMeta(params),
    summary: {
      inactiveCount,
      totalPatients,
      inactiveRatePercent: 20.8,
      neverConsultedCount: 296,
      unitsCount: units.length,
      inactiveDeltaCount: -58,
      kpis: [
        {
          label: 'Pacientes inativos',
          value: String(inactiveCount),
          footer: '-58 vs período anterior',
          footerTone: 'positive',
          footerIcon: 'down',
          topBar: 'from-rose-400 to-red-500',
        },
        {
          label: 'Taxa de inatividade',
          value: '20,8%',
          footer: 'Percentual da base sem atividade recente',
          footerTone: 'neutral',
          topBar: 'from-amber-400 to-orange-500',
        },
        {
          label: 'Nunca consultaram',
          value: '296',
          footer: 'Pacientes sem primeira consulta registrada',
          footerTone: 'muted',
          topBar: 'from-sky-400 to-blue-500',
        },
      ],
    },
    highlights: [
      { id: 'inactive-count', title: 'Base inativa', subtitle: `${inactiveCount} pacientes`, tone: 'amber' },
      { id: 'never-consulted', title: 'Nunca consultaram', subtitle: '296 pacientes sem primeiro atendimento', tone: 'red' },
    ],
    bands,
    units,
    evolution: {
      mode: 'daily',
      inactivePoints,
    },
  }
}

export async function fetchPrefeituraPerfilTerritorialReport(
  _accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<PerfilTerritorialReportApi> {
  void _accessToken
  await mockDelay()

  const totalPatients = 6240
  const neighborhoods = [
    { key: 'centro', label: 'Centro', patientsCount: 914, sharePercent: 14.6 },
    { key: 'jardim-norte', label: 'Jardim Norte', patientsCount: 832, sharePercent: 13.3 },
    { key: 'vila-nova', label: 'Vila Nova', patientsCount: 764, sharePercent: 12.2 },
    { key: 'boa-vista', label: 'Boa Vista', patientsCount: 702, sharePercent: 11.3 },
    { key: 'sao-joao', label: 'São João', patientsCount: 654, sharePercent: 10.5 },
  ]
  const regions = [
    { key: 'norte', label: 'Região Norte', patientsCount: 1832, sharePercent: 29.4 },
    { key: 'centro', label: 'Região Central', patientsCount: 1624, sharePercent: 26.0 },
    { key: 'sul', label: 'Região Sul', patientsCount: 1498, sharePercent: 24.0 },
    { key: 'leste', label: 'Região Leste', patientsCount: 1286, sharePercent: 20.6 },
  ]
  const units = prefeituraConsultasUnitRows.slice(0, 8).map((unit, index) => ({
    id: unit.id,
    name: unit.name,
    region: unit.region,
    regionKey: unit.regionKey,
    count: 846 - index * 68,
    sharePercent: Math.round(((846 - index * 68) / totalPatients) * 1000) / 10,
  }))
  const patientsPoints = prefeituraConsultasDailySeries.map((point, index) => ({
    ...point,
    value: 202 + (index % 6) * 18,
  }))

  return {
    reportId: 'perfil-territorial',
    title: 'Perfil territorial',
    description:
      'Distribuição da base por região, bairro ou território de saúde vinculado à prefeitura.',
    ...mockReportMeta(params),
    summary: {
      totalPatients,
      neighborhoodsCount: neighborhoods.length,
      regionsCount: regions.length,
      mappedPatientsPercent: 96.8,
      unitsCount: units.length,
      newInPeriod: 684,
      kpis: [
        {
          label: 'Pacientes mapeados',
          value: String(totalPatients),
          footer: 'Base georreferenciada no período',
          footerTone: 'neutral',
          topBar: 'from-sky-400 to-blue-500',
        },
        {
          label: 'Cobertura territorial',
          value: '96,8%',
          footer: 'Cadastros com endereço válido',
          footerTone: 'positive',
          topBar: 'from-emerald-400 to-green-500',
        },
        {
          label: 'Bairros ativos',
          value: String(neighborhoods.length),
          footer: 'Com pacientes cadastrados',
          footerTone: 'neutral',
          topBar: 'from-orange-400 to-amber-500',
        },
      ],
    },
    highlights: [
      { id: 'total-patients', title: 'Base territorial', subtitle: `${totalPatients} pacientes`, tone: 'blue' },
      { id: 'neighborhoods-count', title: 'Bairros monitorados', subtitle: `${neighborhoods.length} bairros com cobertura`, tone: 'green' },
    ],
    neighborhoods,
    regions,
    units,
    evolution: {
      mode: 'daily',
      patientsPoints,
    },
  }
}

export async function fetchPrefeituraRetornosPendentesReport(
  _accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<RetornosPendentesReportApi> {
  void _accessToken
  await mockDelay()

  const pendingCount = 512
  const breakdown = [
    { key: 'nao_agendado' as const, label: 'Não agendado', count: 228, sharePercent: 44.5 },
    { key: 'nao_realizado' as const, label: 'Não realizado', count: 184, sharePercent: 35.9 },
    { key: 'atrasado' as const, label: 'Atrasado > 30 dias', count: 100, sharePercent: 19.5 },
  ]
  const units = prefeituraConsultasUnitRows.slice(0, 8).map((unit, index) => ({
    id: unit.id,
    name: unit.name,
    region: unit.region,
    regionKey: unit.regionKey,
    count: 88 - index * 7,
    sharePercent: Math.round(((88 - index * 7) / pendingCount) * 1000) / 10,
  }))
  const patients = [
    {
      id: 'rp-1',
      patientName: 'José Martins',
      unitName: units[0]?.name ?? 'UBS Centro',
      scheduledDate: '2026-05-09',
      status: 'Aguardando agendamento',
      kind: 'nao_agendado' as const,
      daysOverdue: 35,
    },
    {
      id: 'rp-2',
      patientName: 'Lúcia Fernandes',
      unitName: units[1]?.name ?? 'UBS Norte',
      scheduledDate: '2026-05-14',
      status: 'Faltou e não reagendou',
      kind: 'nao_realizado' as const,
      daysOverdue: 30,
    },
    {
      id: 'rp-3',
      patientName: 'Marcelo Santos',
      unitName: units[2]?.name ?? 'UBS Sul',
      scheduledDate: '2026-04-29',
      status: 'Atraso crítico',
      kind: 'nao_realizado' as const,
      daysOverdue: 45,
    },
  ]
  const pendingPoints = prefeituraConsultasDailySeries.map((point, index) => ({
    ...point,
    value: 17 + (index % 5) * 2,
  }))

  return {
    reportId: 'retornos-pendentes',
    title: 'Retornos pendentes',
    description:
      'Pacientes com retorno programado ainda não agendados ou não realizados dentro do prazo clínico.',
    ...mockReportMeta(params),
    summary: {
      pendingCount,
      notScheduledCount: 228,
      notPerformedCount: 184,
      overdueCount: 100,
      unitsCount: units.length,
      pendingDeltaCount: -22,
      kpis: [
        {
          label: 'Retornos pendentes',
          value: String(pendingCount),
          footer: '-22 vs período anterior',
          footerTone: 'positive',
          footerIcon: 'down',
          topBar: 'from-amber-400 to-orange-500',
        },
        {
          label: 'Não agendados',
          value: '228',
          footer: 'Sem slot reservado para continuidade',
          footerTone: 'muted',
          topBar: 'from-rose-400 to-red-500',
        },
        {
          label: 'Atrasados',
          value: '100',
          footer: 'Acima de 30 dias do prazo clínico',
          footerTone: 'negative',
          topBar: 'from-violet-400 to-purple-600',
        },
      ],
    },
    highlights: [
      { id: 'pending-count', title: 'Pendências totais', subtitle: `${pendingCount} pacientes`, tone: 'amber' },
      { id: 'overdue-count', title: 'Atrasos críticos', subtitle: '100 retornos acima de 30 dias', tone: 'red' },
    ],
    breakdown,
    units,
    patients,
    evolution: {
      mode: 'daily',
      pendingPoints,
    },
  }
}
