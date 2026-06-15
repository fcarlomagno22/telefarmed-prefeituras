import {
  BloodPressureHistoryEntry,
  BloodPressureHypertensionPattern,
  BloodPressureReportSummary,
  BloodPressureTarget,
  BloodPressureTimeSlot,
  BloodPressureTimeSlotStats,
  BloodPressureTrendBucket,
  BloodPressureTrendDirection,
} from '../types/bloodPressure'
import { PeriodSelection } from '../types/metrics'
import {
  BLOOD_PRESSURE_TIME_SLOT_LABELS,
  DEFAULT_BLOOD_PRESSURE_TARGET,
  filterBloodPressureHistoryByPeriod,
  getBloodPressureTimeSlot,
  isBloodPressureAboveTarget,
  isBloodPressureInTarget,
  sortBloodPressureHistory,
} from './bloodPressure'
import { formatPeriodLabel } from './metricsPeriod'

function average(values: number[]) {
  if (values.length === 0) return 0
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function formatDayBucketLabel(date: Date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function buildTrendBuckets(entries: BloodPressureHistoryEntry[]): BloodPressureTrendBucket[] {
  if (entries.length === 0) return []

  const bucketMap = new Map<
    string,
    { label: string; systolic: number[]; diastolic: number[]; sortKey: number }
  >()

  entries.forEach((entry) => {
    const dayStart = startOfDay(new Date(entry.recordedAt))
    const key = dayStart.toISOString()
    const existing = bucketMap.get(key)

    bucketMap.set(key, {
      label: formatDayBucketLabel(dayStart),
      systolic: [...(existing?.systolic ?? []), entry.systolic],
      diastolic: [...(existing?.diastolic ?? []), entry.diastolic],
      sortKey: dayStart.getTime(),
    })
  })

  return [...bucketMap.values()]
    .sort((left, right) => left.sortKey - right.sortKey)
    .map((bucket) => ({
      label: bucket.label,
      avgSystolic: average(bucket.systolic),
      avgDiastolic: average(bucket.diastolic),
      count: bucket.systolic.length,
    }))
}

function resolveTrendDirection(buckets: BloodPressureTrendBucket[]): {
  direction: BloodPressureTrendDirection
  systolicChangePct: number
} {
  if (buckets.length < 2) {
    return { direction: 'stable', systolicChangePct: 0 }
  }

  const first = buckets[0].avgSystolic
  const last = buckets[buckets.length - 1].avgSystolic
  if (first === 0) return { direction: 'stable', systolicChangePct: 0 }

  const systolicChangePct = Math.round(((last - first) / first) * 100)
  if (Math.abs(systolicChangePct) < 4) return { direction: 'stable', systolicChangePct }
  return { direction: systolicChangePct > 0 ? 'up' : 'down', systolicChangePct }
}

function buildTimeSlotStats(
  entries: BloodPressureHistoryEntry[],
  target: BloodPressureTarget,
): BloodPressureTimeSlotStats[] {
  const slots: BloodPressureTimeSlot[] = ['morning', 'afternoon', 'evening', 'night']

  return slots.map((slot) => {
    const slotEntries = entries.filter((entry) => getBloodPressureTimeSlot(entry.recordedAt) === slot)
    const aboveCount = slotEntries.filter((entry) =>
      isBloodPressureAboveTarget(entry.systolic, entry.diastolic, target),
    ).length

    return {
      slot,
      label: BLOOD_PRESSURE_TIME_SLOT_LABELS[slot],
      count: slotEntries.length,
      avgSystolic: average(slotEntries.map((entry) => entry.systolic)),
      avgDiastolic: average(slotEntries.map((entry) => entry.diastolic)),
      aboveTargetPct:
        slotEntries.length > 0 ? Math.round((aboveCount / slotEntries.length) * 100) : 0,
    }
  })
}

function resolvePeakTimeSlot(timeSlots: BloodPressureTimeSlotStats[]) {
  const withData = timeSlots.filter((slot) => slot.count > 0)
  if (withData.length === 0) return null

  return withData.reduce((peak, slot) =>
    slot.avgSystolic > peak.avgSystolic ? slot : peak,
  )
}

function buildHypertensionPattern(
  entries: BloodPressureHistoryEntry[],
  target: BloodPressureTarget,
): BloodPressureHypertensionPattern {
  const aboveTarget = entries.filter((entry) =>
    isBloodPressureAboveTarget(entry.systolic, entry.diastolic, target),
  )

  const dayKeysWithHigh = new Set<string>()
  aboveTarget.forEach((entry) => {
    dayKeysWithHigh.add(startOfDay(new Date(entry.recordedAt)).toISOString())
  })

  const sortedDayKeys = [...dayKeysWithHigh].sort()
  const sustainedDayKeys = new Set<string>()

  for (let index = 0; index < sortedDayKeys.length; index += 1) {
    const current = new Date(sortedDayKeys[index]).getTime()
    const nextKey = sortedDayKeys[index + 1]
    const next = nextKey ? new Date(nextKey).getTime() : null

    if (next !== null && next - current === 86_400_000) {
      sustainedDayKeys.add(sortedDayKeys[index])
      sustainedDayKeys.add(sortedDayKeys[index + 1])
    }
  }

  const sustainedReadings = aboveTarget.filter((entry) =>
    sustainedDayKeys.has(startOfDay(new Date(entry.recordedAt)).toISOString()),
  )

  const isolatedPeakReadings = aboveTarget.filter((entry) => {
    const dayKey = startOfDay(new Date(entry.recordedAt)).toISOString()
    if (sustainedDayKeys.has(dayKey)) return false

    const dayMs = new Date(dayKey).getTime()
    const prevDay = new Date(dayMs - 86_400_000).toISOString()
    const nextDay = new Date(dayMs + 86_400_000).toISOString()

    return !dayKeysWithHigh.has(prevDay) && !dayKeysWithHigh.has(nextDay)
  })

  return {
    sustainedDayCount: sustainedDayKeys.size,
    isolatedPeakCount: isolatedPeakReadings.length,
    sustainedReadings: sustainedReadings.slice(0, 8),
    isolatedPeakReadings: isolatedPeakReadings.slice(0, 8),
  }
}

export function buildBloodPressureReport(
  history: BloodPressureHistoryEntry[],
  period: PeriodSelection,
  target: BloodPressureTarget = DEFAULT_BLOOD_PRESSURE_TARGET,
): BloodPressureReportSummary {
  const filtered = sortBloodPressureHistory(
    filterBloodPressureHistoryByPeriod(history, period.start, period.end),
  )

  const inTargetCount = filtered.filter((entry) =>
    isBloodPressureInTarget(entry.systolic, entry.diastolic, target),
  ).length
  const inTargetPct = filtered.length > 0 ? Math.round((inTargetCount / filtered.length) * 100) : 0

  const aboveTargetReadings = filtered.filter((entry) =>
    isBloodPressureAboveTarget(entry.systolic, entry.diastolic, target),
  )

  const trendBuckets = buildTrendBuckets(filtered)
  const trendDirection = resolveTrendDirection(trendBuckets)
  const timeSlots = buildTimeSlotStats(filtered, target)
  const hypertensionPattern = buildHypertensionPattern(filtered, target)

  return {
    periodLabel: formatPeriodLabel(period),
    periodStart: period.start,
    periodEnd: period.end,
    target,
    totalReadings: filtered.length,
    overall: {
      minSystolic: filtered.length > 0 ? Math.min(...filtered.map((entry) => entry.systolic)) : 0,
      maxSystolic: filtered.length > 0 ? Math.max(...filtered.map((entry) => entry.systolic)) : 0,
      minDiastolic: filtered.length > 0 ? Math.min(...filtered.map((entry) => entry.diastolic)) : 0,
      maxDiastolic: filtered.length > 0 ? Math.max(...filtered.map((entry) => entry.diastolic)) : 0,
      avgSystolic: average(filtered.map((entry) => entry.systolic)),
      avgDiastolic: average(filtered.map((entry) => entry.diastolic)),
      inTargetPct,
      outOfTargetPct: 100 - inTargetPct,
    },
    aboveTarget: {
      count: aboveTargetReadings.length,
      pct: filtered.length > 0 ? Math.round((aboveTargetReadings.length / filtered.length) * 100) : 0,
      readings: aboveTargetReadings.slice(0, 8),
    },
    hypertensionPattern,
    timeSlots,
    peakTimeSlot: resolvePeakTimeSlot(timeSlots),
    trend: {
      buckets: trendBuckets,
      ...trendDirection,
    },
    readings: filtered,
  }
}

export function getBloodPressureTrendDirectionLabel(direction: BloodPressureTrendDirection) {
  if (direction === 'up') return 'Pressão em ascensão'
  if (direction === 'down') return 'Pressão em queda'
  return 'Estável'
}

export function formatBloodPressureTargetLabel(target: BloodPressureTarget) {
  return `${target.systolic}/${target.diastolic} mmHg`
}
