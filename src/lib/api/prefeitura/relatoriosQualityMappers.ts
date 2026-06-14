import type {
  AvaliacoesAtendimentosReportApi,
  DuracaoMediaReportApi,
  InterrupcoesReconexoesReportApi,
  SatisfacaoCidadaoReportApi,
  UnidadesCriticasIssueRow,
  UnidadesCriticasReportApi,
} from '../../../types/prefeituraRelatorios'

type BackendAvaliacoesAtendimentosReport = Omit<
  AvaliacoesAtendimentosReportApi,
  'summary' | 'distribution' | 'comments' | 'units'
> & {
  summary: {
    ratingCount: number
    avgNota: number
    avgNotaProfissional: number
    avgNotaTeleconsulta: number
    unitsCount: number
    ratingCountDeltaPercent: number
    avgNotaDeltaPp: number
    kpis: AvaliacoesAtendimentosReportApi['summary']['kpis']
  }
  distribution: Array<{ stars: number; count: number; sharePercent: number }>
  comments: Array<{
    id: string
    unitName: string
    professionalName: string
    nota: number
    notaProfissional: number | null
    notaTeleconsulta: number | null
    comentario: string
    avaliadoEm: string
  }>
  units: Array<{
    id: string
    name: string
    region: string
    regionKey: string
    ratingCount: number
    avgNota: number
    avgNotaProfissional: number
    avgNotaTeleconsulta: number
    avgVsNetworkPp: number
  }>
}

type BackendSatisfacaoCidadaoReport = Omit<
  SatisfacaoCidadaoReportApi,
  'summary' | 'dimensions' | 'units'
> & {
  summary: Omit<SatisfacaoCidadaoReportApi['summary'], 'ratingsCount'> & {
    ratingCount: number
  }
  dimensions: Array<{
    key: SatisfacaoCidadaoReportApi['dimensions'][number]['key']
    label: string
    avgScore: number
    scoreDeltaPp: number
  }>
  units?: Array<{
    id: string
    name: string
    region: string
    regionKey: string
    nps: number
    avgRating: number
    ratingCount: number
    npsVsNetworkPp: number
  }>
}

type BackendUnidadesCriticasEntity = {
  id: string
  name: string
  type: 'unit' | 'specialty'
  region?: string
  regionKey?: string
  severity: 'warning' | 'critical'
  issueCount: number
  issues: Array<{
    key: string
    label: string
    value: number
    threshold: number
    severity: 'warning' | 'critical'
  }>
  completionRatePercent: number
  avgRating: number
  interruptionRatePercent: number
  nps: number
  avgDurationMinutes: number
}

type BackendUnidadesCriticasReport = Omit<
  UnidadesCriticasReportApi,
  'summary' | 'units' | 'specialties' | 'thresholds'
> & {
  summary: {
    criticalUnitsCount: number
    criticalSpecialtiesCount: number
    warningUnitsCount?: number
    unitsAnalyzed: number
    specialtiesAnalyzed?: number
    criticalDeltaCount: number
    kpis: UnidadesCriticasReportApi['summary']['kpis']
  }
  units: BackendUnidadesCriticasEntity[]
  specialties: BackendUnidadesCriticasEntity[]
  thresholds: UnidadesCriticasReportApi['thresholds'] & {
    maxAbandonmentRatePercent?: number
    minAvgDurationMinutes?: number
  }
}

function mapSeverity(severity: 'warning' | 'critical'): 'atencao' | 'critico' {
  return severity === 'critical' ? 'critico' : 'atencao'
}

function mapIssueDirection(
  key: string,
  value: number,
  threshold: number,
): UnidadesCriticasIssueRow['direction'] {
  if (key === 'interruption' || key === 'duration') {
    return value > threshold ? 'above' : 'below'
  }
  return value < threshold ? 'below' : 'above'
}

function mapUnidadesCriticasIssues(
  issues: BackendUnidadesCriticasEntity['issues'],
): UnidadesCriticasIssueRow[] {
  return issues.map((issue) => ({
    key: issue.key,
    label: issue.label,
    value: issue.value,
    threshold: issue.threshold,
    direction: mapIssueDirection(issue.key, issue.value, issue.threshold),
  }))
}

function mapUnidadesCriticasUnitRow(row: BackendUnidadesCriticasEntity) {
  return {
    id: row.id,
    name: row.name,
    region: row.region ?? '—',
    regionKey: row.regionKey ?? '',
    severity: mapSeverity(row.severity),
    issuesCount: row.issueCount,
    completionRatePercent: row.completionRatePercent,
    avgRating: row.avgRating,
    interruptionRatePercent: row.interruptionRatePercent,
    nps: row.nps,
    avgDurationMinutes: row.avgDurationMinutes,
    issues: mapUnidadesCriticasIssues(row.issues),
  }
}

