import type { PrefeituraConsultasDailyPointDto, PrefeituraConsultasKpiDto } from '../prefeitura-consultas/types.js'

export type PatientReportHighlightDto = {
  id: string
  title: string
  subtitle: string
  tone: 'red' | 'green' | 'amber' | 'blue'
}

export type PatientReportUnitRowDto = {
  id: string
  name: string
  region: string
  regionKey: string
  count: number
  sharePercent: number
}

export type NovosCadastrosChannelRowDto = {
  key: string
  label: string
  count: number
  sharePercent: number
}

export type NovosCadastrosReportDto = {
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
    kpis: PrefeituraConsultasKpiDto[]
  }
  highlights: PatientReportHighlightDto[]
  channels: NovosCadastrosChannelRowDto[]
  units: PatientReportUnitRowDto[]
  evolution: {
    mode: 'daily' | 'monthly'
    registrationPoints: PrefeituraConsultasDailyPointDto[]
  }
}

export type CadastrosIncompletosFieldRowDto = {
  key: string
  label: string
  count: number
  sharePercent: number
}

export type CadastrosIncompletosSampleRowDto = {
  id: string
  name: string
  unitName: string
  missingFields: string[]
  missingCount: number
}

export type CadastrosIncompletosReportDto = {
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
    kpis: PrefeituraConsultasKpiDto[]
  }
  highlights: PatientReportHighlightDto[]
  fields: CadastrosIncompletosFieldRowDto[]
  units: PatientReportUnitRowDto[]
  samples: CadastrosIncompletosSampleRowDto[]
  evolution: {
    mode: 'daily' | 'monthly'
    incompletePoints: PrefeituraConsultasDailyPointDto[]
  }
}

export type PacientesInativosBandRowDto = {
  key: '6m' | '12m' | 'never'
  label: string
  count: number
  sharePercent: number
}

export type PacientesInativosReportDto = {
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
    kpis: PrefeituraConsultasKpiDto[]
  }
  highlights: PatientReportHighlightDto[]
  bands: PacientesInativosBandRowDto[]
  units: PatientReportUnitRowDto[]
  evolution: {
    mode: 'daily' | 'monthly'
    inactivePoints: PrefeituraConsultasDailyPointDto[]
  }
}

export type PerfilTerritorialNeighborhoodRowDto = {
  key: string
  label: string
  patientsCount: number
  sharePercent: number
}

export type PerfilTerritorialRegionRowDto = {
  key: string
  label: string
  patientsCount: number
  sharePercent: number
}

export type PerfilTerritorialReportDto = {
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
    kpis: PrefeituraConsultasKpiDto[]
  }
  highlights: PatientReportHighlightDto[]
  neighborhoods: PerfilTerritorialNeighborhoodRowDto[]
  regions: PerfilTerritorialRegionRowDto[]
  units: PatientReportUnitRowDto[]
  evolution: {
    mode: 'daily' | 'monthly'
    patientsPoints: PrefeituraConsultasDailyPointDto[]
  }
}

export type RetornosPendentesBreakdownRowDto = {
  key: 'nao_agendado' | 'nao_realizado' | 'atrasado'
  label: string
  count: number
  sharePercent: number
}

export type RetornosPendentesPatientRowDto = {
  id: string
  patientName: string
  unitName: string
  scheduledDate: string
  status: string
  kind: 'nao_agendado' | 'nao_realizado'
  daysOverdue: number
}

export type RetornosPendentesReportDto = {
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
    kpis: PrefeituraConsultasKpiDto[]
  }
  highlights: PatientReportHighlightDto[]
  breakdown: RetornosPendentesBreakdownRowDto[]
  units: PatientReportUnitRowDto[]
  patients: RetornosPendentesPatientRowDto[]
  evolution: {
    mode: 'daily' | 'monthly'
    pendingPoints: PrefeituraConsultasDailyPointDto[]
  }
}
