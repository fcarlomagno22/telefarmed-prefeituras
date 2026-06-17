import type {
  BalanceScoreBreakdown,
  DailyNutritionTotals,
  EatWellDailyRecord,
  FoodEntry,
  MacroNutrients,
  MealLog,
  MealSlotContribution,
  NutritionGoals,
} from '../types/eatWell'
import { MEAL_SLOT_CONFIG, MEAL_SLOT_ORDER } from './eatWellMealSlots'

export const EMPTY_MACROS: MacroNutrients = {
  calories: 0,
  proteinG: 0,
  carbsG: 0,
  fatG: 0,
  fiberG: 0,
  sugarsG: 0,
  saturatedFatG: 0,
}

export function sumMacros(entries: FoodEntry[]): MacroNutrients {
  return entries.reduce(
    (acc, entry) => ({
      calories: acc.calories + entry.macros.calories,
      proteinG: acc.proteinG + entry.macros.proteinG,
      carbsG: acc.carbsG + entry.macros.carbsG,
      fatG: acc.fatG + entry.macros.fatG,
      fiberG: acc.fiberG + entry.macros.fiberG,
      sugarsG: acc.sugarsG + entry.macros.sugarsG,
      saturatedFatG: acc.saturatedFatG + entry.macros.saturatedFatG,
    }),
    { ...EMPTY_MACROS },
  )
}

export function sumMealMacros(meal: MealLog): MacroNutrients {
  return sumMacros(meal.entries)
}

export function computeDailyTotals(record: EatWellDailyRecord): DailyNutritionTotals {
  const mealMacros = record.meals.reduce(
    (acc, meal) => {
      const mealTotal = sumMealMacros(meal)
      return {
        calories: acc.calories + mealTotal.calories,
        proteinG: acc.proteinG + mealTotal.proteinG,
        carbsG: acc.carbsG + mealTotal.carbsG,
        fatG: acc.fatG + mealTotal.fatG,
        fiberG: acc.fiberG + mealTotal.fiberG,
        sugarsG: acc.sugarsG + mealTotal.sugarsG,
        saturatedFatG: acc.saturatedFatG + mealTotal.saturatedFatG,
      }
    },
    { ...EMPTY_MACROS },
  )

  const waterMl = record.waterLogs.reduce((sum, log) => sum + log.ml, 0)

  return {
    ...mealMacros,
    waterMl,
  }
}

function clampScore(value: number) {
  return Math.min(100, Math.max(0, value))
}

function scoreCalories(consumed: number, target: number) {
  if (target <= 0) return 50
  const ratio = consumed / target
  if (ratio >= 0.9 && ratio <= 1.1) return 100
  if (ratio < 0.9) return clampScore(100 - (0.9 - ratio) * 200)
  return clampScore(100 - (ratio - 1.1) * 180)
}

function scoreMacroTarget(consumed: number, target: number) {
  if (target <= 0) return 50
  const ratio = consumed / target
  if (ratio >= 0.85 && ratio <= 1.15) return 100
  if (ratio < 0.85) return clampScore(ratio / 0.85 * 100)
  return clampScore(100 - (ratio - 1.15) * 120)
}

function scoreInverseLimit(consumed: number, max: number) {
  if (max <= 0) return 100
  const ratio = consumed / max
  if (ratio <= 0.7) return 100
  if (ratio <= 1) return clampScore(100 - (ratio - 0.7) * 100)
  return clampScore(Math.max(0, 60 - (ratio - 1) * 80))
}

export function computeMealBalanceScore(macros: MacroNutrients) {
  const calories = macros.calories
  if (calories <= 0) {
    return { score: 0 }
  }

  const proteinCal = macros.proteinG * 4
  const carbsCal = macros.carbsG * 4
  const fatCal = macros.fatG * 9
  const macroCalTotal = proteinCal + carbsCal + fatCal || 1

  const proteinPct = proteinCal / macroCalTotal
  const carbsPct = carbsCal / macroCalTotal
  const fatPct = fatCal / macroCalTotal

  function bandScore(value: number, low: number, high: number) {
    if (value >= low && value <= high) return 100
    if (value < low) return clampScore((value / low) * 100)
    return clampScore(100 - ((value - high) / (1 - high)) * 80)
  }

  const macroScore =
    (bandScore(proteinPct, 0.15, 0.35) +
      bandScore(carbsPct, 0.35, 0.58) +
      bandScore(fatPct, 0.2, 0.38)) /
    3

  const fiberTarget = Math.max(4, (calories / 500) * 5)
  const fiberScore = clampScore((macros.fiberG / fiberTarget) * 100)
  const sugarsScore = scoreInverseLimit(macros.sugarsG, Math.max(12, calories / 40))
  const saturatedFatScore = scoreInverseLimit(
    macros.saturatedFatG,
    Math.max(6, calories / 120),
  )

  const score = Math.round(
    macroScore * 0.42 + fiberScore * 0.22 + sugarsScore * 0.2 + saturatedFatScore * 0.16,
  )

  return { score: clampScore(score) }
}

