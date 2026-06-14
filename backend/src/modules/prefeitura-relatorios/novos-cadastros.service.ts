import {
  computeDeltaPercent,
  formatPeriodLabel,
} from '../prefeitura-consultas/formatters.js'
import { resolvePreviousPeriod } from '../prefeitura-consultas/period.js'
import type { PrefeituraConsultasKpiDto } from '../prefeitura-consultas/types.js'
import { listRedeUnits } from '../prefeitura-rede/units.service.js'
import type { RedeUnitApi } from '../prefeitura-rede/types.js'
import {
  filterPatientsCreatedInPeriod,
  loadPatientsForEntity,
  loadPreCadastroLinks,
  resolveRegistrationChannel,
} from './patient-data.service.js'
import {
  buildEvolutionSeries,
  conversionPercent,
  countDaysInclusive,
  filterUnitsByParams,
  formatNumber,
  formatPercent,
  resolveEntidadeRazaoSocial,
  useMonthlyEvolution,
} from './report-shared.js'
import type {
  NovosCadastrosChannelRowDto,
  NovosCadastrosReportDto,
  PatientReportHighlightDto,
  PatientReportUnitRowDto,
} from './patient-reports.types.js'

function buildPreCadastroMaps(rows: Awaited<ReturnType<typeof loadPreCadastroLinks>>) {
  const byPacienteId = new Map<string, (typeof rows)[number]>()
  const byCpf = new Map<string, (typeof rows)[number]>()
  for (const row of rows) {
    if (row.paciente_id) byPacienteId.set(String(row.paciente_id), row)
    byCpf.set(String(row.cpf), row)
  }
  return { byPacienteId, byCpf }
}

function buildChannels(
  rows: ReturnType<typeof filterPatientsCreatedInPeriod>,
  preCadastroMaps: ReturnType<typeof buildPreCadastroMaps>,
): NovosCadastrosChannelRowDto[] {
  const counts = new Map<string, { label: string; count: number }>()
  for (const row of rows) {
    const channel = resolveRegistrationChannel(
      row,
      preCadastroMaps.byPacienteId,
      preCadastroMaps.byCpf,
    )
    const current = counts.get(channel.key) ?? { label: channel.label, count: 0 }
    current.count += 1
    counts.set(channel.key, current)
  }

  const total = rows.length
  return [...counts.entries()]
    .map(([key, value]) => ({
      key,
      label: value.label,
      count: value.count,
      sharePercent: conversionPercent(value.count, total),
    }))
    .sort((a, b) => b.count - a.count)
}

