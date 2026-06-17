import type { DailyNutritionTotals, NutritionGoals } from '../types/eatWell'
import { formatGrams } from './eatWellNutritionStats'

export function buildDailyInsight(
  totals: DailyNutritionTotals,
  goals: NutritionGoals,
  adjustedCalorieTarget: number,
): string | null {
  const hints: string[] = []

  const proteinPct = goals.proteinG > 0 ? totals.proteinG / goals.proteinG : 0
  if (proteinPct > 0 && proteinPct < 0.85) {
    hints.push(
      `Proteína em ${Math.round(proteinPct * 100)}% — jantar com feijão ou frango pode fechar a meta.`,
    )
  }

  if (goals.sugarsMaxG > 0 && totals.sugarsG > goals.sugarsMaxG * 0.6) {
    hints.push(
      `Açúcares em ${formatGrams(totals.sugarsG)} — fique atento a bebidas e sobremesas no restante do dia.`,
    )
  }

  if (goals.waterMl > 0 && totals.waterMl < goals.waterMl * 0.5) {
    hints.push(
      `Hidratação em ${Math.round((totals.waterMl / goals.waterMl) * 100)}% — adicione mais água ao longo do dia.`,
    )
  }

  const calorieRatio = adjustedCalorieTarget > 0 ? totals.calories / adjustedCalorieTarget : 0
  if (calorieRatio > 1.05) {
    hints.push('Calorias acima da meta ajustada — equilibre as próximas refeições.')
  } else if (calorieRatio > 0 && calorieRatio < 0.55) {
    hints.push('Você ainda tem margem calórica confortável para as refeições restantes.')
  }

  if (goals.fiberG > 0 && totals.fiberG < goals.fiberG * 0.5) {
    hints.push('Fibras abaixo do ideal — inclua verduras, legumes ou frutas na próxima refeição.')
  }

  return hints[0] ?? null
}

export function countFilledMealSlots(mealCount: number, totalSlots: number) {
  return Math.max(0, totalSlots - mealCount)
}
