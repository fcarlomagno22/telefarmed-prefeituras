import {
  loadAdminDashboardCatalog,
  loadConsultasMetrics,
  loadQueueByUnit,
  loadRevenueByEntidade,
  resolveEntidadeContractStatus,
  type DashboardContratoRow,
} from './catalog.service.js'
import {
  ADMIN_DASHBOARD_FILTER_OPTIONS,
  buildCityFilterOptions,
  buildStateFilterOptions,
  centavosToReais,
  formatAdminCurrencyCompact,
  resolveMunicipalityHealth,
  resolveMunicipalitySla,
  resolvePackageUsageStatus,
} from './formatters.js'
import { countOpenNocByEntidade, loadNocIncidents, syncAutoNocIncidents } from './noc.service.js'
import {
  DASHBOARD_HOURLY_SLOTS,
  formatDashboardHourLabel,
  resolveAdminDashboardPeriod,
} from './period.js'
import type {
  AdminDashboardOverviewDto,
  AdminMunicipalityRowDto,
} from './types.js'

function applyMunicipalityFilters(
  rows: AdminMunicipalityRowDto[],
  params: {
    state: string
    city: string
    contract: string
    health: string
  },
): AdminMunicipalityRowDto[] {
  return rows.filter((row) => {
    if (params.state !== 'all' && row.stateKey !== params.state) return false
    if (params.city !== 'all' && row.id !== params.city) return false
    if (params.contract !== 'all' && row.contractStatus !== params.contract) return false
    if (params.health !== 'all' && row.health !== params.health) return false
    return true
  })
}

function resolveActiveContract(contratos: DashboardContratoRow[]): DashboardContratoRow | null {
  return contratos.find((item) => item.status === 'ativo') ?? contratos[0] ?? null
}

function buildHourlyPoints(
  hourlyCounts: Map<number, number>,
  dayCount: number,
): AdminDashboardOverviewDto['hourly'] {
  return DASHBOARD_HOURLY_SLOTS.map((hour) => {
    const raw = hourlyCounts.get(hour) ?? 0
    const value = dayCount > 1 ? Math.round(raw / dayCount) : raw
    return {
      hour: formatDashboardHourLabel(hour),
      value,
    }
  })
}