export function computeBalanceScore(
  totals: DailyNutritionTotals,
  goals: NutritionGoals,
  adjustedCalorieTarget: number,
): BalanceScoreBreakdown {
  const caloriesScore = scoreCalories(totals.calories, adjustedCalorieTarget)
  const proteinScore = scoreMacroTarget(totals.proteinG, goals.proteinG)
  const carbsScore = scoreMacroTarget(totals.carbsG, goals.carbsG)
  const fatScore = scoreMacroTarget(totals.fatG, goals.fatG)
  const macroScore = (proteinScore + carbsScore + fatScore) / 3
  const fiberScore = clampScore((totals.fiberG / goals.fiberG) * 100)
  const sugarsScore = scoreInverseLimit(totals.sugarsG, goals.sugarsMaxG)
  const saturatedFatScore = scoreInverseLimit(totals.saturatedFatG, goals.saturatedFatMaxG)
  const waterScore = clampScore((totals.waterMl / goals.waterMl) * 100)

  const score = Math.round(
    caloriesScore * 0.25 +
      macroScore * 0.25 +
      fiberScore * 0.15 +
      sugarsScore * 0.15 +
      saturatedFatScore * 0.1 +
      waterScore * 0.1,
  )

  return {
    score,
    caloriesScore: Math.round(caloriesScore),
    macroScore: Math.round(macroScore),
    fiberScore: Math.round(fiberScore),
    sugarsScore: Math.round(sugarsScore),
    saturatedFatScore: Math.round(saturatedFatScore),
    waterScore: Math.round(waterScore),
  }
}

export function getBalanceTier(score: number) {
  if (score >= 80) {
    return {
      label: 'Equilibrado',
      gradientColors: ['#6ee7b7', '#10b981', '#059669'] as const,
    }
  }
  if (score >= 60) {
    return {
      label: 'No caminho',
      gradientColors: ['#bef264', '#84cc16', '#65a30d'] as const,
    }
  }
  if (score >= 40) {
    return {
      label: 'Ajustando',
      gradientColors: ['#fde68a', '#f59e0b', '#d97706'] as const,
    }
  }
  return {
    label: 'Desbalanceado',
    gradientColors: ['#fda4af', '#f87171', '#ef4444'] as const,
  }
}

export function computeMealContributions(record: EatWellDailyRecord): MealSlotContribution[] {
  const totalCalories = computeDailyTotals(record).calories
  if (totalCalories <= 0) return []

  const bySlot = new Map<string, number>()
  for (const meal of record.meals) {
    const calories = sumMealMacros(meal).calories
    if (calories <= 0) continue
    bySlot.set(meal.slot, (bySlot.get(meal.slot) ?? 0) + calories)
  }

  return MEAL_SLOT_ORDER.filter((slot) => (bySlot.get(slot) ?? 0) > 0).map((slot) => {
    const calories = bySlot.get(slot) ?? 0
    return {
      slot,
      calories,
      percentage: Math.round((calories / totalCalories) * 100),
    }
  })
}

/** Todas as refeições do dia — inclui slots vazios para o donut/legenda. */
export function computeAllMealContributions(record: EatWellDailyRecord): MealSlotContribution[] {
  const totalCalories = computeDailyTotals(record).calories

  const bySlot = new Map<string, number>()
  for (const meal of record.meals) {
    const calories = sumMealMacros(meal).calories
    if (calories <= 0) continue
    bySlot.set(meal.slot, (bySlot.get(meal.slot) ?? 0) + calories)
  }

  if (totalCalories <= 0) {
    const equalPct = Math.round(100 / MEAL_SLOT_ORDER.length)
    return MEAL_SLOT_ORDER.map((slot) => ({
      slot,
      calories: 0,
      percentage: equalPct,
    }))
  }

  return MEAL_SLOT_ORDER.map((slot) => {
    const calories = bySlot.get(slot) ?? 0
    return {
      slot,
      calories,
      percentage: calories > 0 ? Math.round((calories / totalCalories) * 100) : 0,
    }
  })
}

export function getMealForSlot(record: EatWellDailyRecord, slot: string) {
  return record.meals.find((meal) => meal.slot === slot) ?? null
}

export function formatCalories(value: number) {
  return `${Math.round(value).toLocaleString('pt-BR')} kcal`
}

export function formatGrams(value: number, unit = 'g') {
  return `${Math.round(value)}${unit}`
}

export function formatLitersFromMl(ml: number) {
  const roundedMl = Math.max(0, Math.round(ml))
  if (roundedMl <= 0) return '0,0 L'
  if (roundedMl < 100) return `${roundedMl} ml`

  const liters = roundedMl / 1000
  return `${liters.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} L`
}

export function formatMacroProgress(consumed: number, target: number) {
  return `${Math.round(consumed)}/${Math.round(target)}g`
}

export function getTopCalorieContributorInsight(
  contributions: MealSlotContribution[],
  emptySlots: number,
) {
  if (contributions.length === 0) {
    return 'Registre sua primeira refeição para ver a distribuição calórica.'
  }

  const top = contributions.reduce((best, current) =>
    current.calories > best.calories ? current : best,
  )
  const label = MEAL_SLOT_CONFIG[top.slot].label.toLowerCase()
  const emptyHint = emptySlots > 0 ? ` · ${emptySlots} refeições ainda vazias` : ''
  return `${top.percentage}% das calorias vieram do ${label}${emptyHint}`
}
