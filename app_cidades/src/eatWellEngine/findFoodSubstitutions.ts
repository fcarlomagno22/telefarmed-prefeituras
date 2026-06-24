import { eatWellContent } from './content/loadEatWellContent'
import {
  catalogEntryToFoodEntry,
  getEatWellCatalogEntry,
  getEatWellCatalogIndex,
} from './foodCatalog'
import type { FoodEntry, MacroNutrients } from '../types/eatWell'

function macroDistance(left: MacroNutrients, right: MacroNutrients) {
  const weights = eatWellContent.foodSubstitutionRules.macro_distance_weights
  const minimumDenominator =
    eatWellContent.foodSubstitutionRules.macro_distance_formula.minimum_denominator

  const caloriesDen = Math.max(left.calories, minimumDenominator.calories)
  const proteinDen = Math.max(left.proteinG, minimumDenominator.protein)
  const carbsDen = Math.max(left.carbsG, minimumDenominator.carbs)
  const fatDen = Math.max(left.fatG, minimumDenominator.fat)
  const fiberDen = Math.max(left.fiberG, minimumDenominator.fiber)

  return (
    Math.abs(left.calories - right.calories) / caloriesDen * (weights.calories ?? 0.35) +
    Math.abs(left.proteinG - right.proteinG) / proteinDen * (weights.protein ?? 0.25) +
    Math.abs(left.carbsG - right.carbsG) / carbsDen * (weights.carbs ?? 0.18) +
    Math.abs(left.fatG - right.fatG) / fatDen * (weights.fat ?? 0.12) +
    Math.abs(left.fiberG - right.fiberG) / fiberDen * (weights.fiber ?? 0.1)
  )
}

function findOriginalCatalogId(entry: FoodEntry) {
  const normalizedName = entry.name.trim().toLowerCase()
  const index = getEatWellCatalogIndex()

  for (const food of index.foods) {
    if (food.name.trim().toLowerCase() === normalizedName) return food.id
    if (food.aliases?.some((alias) => alias.trim().toLowerCase() === normalizedName)) {
      return food.id
    }
  }

  if (entry.id.includes('-')) {
    const candidate = entry.id.split('-sub-')[0]?.split('-arch')[0]
    if (candidate && index.byId.has(candidate)) return candidate
  }

  return null
}

/** Retorna alternativas com perfil nutricional próximo ao alimento original. */
export function findSimilarFoodAlternatives(entry: FoodEntry, count = 5): FoodEntry[] {
  const seed = String(Date.now())
  const normalizedName = entry.name.trim().toLowerCase()
  const index = getEatWellCatalogIndex()
  const originalId = findOriginalCatalogId(entry)
  const originalEntry = originalId ? getEatWellCatalogEntry(originalId) : null
  const originalFood = originalEntry?.food
  const tolerancePct = eatWellContent.foodSubstitutionRules.calorie_tolerance_pct ?? 15

  const ranked = index.foods
    .filter((food) => food.name.trim().toLowerCase() !== normalizedName && food.id !== originalId)
    .map((food) => {
      const candidateEntry = catalogEntryToFoodEntry({
        id: food.id,
        name: food.name,
        kind: 'food',
        food,
      })
      if (!candidateEntry) return { food, distance: Number.POSITIVE_INFINITY }

      let distance = macroDistance(entry.macros, candidateEntry.macros)

      if (originalFood) {
        if (originalFood.category !== food.category) distance += 0.35
        const sharedRoles = originalFood.meal_roles.filter((role) => food.meal_roles.includes(role))
        if (sharedRoles.length === 0) distance += 0.25
      }

      const calorieDeltaPct =
        entry.macros.calories > 0
          ? (Math.abs(candidateEntry.macros.calories - entry.macros.calories) / entry.macros.calories) *
            100
          : 0
      if (calorieDeltaPct > tolerancePct) distance += 0.4

      return { food, distance, candidateEntry }
    })
    .sort((left, right) => left.distance - right.distance)

  return ranked.slice(0, count).map(({ food, candidateEntry }, index) => ({
    ...(candidateEntry ?? {
      id: `${food.id}-sub-${index}-${seed}`,
      name: food.name,
      portionLabel: '1 porção',
      macros: entry.macros,
    }),
    id: `${food.id}-sub-${index}-${seed}`,
  }))
}

export const SUBSTITUTION_LOADING_MS = 900

export function delaySubstitutionLoading(ms = SUBSTITUTION_LOADING_MS) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}