export async function getAdminDashboardOverview(params: {
  period: 'hoje' | '7d' | '30d'
  state: string
  city: string
  contract: string
  health: string
}): Promise<AdminDashboardOverviewDto> {
  const periodRange = resolveAdminDashboardPeriod(params.period)
  const catalog = await loadAdminDashboardCatalog()

  const entidadeIds = catalog.entidades.map((item) => item.id)
  const allUnits = [...catalog.unitsByEntidade.values()].flat()
  const unitIds = allUnits.map((unit) => unit.id)
  const allContratoIds = [...catalog.contratosByEntidade.values()]
    .flat()
    .map((item) => item.id)

  const [consultasMetrics, revenueCentavos, queueByUnit] = await Promise.all([
    loadConsultasMetrics(
      entidadeIds,
      periodRange.startIso,
      periodRange.endIso,
      catalog.monthCycle.startIso,
      catalog.monthCycle.endIso,
    ),
    loadRevenueByEntidade(allContratoIds, catalog.monthCycle.cycleStart),
    loadQueueByUnit(unitIds),
  ])

  await syncAutoNocIncidents({
    entidades: catalog.entidades,
    contratosByEntidade: catalog.contratosByEntidade,
    unitsByEntidade: catalog.unitsByEntidade,
    queueByUnit,
  })

  const nocIncidents = await loadNocIncidents()
  const openNocByEntidade = countOpenNocByEntidade(nocIncidents)

  const municipalities: AdminMunicipalityRowDto[] = catalog.entidades.map((entidade) => {
    const contratos = catalog.contratosByEntidade.get(entidade.id) ?? []
    const activeContract = resolveActiveContract(contratos)
    const units = catalog.unitsByEntidade.get(entidade.id) ?? []

    const terminalsOnline = units.reduce((sum, unit) => sum + unit.stationsOnline, 0)
    const terminalsMaintenance = units.reduce((sum, unit) => sum + unit.maintenanceCount, 0)
    const terminalsTotal = units.reduce((sum, unit) => sum + unit.stationsTotal, 0)
    const terminalsOffline = Math.max(0, terminalsTotal - terminalsOnline - terminalsMaintenance)

    const packageUsagePercent = Math.round(activeContract?.percentualUtilizado ?? 0)
    const openNocCount = openNocByEntidade.get(entidade.id) ?? 0
    const revenue = revenueCentavos.get(entidade.id) ?? { package: 0, avulso: 0 }
    const avgSla = consultasMetrics.avgSlaByEntidade.get(entidade.id) ?? 0

    return {
      id: entidade.id,
      name: entidade.name,
      state: entidade.state,
      stateKey: entidade.stateKey,
      contractStatus: resolveEntidadeContractStatus(entidade, contratos),
      health: resolveMunicipalityHealth(packageUsagePercent, openNocCount),
      consultationsToday: consultasMetrics.periodCountByEntidade.get(entidade.id) ?? 0,
      consultationsMonth: consultasMetrics.monthCountByEntidade.get(entidade.id) ?? 0,
      packageUsagePercent,
      sla: resolveMunicipalitySla(avgSla, terminalsOnline),
      terminalsOnline,
      terminalsOffline,
      terminalsMaintenance,
      terminalsTotal,
      openNocCount,
      revenuePackage: centavosToReais(revenue.package),
      revenueAvulso: centavosToReais(revenue.avulso),
    }
  })

  const filtered = applyMunicipalityFilters(municipalities, params)

  const terminals = filtered.reduce(
    (acc, row) => {
      acc.online += row.terminalsOnline
      acc.offline += row.terminalsOffline
      acc.maintenance += row.terminalsMaintenance
      acc.total += row.terminalsTotal
      return acc
    },
    { online: 0, offline: 0, maintenance: 0, total: 0 },
  )

  const packageUsage = filtered.reduce(
    (acc, row) => {
      const contratos = catalog.contratosByEntidade.get(row.id) ?? []
      const active = resolveActiveContract(contratos)
      const contracted = active?.consultasContratadas ?? 0
      acc.contractedTotal += contracted
      acc.usedInCycle += Math.round((row.packageUsagePercent / 100) * contracted)
      return acc
    },
    {
      contractedTotal: 0,
      usedInCycle: 0,
      remainingInPackage: 0,
      usagePercent: 0,
      status: 'normal' as AdminDashboardOverviewDto['packageUsage']['status'],
    },
  )
  packageUsage.remainingInPackage = Math.max(0, packageUsage.contractedTotal - packageUsage.usedInCycle)
  packageUsage.usagePercent = packageUsage.contractedTotal
    ? Math.round((packageUsage.usedInCycle / packageUsage.contractedTotal) * 100)
    : 0
  packageUsage.status = resolvePackageUsageStatus(packageUsage.usagePercent)

  const revenue = filtered.reduce(
    (acc, row) => {
      acc.packageTotal += row.revenuePackage
      acc.avulsoTotal += row.revenueAvulso
      return acc
    },
    { packageTotal: 0, avulsoTotal: 0, grandTotal: 0 },
  )
  revenue.grandTotal = revenue.packageTotal + revenue.avulsoTotal

  const filteredEntidadeIds = new Set(filtered.map((row) => row.id))
  const filteredNoc = nocIncidents.filter(
    (incident) =>
      !incident.municipalityId || filteredEntidadeIds.has(incident.municipalityId),
  )

  const openNocCount = filteredNoc.filter((incident) => incident.status !== 'resolved').length
  const criticalNocCount = filteredNoc.filter((incident) => incident.priority === 'critical').length

  const slaValues = filtered
    .map((row) => consultasMetrics.avgSlaByEntidade.get(row.id))
    .filter((value): value is number => value != null && value > 0)
  const avgSlaMinutes =
    slaValues.length > 0
      ? Math.round(slaValues.reduce((sum, value) => sum + value, 0) / slaValues.length)
      : 0

  const kpis: AdminDashboardOverviewDto['kpis'] = [
    {
      key: 'prefeituras',
      label: 'Prefeituras',
      value: String(filtered.length),
      suffix: 'ativas na visão',
      topBar: 'from-sky-400 to-blue-500',
    },
    {
      key: 'consultas',
      label: params.period === 'hoje' ? 'Consultas hoje' : 'Consultas no período',
      value: String(filtered.reduce((sum, row) => sum + row.consultationsToday, 0)),
      suffix: 'atendimentos',
      topBar: 'from-emerald-400 to-green-500',
    },
    {
      key: 'noc',
      label: 'Incidentes NOC',
      value: String(openNocCount),
      suffix: 'em aberto',
      topBar: 'from-rose-400 to-red-500',
    },
    {
      key: 'sla',
      label: 'SLA médio',
      value: String(avgSlaMinutes || 0),
      suffix: 'min',
      topBar: 'from-amber-400 to-orange-500',
    },
    {
      key: 'terminais',
      label: 'Terminais',
      value: String(terminals.online),
      suffix: `online de ${terminals.total}`,
      topBar: 'from-teal-400 to-cyan-500',
    },
    {
      key: 'receita',
      label: 'Receita',
      value: formatAdminCurrencyCompact(revenue.grandTotal, false),
      suffix: 'estimada',
      topBar: 'from-amber-400 to-yellow-500',
    },
  ]

  const stateKeys = new Set(municipalities.map((row) => row.stateKey))

  return {
    filterKey: `${params.period}:${params.state}:${params.city}:${params.contract}:${params.health}`,
    municipalities: filtered,
    nocIncidents: filteredNoc,
    nocHighlight: filteredNoc.filter((incident) => incident.status !== 'resolved').slice(0, 3),
    openNocCount,
    criticalNocCount,
    kpis,
    hourly: buildHourlyPoints(consultasMetrics.hourlyCounts, periodRange.dayCount),
    packageUsage,
    revenue,
    terminals,
    avgSlaMinutes,
    isEmpty: filtered.length === 0,
    filterOptions: {
      period: [...ADMIN_DASHBOARD_FILTER_OPTIONS.period],
      state: buildStateFilterOptions(stateKeys),
      city: buildCityFilterOptions(municipalities, params.state),
      contract: [...ADMIN_DASHBOARD_FILTER_OPTIONS.contract],
      health: [...ADMIN_DASHBOARD_FILTER_OPTIONS.health],
    },
  }
}
