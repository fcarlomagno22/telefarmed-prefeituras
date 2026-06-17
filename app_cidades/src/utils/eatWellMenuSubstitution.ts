import type { FoodEntry, MacroNutrients } from '../types/eatWell'
import { MOCK_FOOD_DATABASE, type MockFoodItem } from '../data/mockEatWellFoods'

const SUBSTITUTION_LOADING_MS = 900

export { SUBSTITUTION_LOADING_MS }

function macroDistance(left: MacroNutrients, right: MacroNutrients) {
  return (
    Math.abs(left.calories - right.calories) * 0.04 +
    Math.abs(left.proteinG - right.proteinG) * 2.4 +
    Math.abs(left.carbsG - right.carbsG) * 1.6 +
    Math.abs(left.fatG - right.fatG) * 2.2 +
    Math.abs(left.fiberG - right.fiberG) * 0.8
  )
}

function mockToAlternativeEntry(food: MockFoodItem, index: number, seed: string): FoodEntry {
  return {
    id: `${food.id}-sub-${index}-${seed}`,
    name: food.name,
    portionLabel: food.portionLabel,
    macros: { ...food.macros },
  }
}

function buildScaledVariant(base: FoodEntry, label: string, scale: number, index: number): FoodEntry {
  const macros: MacroNutrients = {
    calories: Math.round(base.macros.calories * scale),
    proteinG: Math.round(base.macros.proteinG * scale * 10) / 10,
    carbsG: Math.round(base.macros.carbsG * scale * 10) / 10,
    fatG: Math.round(base.macros.fatG * scale * 10) / 10,
    fiberG: Math.round(base.macros.fiberG * scale * 10) / 10,
    sugarsG: Math.round(base.macros.sugarsG * scale * 10) / 10,
    saturatedFatG: Math.round(base.macros.saturatedFatG * scale * 10) / 10,
  }

  return {
    id: `variant-${index}-${Date.now()}`,
    name: label,
    portionLabel: base.portionLabel,
    macros,
  }
}

/** Retorna 5 alternativas com perfil nutricional próximo ao alimento original. */
export function findSimilarFoodAlternatives(entry: FoodEntry, count = 5): FoodEntry[] {
  const seed = String(Date.now())
  const normalizedName = entry.name.trim().toLowerCase()

  const ranked = MOCK_FOOD_DATABASE.filter(
    (food) => food.name.trim().toLowerCase() !== normalizedName,
  )
    .map((food) => ({
      food,
      distance: macroDistance(entry.macros, food.macros),
    }))
    .sort((left, right) => left.distance - right.distance)

  const alternatives: FoodEntry[] = ranked
    .slice(0, count)
    .map(({ food }, index) => mockToAlternativeEntry(food, index, seed))

  if (alternatives.length >= count) {
    return alternatives
  }

  const fallbackLabels = [
    'Porção equilibrada',
    'Opção leve',
    'Opção proteica',
    'Opção similar',
    'Alternativa sugerida',
  ]

  for (let index = alternatives.length; index < count; index += 1) {
    const base = ranked[index % Math.max(ranked.length, 1)]?.food ?? MOCK_FOOD_DATABASE[0]
    const scale = 0.88 + (index % 3) * 0.08
    alternatives.push(
      buildScaledVariant(
        {
          id: base.id,
          name: base.name,
          portionLabel: base.portionLabel,
          macros: { ...base.macros },
        },
        `${base.name} · ${fallbackLabels[index - alternatives.length] ?? 'similar'}`,
        scale,
        index,
      ),
    )
  }

  return alternatives.slice(0, count)
}

export function delaySubstitutionLoading(ms = SUBSTITUTION_LOADING_MS) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}
