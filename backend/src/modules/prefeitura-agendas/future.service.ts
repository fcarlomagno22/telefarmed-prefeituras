import { listRedeUnits } from '../prefeitura-rede/units.service.js'
import { addDaysIso, todayIsoInBrazil } from '../ubt-agenda/slot-utils.js'
import {
  formatFutureDayLabel,
  formatPeakHourLabel,
  parseHourFromTime,
} from './formatters.js'
import { fetchAgendaRowsForPeriod, fetchUnitDailyCapacities } from './query.service.js'
import type { FutureAppointmentsSummaryDto } from './types.js'

export async function getPrefeituraAgendaFuture(
  entidadeId: string,
  params: { period: '7d' | '30d'; unidadeUbtId?: string },
): Promise<FutureAppointmentsSummaryDto> {
  const allUnits = await listRedeUnits(entidadeId)
  const visibleUnits =
    params.unidadeUbtId && params.unidadeUbtId !== 'todas'
      ? allUnits.filter((unit) => unit.id === params.unidadeUbtId)
      : allUnits

  const unitIds = visibleUnits.map((unit) => unit.id)
  const today = todayIsoInBrazil()
  const days = params.period === '30d' ? 30 : 7
  const endDate = addDaysIso(today, days - 1)

  const rows = await fetchAgendaRowsForPeriod(entidadeId, today, endDate, unitIds)
  const capacities = await fetchUnitDailyCapacities(entidadeId, unitIds)

  const total = rows.length
  const dailyAverage = days > 0 ? Math.round(total / days) : 0

  const byDay = new Map<string, number>()
  const byUnit = new Map<string, number>()
  const byHour = new Map<number, number>()
  let pendingConfirmation = 0
  let firstVisits = 0
  let returnVisits = 0

  for (const row of rows) {
    byDay.set(row.data, (byDay.get(row.data) ?? 0) + 1)
    byUnit.set(row.unidade_ubt_id, (byUnit.get(row.unidade_ubt_id) ?? 0) + 1)

    const hour = parseHourFromTime(row.hora)
    byHour.set(hour, (byHour.get(hour) ?? 0) + 1)

    const phone = row.telefone_contato?.trim() ?? ''
    if (row.status === 'agendado' && !phone) pendingConfirmation += 1

    if (row.tipo === 'retorno') returnVisits += 1
    else firstVisits += 1
  }

  const confirmed = total - pendingConfirmation

  let busiestDay = '—'
  let busiestCount = 0
  let quietestDay = '—'
  let quietestCount = 0

  if (byDay.size > 0) {
    let minKey = ''
    let maxKey = ''
    let minCount = Number.POSITIVE_INFINITY

    for (const [day, count] of byDay.entries()) {
      if (count < minCount) {
        minKey = day
        minCount = count
        quietestCount = count
      }
      if (count > busiestCount) {
        maxKey = day
        busiestCount = count
      }
    }

    busiestDay = maxKey ? formatFutureDayLabel(maxKey) : '—'
    quietestDay = minKey ? formatFutureDayLabel(minKey) : '—'
  }

  let topUnitId = ''
  let topUnitBookings = 0
  for (const [unitId, count] of byUnit.entries()) {
    if (count > topUnitBookings) {
      topUnitId = unitId
      topUnitBookings = count
    }
  }

  const topUnit = visibleUnits.find((unit) => unit.id === topUnitId)?.name ?? '—'

  let peakHourValue = 0
  let peakHourCount = 0
  for (const [hour, count] of byHour.entries()) {
    if (count > peakHourCount) {
      peakHourValue = hour
      peakHourCount = count
    }
  }

  const defaultCapacityPerUnit = 40
  const totalCapacity = Math.max(
    1,
    visibleUnits.reduce((sum, unit) => {
      const capacity = capacities.get(unit.id) ?? 0
      return sum + (capacity > 0 ? capacity : defaultCapacityPerUnit) * days
    }, 0),
  )
  const occupancyForecastPercent =
    total > 0 ? Math.min(100, Math.round((total / totalCapacity) * 100)) : 0

  return {
    total,
    dailyAverage,
    busiestDay,
    busiestCount,
    quietestDay,
    quietestCount,
    confirmed,
    pendingConfirmation,
    firstVisits,
    returnVisits,
    topUnit,
    topUnitBookings,
    peakHour: peakHourCount > 0 ? formatPeakHourLabel(peakHourValue) : '—',
    occupancyForecastPercent,
  }
}
