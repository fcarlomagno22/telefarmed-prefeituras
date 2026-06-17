import { buildWeekDayStrip, loadEatWellDailyRecord } from '../data/eatWellDailyStorage'
import { loadNutritionGoals } from '../data/eatWellGoalsStorage'
import type {
  EatWellDailyRecord,
  EatWellWeekHighlight,
  EatWellWeekSummary,
  NutritionGoals,
  RunWalkDayEnergy,
} from '../types/eatWell'
import {
  computeBalanceScore,
  computeDailyTotals,
  formatCalories,
  formatGrams,
  formatLitersFromMl,
  sumMealMacros,
} from './eatWellNutritionStats'
import { getAdjustedCalorieTarget, loadRunWalkDayEnergy } from './eatWellRunWalkCorrelation'
import { toLocalDateIso } from './runWalkWeeklyChart'

function getPreviousWeekDays(referenceDate = new Date()) {
  const today = new Date(referenceDate)
  today.setHours(0, 0, 0, 0)
  const weekday = today.getDay()
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday
  const currentMonday = new Date(today)
  currentMonday.setDate(today.getDate() + mondayOffset)

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(currentMonday)
    date.setDate(currentMonday.getDate() - 7 + index)
    return toLocalDateIso(date)
  })
}

function formatDeltaPct(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? 100 : null
  return Math.round(((current - previous) / previous) * 100)
}

function formatWeekLabel(referenceDate = new Date()) {
  const days = buildWeekDayStrip(referenceDate)
  const first = days[0]
  const last = days[6]
  if (!first || !last) return 'Esta semana'
  return `${first.dayNumber} – ${last.dayNumber} ${new Date(`${last.dateIso}T12:00:00`).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}`
}

function buildBalanceDistribution(scores: number[]) {
  return scores.reduce(
    (acc, score) => {
      if (score >= 80) acc.excellent += 1
      else if (score >= 60) acc.good += 1
      else if (score >= 40) acc.fair += 1
      else acc.low += 1
      return acc
    },
    { excellent: 0, good: 0, fair: 0, low: 0 },
  )
}

function buildHighlights(
  dayStats: EatWellWeekSummary['dayStats'],
): EatWellWeekHighlight[] {
  const withData = dayStats.filter((day) => day.hasData && !day.isFuture)
  if (withData.length === 0) return []

  const bestBalance = [...withData].sort((a, b) => b.balanceScore - a.balanceScore)[0]
  const bestProtein = [...withData].sort((a, b) => b.proteinG - a.proteinG)[0]
  const bestWater = [...withData].sort((a, b) => b.waterMl - a.waterMl)[0]

  const highlights: EatWellWeekHighlight[] = []

  if (bestBalance) {
    highlights.push({
      id: 'best-balance',
      title: 'Dia mais equilibrado',
      subtitle: bestBalance.weekdayLabel,
      value: `${bestBalance.balanceScore}`,
      dateIso: bestBalance.dateIso,
      accentColor: '#10b981',
    })
  }

  if (bestProtein && bestProtein.dateIso !== bestBalance?.dateIso) {
    highlights.push({
      id: 'best-protein',
      title: 'Maior proteína',
      subtitle: bestProtein.weekdayLabel,
      value: formatGrams(bestProtein.proteinG),
      dateIso: bestProtein.dateIso,
      accentColor: '#60a5fa',
    })
  } else if (bestProtein) {
    highlights.push({
      id: 'best-protein',
      title: 'Maior proteína',
      subtitle: bestProtein.weekdayLabel,
      value: formatGrams(bestProtein.proteinG),
      dateIso: bestProtein.dateIso,
      accentColor: '#60a5fa',
    })
  }

  if (bestWater) {
    highlights.push({
      id: 'best-water',
      title: 'Melhor hidratação',
      subtitle: bestWater.weekdayLabel,
      value: formatLitersFromMl(bestWater.waterMl),
      dateIso: bestWater.dateIso,
      accentColor: '#22d3ee',
    })
  }

  return highlights
}

function aggregateMacroTotals(records: EatWellDailyRecord[]) {
  return records.reduce(
    (acc, record) => {
      const totals = computeDailyTotals(record)
      return {
        calories: acc.calories + totals.calories,
        proteinG: acc.proteinG + totals.proteinG,
        carbsG: acc.carbsG + totals.carbsG,
        fatG: acc.fatG + totals.fatG,
        fiberG: acc.fiberG + totals.fiberG,
        sugarsG: acc.sugarsG + totals.sugarsG,
        saturatedFatG: acc.saturatedFatG + totals.saturatedFatG,
      }
    },
    {
      calories: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      fiberG: 0,
      sugarsG: 0,
      saturatedFatG: 0,
    },
  )
}

export async function loadEatWellWeekSummary(
  patientCpf: string,
  referenceDate = new Date(),
): Promise<EatWellWeekSummary> {
  const goals = await loadNutritionGoals(patientCpf)
  const weekDays = buildWeekDayStrip(referenceDate)
  const previousWeekDays = getPreviousWeekDays(referenceDate)

  const currentRecords = await Promise.all(
    weekDays.map(async (day) => ({
      day,
      record: await loadEatWellDailyRecord(patientCpf, day.dateIso),
      energy: day.isFuture
        ? ({ totalCaloriesBurned: 0, activities: [] } satisfies RunWalkDayEnergy)
        : await loadRunWalkDayEnergy(patientCpf, day.dateIso),
    })),
  )

  const previousRecords = await Promise.all(
    previousWeekDays.map((dateIso) => loadEatWellDailyRecord(patientCpf, dateIso)),
  )

  return computeEatWellWeekSummary({
    goals,
    weekDays,
    currentRecords,
    previousRecords,
    referenceDate,
  })
}