export function mapAvaliacoesAtendimentosReport(
  raw: BackendAvaliacoesAtendimentosReport,
): AvaliacoesAtendimentosReportApi {
  return {
    ...raw,
    summary: {
      totalRatings: raw.summary.ratingCount,
      avgRating: raw.summary.avgNota,
      avgNotaProfissional: raw.summary.avgNotaProfissional,
      avgNotaTeleconsulta: raw.summary.avgNotaTeleconsulta,
      unitsCount: raw.summary.unitsCount,
      ratingsDeltaPercent: raw.summary.ratingCountDeltaPercent,
      avgRatingDeltaPp: raw.summary.avgNotaDeltaPp,
      kpis: raw.summary.kpis,
    },
    distribution: raw.distribution.map((row) => ({
      rating: row.stars,
      count: row.count,
      sharePercent: row.sharePercent,
    })),
    comments: raw.comments.map((row) => ({
      id: row.id,
      unitName: row.unitName,
      professionalName: row.professionalName,
      rating: row.nota,
      comment: row.comentario,
      avaliadoEm: row.avaliadoEm,
    })),
    units: raw.units.map((row) => ({
      id: row.id,
      name: row.name,
      region: row.region,
      regionKey: row.regionKey,
      ratingsCount: row.ratingCount,
      avgRating: row.avgNota,
      avgNotaProfissional: row.avgNotaProfissional,
      avgNotaTeleconsulta: row.avgNotaTeleconsulta,
      avgRatingVsNetworkPp: row.avgVsNetworkPp,
    })),
  }
}

export function mapSatisfacaoCidadaoReport(
  raw: BackendSatisfacaoCidadaoReport,
): SatisfacaoCidadaoReportApi {
  return {
    ...raw,
    summary: {
      nps: raw.summary.nps,
      promotersPercent: raw.summary.promotersPercent,
      passivesPercent: raw.summary.passivesPercent,
      detractorsPercent: raw.summary.detractorsPercent,
      avgRating: raw.summary.avgRating,
      ratingsCount: raw.summary.ratingCount,
      unitsCount: raw.summary.unitsCount,
      npsDeltaPp: raw.summary.npsDeltaPp,
      avgRatingDeltaPp: raw.summary.avgRatingDeltaPp,
      kpis: raw.summary.kpis,
    },
    dimensions: raw.dimensions.map((row) => ({
      key: row.key,
      label: row.label,
      avgScore: row.avgScore,
      deltaPp: row.scoreDeltaPp,
    })),
    units: (raw.units ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      region: row.region,
      regionKey: row.regionKey,
      nps: row.nps,
      avgRating: row.avgRating,
      ratingsCount: row.ratingCount,
      npsVsNetworkPp: row.npsVsNetworkPp,
    })),
  }
}

export function mapUnidadesCriticasReport(
  raw: BackendUnidadesCriticasReport,
): UnidadesCriticasReportApi {
  const units = raw.units
    .filter((row) => row.type === 'unit')
    .map(mapUnidadesCriticasUnitRow)
  const specialties = raw.specialties
    .filter((row) => row.type === 'specialty')
    .map((row) => ({
      id: row.id,
      name: row.name,
      unitId: '',
      unitName: 'Rede',
      severity: mapSeverity(row.severity),
      issuesCount: row.issueCount,
      issues: mapUnidadesCriticasIssues(row.issues),
    }))

  const actionItemsCount =
    units.reduce((sum, row) => sum + row.issuesCount, 0) +
    specialties.reduce((sum, row) => sum + row.issuesCount, 0)

  return {
    ...raw,
    summary: {
      criticalUnitsCount: raw.summary.criticalUnitsCount,
      criticalSpecialtiesCount: raw.summary.criticalSpecialtiesCount,
      unitsCount: raw.summary.unitsAnalyzed,
      actionItemsCount,
      criticalDeltaCount: raw.summary.criticalDeltaCount,
      kpis: raw.summary.kpis,
    },
    units,
    specialties,
    thresholds: {
      minCompletionRatePercent: raw.thresholds.minCompletionRatePercent,
      maxAbandonmentRatePercent: raw.thresholds.maxAbandonmentRatePercent ?? 15,
      minAvgRating: raw.thresholds.minAvgRating,
      maxInterruptionRatePercent: raw.thresholds.maxInterruptionRatePercent,
      minNps: raw.thresholds.minNps,
      maxAvgDurationMinutes: raw.thresholds.maxAvgDurationMinutes,
      minAvgDurationMinutes: raw.thresholds.minAvgDurationMinutes ?? 5,
    },
  }
}

type BackendInterrupcoesReconexoesReport = Omit<
  InterrupcoesReconexoesReportApi,
  'summary' | 'breakdown' | 'evolution'
> & {
  summary: InterrupcoesReconexoesReportApi['summary'] & {
    completionWithEventsPercent?: number
    reconnectionDeltaPp?: number
    completionDeltaPp?: number
  }
  breakdown: Array<{
    key: 'interrupcao' | 'reconexao' | 'concluida_sem_evento' | 'outros' | 'normal'
    label: string
    count: number
    sharePercent: number
    completionRatePercent: number
  }>
  evolution: {
    mode: 'daily' | 'monthly'
    interruptionPoints?: InterrupcoesReconexoesReportApi['evolution']['interruptionPoints']
    reconnectionPoints?: InterrupcoesReconexoesReportApi['evolution']['reconnectionPoints']
    completionRatePoints?: InterrupcoesReconexoesReportApi['evolution']['completionRatePoints']
    completionImpactPoints?: InterrupcoesReconexoesReportApi['evolution']['completionRatePoints']
  }
}

