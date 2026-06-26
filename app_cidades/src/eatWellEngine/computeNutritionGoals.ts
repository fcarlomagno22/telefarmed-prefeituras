import { eatWellContent } from './content/loadEatWellContent'
import type { NutritionGoals } from '../types/eatWell'
import type { EatWellMenuObjective, EatWellMenuWizardForm } from '../utils/eatWellMenuWizard'
import { parseHeightMeters, parseWeightKg } from '../utils/eatWellMenuWizard'

function estimateBmr(weightKg: number, heightMeters: number) {
  const heightCm = heightMeters * 100
  const ageYears = eatWellContent.nutritionCalculationRules.bmr.default_age_years ?? 35
  const male =
    10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5
  const female =
    10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161
  return Math.round((male + female) / 2)
}

function getActivityMultiplier(form: EatWellMenuWizardForm) {
  const key = form.activityLevel ?? 'moderate'
  return (
    eatWellContent.nutritionCalculationRules.activity_multipliers[
      key as keyof typeof eatWellContent.nutritionCalculationRules.activity_multipliers
    ] ?? 1.55
  )
}

function getObjectiveAdjustmentPct(objective: EatWellMenuObjective) {
  return (
    eatWellContent.nutritionCalculationRules.objective_adjustments_pct[
      objective as keyof typeof eatWellContent.nutritionCalculationRules.objective_adjustments_pct
    ] ?? 0
  )
}

function getMacroSplit(objective: EatWellMenuObjective) {
  return (
    eatWellContent.nutritionCalculationRules.macro_splits_pct[
      objective as keyof typeof eatWellContent.nutritionCalculationRules.macro_splits_pct
    ] ?? eatWellContent.nutritionCalculationRules.macro_splits_pct.other
  )
}

export function computeNutritionGoalsFromWizard(form: EatWellMenuWizardForm): NutritionGoals {
  const weightKg = parseWeightKg(form.weightKg) ?? 70
  const heightMeters = parseHeightMeters(form.heightMeters) ?? 1.7
  const objective = form.objective ?? 'other'
  const bmr = estimateBmr(weightKg, heightMeters)
  const tdee = Math.round(bmr * getActivityMultiplier(form))

  let baseCalories = tdee
  baseCalories += Math.round((baseCalories * getObjectiveAdjustmentPct(objective)) / 100)

  if (form.hasCompulsion) {
    baseCalories += Math.round(
      (baseCalories *
        (eatWellContent.nutritionCalculationRules.modifiers.has_compulsion
          .calorie_adjust_pct ?? 0)) /
        100,
    )
  }

  if (form.sleepQuality <= 4) {
    baseCalories += Math.round(
      (baseCalories *
        (eatWellContent.nutritionCalculationRules.modifiers
          .sleep_quality_low_calorie_adjust_pct ?? 0)) /
        100,
    )
  }

  if (form.stressLevel >= 7) {
    baseCalories += Math.round(
      (baseCalories *
        (eatWellContent.nutritionCalculationRules.modifiers
          .stress_level_high_calorie_adjust_pct ?? 0)) /
        100,
    )
  }

  if (form.isPregnant) {
    baseCalories += Math.round(
      (baseCalories *
        (eatWellContent.nutritionCalculationRules.modifiers.pregnancy_calorie_adjust_pct ?? 0)) /
        100,
    )
  }

  if (form.isLactating) {
    baseCalories += Math.round(
      (baseCalories *
        (eatWellContent.nutritionCalculationRules.modifiers.lactation_calorie_adjust_pct ?? 0)) /
        100,
    )
  }

  const hungerDelta =
    (form.hungerLevel - 5) *
    (eatWellContent.nutritionCalculationRules.modifiers.hunger_level
      .calorie_adjust_per_point ?? 0)
  baseCalories += hungerDelta
  baseCalories = Math.max(1200, Math.round(baseCalories))

  const macroSplit = getMacroSplit(objective)
  const proteinG = Math.round((baseCalories * (macroSplit.protein / 100)) / 4)
  const carbsG = Math.round((baseCalories * (macroSplit.carbs / 100)) / 4)
  const fatG = Math.round((baseCalories * (macroSplit.fat / 100)) / 9)
  const fiberG = Math.round(
    (baseCalories / 1000) *
      (eatWellContent.nutritionCalculationRules.limits.fiber_g_per_1000kcal ?? 14),
  )
  const sugarsMaxG = Math.round(
    (baseCalories * (eatWellContent.nutritionCalculationRules.limits.sugars_max_pct_of_calories ?? 10)) /
      100 /
      4,
  )
  const saturatedFatMaxG = Math.round(
    (baseCalories *
      (eatWellContent.nutritionCalculationRules.limits.saturated_fat_max_pct_of_calories ?? 10)) /
      100 /
      9,
  )
  const waterMl = Math.min(
    eatWellContent.nutritionCalculationRules.limits.water_ml_maximum ?? 3500,
    Math.max(
      eatWellContent.nutritionCalculationRules.limits.water_ml_minimum ?? 1800,
      Math.round(weightKg * (eatWellContent.nutritionCalculationRules.limits.water_ml_per_kg ?? 35)),
    ),
  )

  return {
    baseCalories,
    proteinG,
    carbsG,
    fatG,
    fiberG,
    sugarsMaxG,
    saturatedFatMaxG,
    waterMl,
  }
}

export function computeMenuCalorieTarget(form: EatWellMenuWizardForm) {
  return computeNutritionGoalsFromWizard(form).baseCalories
}