export function computeEatWellWeekSummary({
  goals,
  weekDays,
  currentRecords,
  previousRecords,
  referenceDate = new Date(),
}: {
  goals: NutritionGoals
  weekDays: ReturnType<typeof buildWeekDayStrip>
  currentRecords: Array<{
    day: (typeof weekDays)[number]
    record: EatWellDailyRecord
    energy: RunWalkDayEnergy
  }>
  previousRecords: EatWellDailyRecord[]
  referenceDate?: Date
}): EatWellWeekSummary {
  const activeRecords = currentRecords.filter(({ day }) => !day.isFuture)
  const dayStats = currentRecords.map(({ day, record, energy }) => {
    const totals = computeDailyTotals(record)
    const adjustedCalorieTarget = getAdjustedCalorieTarget(
      goals.baseCalories,
      energy.totalCaloriesBurned,
    )
    const balance = computeBalanceScore(totals, goals, adjustedCalorieTarget)
    const hasData =
      record.meals.some((meal) => meal.entries.length > 0) || record.waterLogs.length > 0

    return {
      dateIso: day.dateIso,
      weekdayLabel: day.weekdayLabel,
      dayNumber: day.dayNumber,
      isToday: day.isToday,
      isFuture: day.isFuture,
      calories: totals.calories,
      waterMl: totals.waterMl,
      balanceScore: balance.score,
      proteinG: totals.proteinG,
      adjustedCalorieTarget,
      hasData,
    }
  })

  const totalCalories = activeRecords.reduce(
    (sum, { record }) => sum + computeDailyTotals(record).calories,
    0,
  )
  const totalWaterMl = activeRecords.reduce(
    (sum, { record }) => sum + computeDailyTotals(record).waterMl,
    0,
  )
  const previousCalories = previousRecords.reduce(
    (sum, record) => sum + computeDailyTotals(record).calories,
    0,
  )
  const previousWater = previousRecords.reduce(
    (sum, record) => sum + computeDailyTotals(record).waterMl,
    0,
  )

  const scoredDays = dayStats.filter((day) => day.hasData && !day.isFuture)
  const avgBalanceScore =
    scoredDays.length > 0
      ? Math.round(scoredDays.reduce((sum, day) => sum + day.balanceScore, 0) / scoredDays.length)
      : 0

  const macroTotals = aggregateMacroTotals(activeRecords.map(({ record }) => record))
  const activeDayCount = Math.max(activeRecords.length, 1)
  const macroAverages = {
    calories: macroTotals.calories / activeDayCount,
    proteinG: macroTotals.proteinG / activeDayCount,
    carbsG: macroTotals.carbsG / activeDayCount,
    fatG: macroTotals.fatG / activeDayCount,
    fiberG: macroTotals.fiberG / activeDayCount,
    sugarsG: macroTotals.sugarsG / activeDayCount,
    saturatedFatG: macroTotals.saturatedFatG / activeDayCount,
  }

  const runWalkTotalBurned = activeRecords.reduce(
    (sum, { energy }) => sum + energy.totalCaloriesBurned,
    0,
  )
  const runWalkActiveDays = activeRecords.filter(
    ({ energy }) => energy.totalCaloriesBurned > 0,
  ).length

  const meals = activeRecords
    .flatMap(({ day, record }) =>
      record.meals
        .filter((meal) => meal.entries.length > 0)
        .map((meal) => ({
          dateIso: day.dateIso,
          weekdayLabel: day.weekdayLabel,
          meal,
          calories: sumMealMacros(meal).calories,
        })),
    )
    .sort(
      (left, right) =>
        new Date(right.meal.loggedAt).getTime() - new Date(left.meal.loggedAt).getTime(),
    )

  const summary: EatWellWeekSummary = {
    weekLabel: formatWeekLabel(referenceDate),
    totalCalories,
    totalWaterMl,
    avgDailyCalories: activeRecords.length > 0 ? totalCalories / activeRecords.length : 0,
    avgBalanceScore,
    caloriesDeltaPct: formatDeltaPct(totalCalories, previousCalories),
    waterDeltaPct: formatDeltaPct(totalWaterMl, previousWater),
    macroTotals,
    macroAverages,
    dayStats,
    balanceDistribution: buildBalanceDistribution(scoredDays.map((day) => day.balanceScore)),
    runWalkTotalBurned,
    runWalkActiveDays,
    highlights: buildHighlights(dayStats),
    meals,
  }

  return summary
}

export function formatDeltaLabel(deltaPct: number | null) {
  if (deltaPct == null) return '—'
  if (deltaPct === 0) return '0% vs semana anterior'
  const sign = deltaPct > 0 ? '▲' : '▼'
  return `${sign} ${Math.abs(deltaPct)}% vs semana anterior`
}

export function getBalanceHeatmapColor(score: number, hasData: boolean, isFuture: boolean) {
  if (isFuture) return 'rgba(255,255,255,0.04)'
  if (!hasData) return 'rgba(255,255,255,0.05)'
  if (score >= 80) return 'rgba(16, 185, 129, 0.72)'
  if (score >= 60) return 'rgba(132, 204, 22, 0.55)'
  if (score >= 40) return 'rgba(245, 158, 11, 0.55)'
  return 'rgba(248, 113, 113, 0.55)'
}

export function formatMacroPercent(value: number, total: number) {
  if (total <= 0) return 0
  return Math.round((value / total) * 100)
}

export function formatWeekCalories(value: number) {
  return formatCalories(value).replace(' kcal', '')
}