type BackendDuracaoMediaReport = Omit<
  DuracaoMediaReportApi,
  'summary' | 'specialties' | 'professionals' | 'units'
> & {
  summary: {
    avgDurationMinutes: number
    medianDurationMinutes: number
    consultaCount: number
    outlierCount: number
    unitsCount: number
    specialtiesCount?: number
    durationDeltaPercent?: number
    avgDurationDeltaMinutes?: number
    kpis: DuracaoMediaReportApi['summary']['kpis']
  }
  specialties: Array<{
    id: string
    name: string
    avgMinutes: number
    medianMinutes: number
    consultaCount: number
    durationVsNetworkPercent: number
  }>
  professionals: Array<{
    id: string
    name: string
    especialidadeName: string
    avgMinutes: number
    medianMinutes: number
    consultaCount: number
  }>
  units: Array<{
    id: string
    name: string
    region: string
    regionKey: string
    avgMinutes: number
    medianMinutes: number
    consultaCount: number
    durationVsNetworkPercent: number
  }>
}

function mapInterrupcoesBreakdownKey(
  key: BackendInterrupcoesReconexoesReport['breakdown'][number]['key'],
): InterrupcoesReconexoesReportApi['breakdown'][number]['key'] {
  if (key === 'concluida_sem_evento' || key === 'outros') return 'normal'
  return key
}

export function mapInterrupcoesReconexoesReport(
  raw: BackendInterrupcoesReconexoesReport,
): InterrupcoesReconexoesReportApi {
  return {
    ...raw,
    summary: {
      totalConsultas: raw.summary.totalConsultas,
      interruptions: raw.summary.interruptions,
      reconnections: raw.summary.reconnections,
      interruptionRatePercent: raw.summary.interruptionRatePercent,
      reconnectionRatePercent: raw.summary.reconnectionRatePercent,
      completionRatePercent: raw.summary.completionRatePercent,
      unitsCount: raw.summary.unitsCount,
      interruptionDeltaPp: raw.summary.interruptionDeltaPp,
      completionDeltaPp: raw.summary.completionDeltaPp ?? 0,
      kpis: raw.summary.kpis,
    },
    breakdown: raw.breakdown.map((row) => ({
      key: mapInterrupcoesBreakdownKey(row.key),
      label: row.label,
      count: row.count,
      sharePercent: row.sharePercent,
      completionRatePercent: row.completionRatePercent,
    })),
    evolution: {
      mode: raw.evolution.mode,
      interruptionPoints: raw.evolution.interruptionPoints ?? [],
      reconnectionPoints: raw.evolution.reconnectionPoints ?? [],
      completionRatePoints:
        raw.evolution.completionRatePoints ?? raw.evolution.completionImpactPoints ?? [],
    },
  }
}

export function mapDuracaoMediaReport(raw: BackendDuracaoMediaReport): DuracaoMediaReportApi {
  const networkAvg = raw.summary.avgDurationMinutes
  const totalConsultas = raw.summary.consultaCount

  return {
    ...raw,
    summary: {
      avgDurationMinutes: raw.summary.avgDurationMinutes,
      medianDurationMinutes: raw.summary.medianDurationMinutes,
      completedCount: raw.summary.consultaCount,
      specialtiesCount: raw.summary.specialtiesCount ?? raw.specialties.length,
      unitsCount: raw.summary.unitsCount,
      outliersCount: raw.summary.outlierCount,
      avgDurationDeltaMinutes:
        raw.summary.avgDurationDeltaMinutes ??
        Math.round(networkAvg * ((raw.summary.durationDeltaPercent ?? 0) / 100) * 10) / 10,
      kpis: raw.summary.kpis,
    },
    specialties: raw.specialties.map((row) => ({
      id: row.id,
      name: row.name,
      avgDurationMinutes: row.avgMinutes,
      medianDurationMinutes: row.medianMinutes,
      completedCount: row.consultaCount,
      sharePercent:
        totalConsultas > 0
          ? Math.round((row.consultaCount / totalConsultas) * 1000) / 10
          : 0,
      avgDurationDeltaMinutes: 0,
      isOutlier: row.avgMinutes > networkAvg * 1.5,
    })),
    professionals: raw.professionals.map((row) => ({
      id: row.id,
      name: row.name,
      especialidadeName: row.especialidadeName,
      avgDurationMinutes: row.avgMinutes,
      completedCount: row.consultaCount,
      isOutlier: row.avgMinutes > networkAvg * 1.5,
    })),
    units: raw.units.map((row) => ({
      id: row.id,
      name: row.name,
      region: row.region,
      regionKey: row.regionKey,
      avgDurationMinutes: row.avgMinutes,
      medianDurationMinutes: row.medianMinutes,
      completedCount: row.consultaCount,
      durationVsNetworkMinutes: Math.round((row.avgMinutes - networkAvg) * 10) / 10,
      isOutlier: row.avgMinutes > networkAvg * 1.5,
    })),
  }
}