function buildUnitRows(
  units: RedeUnitApi[],
  rows: ReturnType<typeof filterPatientsCreatedInPeriod>,
): PatientReportUnitRowDto[] {
  const counts = new Map<string, number>()
  for (const unit of units) counts.set(unit.id, 0)

  for (const row of rows) {
    const unitId = row.unidade_ubt_principal_id
    if (!unitId) continue
    counts.set(unitId, (counts.get(unitId) ?? 0) + 1)
  }

  const total = rows.length
  return units
    .map((unit) => ({
      id: unit.id,
      name: unit.name,
      region: unit.region,
      regionKey: unit.regionKey,
      count: counts.get(unit.id) ?? 0,
      sharePercent: conversionPercent(counts.get(unit.id) ?? 0, total),
    }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count)
}

function buildHighlights(
  currentCount: number,
  channels: NovosCadastrosChannelRowDto[],
  units: PatientReportUnitRowDto[],
): PatientReportHighlightDto[] {
  const topChannel = channels[0]
  const topUnit = units[0]
  return [
    {
      id: 'total',
      title: 'Novos cadastros',
      subtitle: `${formatNumber(currentCount)} pacientes no período`,
      tone: 'green',
    },
    {
      id: 'top-channel',
      title: 'Principal canal',
      subtitle: topChannel
        ? `${topChannel.label} · ${formatPercent(topChannel.sharePercent)}%`
        : '—',
      tone: 'blue',
    },
    {
      id: 'top-unit',
      title: 'Unidade com mais entradas',
      subtitle: topUnit ? `${topUnit.name} · ${formatNumber(topUnit.count)}` : '—',
      tone: 'amber',
    },
    {
      id: 'coverage',
      title: 'Canais ativos',
      subtitle: `${formatNumber(channels.length)} origens de cadastramento`,
      tone: 'green',
    },
  ]
}

function buildKpis(summary: NovosCadastrosReportDto['summary']): PrefeituraConsultasKpiDto[] {
  return [
    {
      label: 'Novos cadastros',
      value: formatNumber(summary.newRegistrations),
      footer:
        summary.registrationsDeltaPercent === 0
          ? 'Estável vs período anterior'
          : `${summary.registrationsDeltaPercent > 0 ? '+' : ''}${formatPercent(summary.registrationsDeltaPercent)}% vs período anterior`,
      footerTone: summary.registrationsDeltaPercent >= 0 ? 'positive' : 'muted',
      footerIcon: summary.registrationsDeltaPercent >= 0 ? 'up' : 'down',
      topBar: 'from-emerald-400 to-green-500',
    },
    {
      label: 'Média diária',
      value: formatNumber(summary.avgPerDay),
      footer: 'Entradas por dia no recorte',
      footerTone: 'neutral',
      topBar: 'from-sky-400 to-blue-500',
    },
    {
      label: 'Canais identificados',
      value: formatNumber(summary.channelsCount),
      footer: 'Origens de cadastramento no período',
      footerTone: 'neutral',
      topBar: 'from-violet-400 to-purple-600',
    },
    {
      label: 'Unidades no recorte',
      value: formatNumber(summary.unitsCount),
      footer: 'UBTs consideradas no relatório',
      footerTone: 'muted',
      topBar: 'from-orange-400 to-amber-500',
    },
  ]
}

export async function getNovosCadastrosReport(
  entidadeId: string,
  generatedBy: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<NovosCadastrosReportDto> {
  const [allUnits, entidadeRazaoSocial, allPatients, preCadastros] = await Promise.all([
    listRedeUnits(entidadeId),
    resolveEntidadeRazaoSocial(entidadeId),
    loadPatientsForEntity(entidadeId),
    loadPreCadastroLinks(entidadeId),
  ])

  const visibleUnits = filterUnitsByParams(allUnits, params)
  const previous = resolvePreviousPeriod(params.periodStart, params.periodEnd)
  const monthly = useMonthlyEvolution(params.periodStart, params.periodEnd)
  const preCadastroMaps = buildPreCadastroMaps(preCadastros)

  const scopedPatients =
    params.unidadeUbtId && params.unidadeUbtId !== 'todas'
      ? allPatients.filter((row) => row.unidade_ubt_principal_id === params.unidadeUbtId)
      : params.regionKey && params.regionKey !== 'todas'
        ? allPatients.filter((row) => {
            const unit = visibleUnits.find((item) => item.id === row.unidade_ubt_principal_id)
            return unit?.regionKey === params.regionKey
          })
        : allPatients

  const currentRows = filterPatientsCreatedInPeriod(
    scopedPatients,
    params.periodStart,
    params.periodEnd,
  )
  const previousRows = filterPatientsCreatedInPeriod(
    scopedPatients,
    previous.previousStart,
    previous.previousEnd,
  )

  const channels = buildChannels(currentRows, preCadastroMaps)
  const units = buildUnitRows(visibleUnits, currentRows)

  const countByDate = new Map<string, number>()
  for (const row of currentRows) {
    const date = row.criado_em.slice(0, 10)
    countByDate.set(date, (countByDate.get(date) ?? 0) + 1)
  }

  const days = countDaysInclusive(params.periodStart, params.periodEnd)
  const summary = {
    newRegistrations: currentRows.length,
    previousNewRegistrations: previousRows.length,
    registrationsDeltaPercent: computeDeltaPercent(currentRows.length, previousRows.length),
    channelsCount: channels.length,
    unitsCount: visibleUnits.length,
    avgPerDay: days > 0 ? Math.round((currentRows.length / days) * 10) / 10 : 0,
    kpis: [] as PrefeituraConsultasKpiDto[],
  }
  summary.kpis = buildKpis(summary)

  return {
    reportId: 'novos-cadastros',
    title: 'Novos cadastros',
    description:
      'Entrada de novos pacientes no sistema por período, unidade de origem e canal de cadastramento.',
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    periodLabel: formatPeriodLabel(params.periodStart, params.periodEnd),
    generatedAt: new Date().toISOString(),
    entidadeRazaoSocial,
    generatedBy,
    summary,
    highlights: buildHighlights(currentRows.length, channels, units),
    channels,
    units,
    evolution: {
      mode: monthly ? 'monthly' : 'daily',
      registrationPoints: buildEvolutionSeries(
        countByDate,
        params.periodStart,
        params.periodEnd,
        monthly,
      ),
    },
  }
}
