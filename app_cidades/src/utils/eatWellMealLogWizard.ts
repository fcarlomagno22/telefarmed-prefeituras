import { MOCK_FOOD_DATABASE, searchMockFoods, type MockFoodItem } from '../data/mockEatWellFoods'
import type {
  EatWellFoodUnit,
  EatWellMealBeverage,
  EatWellMealFeeling,
  EatWellMealLogFood,
  EatWellPortionSize,
  FoodEntry,
  MacroNutrients,
  MealLog,
} from '../types/eatWell'
import { EMPTY_MACROS, sumMacros } from './eatWellNutritionStats'

export const MEAL_LOG_WIZARD_STEPS = [
  { id: 1, icon: 'camera-outline' as const },
  { id: 2, icon: 'restaurant-outline' as const },
  { id: 3, icon: 'water-outline' as const },
  { id: 4, icon: 'analytics-outline' as const },
  { id: 5, icon: 'happy-outline' as const },
  { id: 6, icon: 'checkmark-done-outline' as const },
]

export const FOOD_UNIT_OPTIONS: { id: EatWellFoodUnit; label: string }[] = [
  { id: 'gramas', label: 'Gramas' },
  { id: 'unidade', label: 'Unidade' },
  { id: 'xicara', label: 'Xícara' },
  { id: 'colher_sopa', label: 'Colher de sopa' },
  { id: 'colher_cha', label: 'Colher de chá' },
]

export const PORTION_SIZE_OPTIONS: {
  id: EatWellPortionSize
  label: string
  subtitle: string
  multiplier: number
}[] = [
  { id: 'small', label: 'Pequena', subtitle: 'Menor que o usual', multiplier: 0.75 },
  { id: 'medium', label: 'Média', subtitle: 'Porção habitual', multiplier: 1 },
  { id: 'large', label: 'Grande', subtitle: 'Porção generosa', multiplier: 1.35 },
]

export const DRINK_ML_PRESETS = [200, 300, 350, 500] as const

export const MEAL_FEELING_OPTIONS: {
  id: 'light' | 'ok' | 'heavy' | 'overdid'
  label: string
  emoji: string
}[] = [
  { id: 'light', label: 'Leve', emoji: '🙂' },
  { id: 'ok', label: 'Ok', emoji: '😁' },
  { id: 'heavy', label: 'Pesado', emoji: '😮‍💨' },
  { id: 'overdid', label: 'Exagerei', emoji: '🫠' },
]

function scaleMacros(macros: MacroNutrients, factor: number): MacroNutrients {
  return {
    calories: Math.round(macros.calories * factor),
    proteinG: Math.round(macros.proteinG * factor * 10) / 10,
    carbsG: Math.round(macros.carbsG * factor * 10) / 10,
    fatG: Math.round(macros.fatG * factor * 10) / 10,
    fiberG: Math.round(macros.fiberG * factor * 10) / 10,
    sugarsG: Math.round(macros.sugarsG * factor * 10) / 10,
    saturatedFatG: Math.round(macros.saturatedFatG * factor * 10) / 10,
  }
}

export function getUnitLabel(unit: EatWellFoodUnit) {
  return FOOD_UNIT_OPTIONS.find((option) => option.id === unit)?.label ?? unit
}

export function formatFoodQuantityLabel(quantity: number, unit: EatWellFoodUnit) {
  const unitLabel = getUnitLabel(unit).toLowerCase()
  const qtyLabel = Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(1)
  if (unit === 'gramas') return `${qtyLabel} g`
  return `${qtyLabel} ${unitLabel}`
}

function mockFoodToLogFood(food: MockFoodItem, quantity = 1, unit: EatWellFoodUnit = 'unidade'): EatWellMealLogFood {
  return {
    id: `${food.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: food.name,
    quantity,
    unit,
    macros: scaleMacros(food.macros, quantity),
  }
}

export function mockIdentifyFoodsFromPhoto(): EatWellMealLogFood[] {
  const shuffled = [...MOCK_FOOD_DATABASE].sort(() => Math.random() - 0.5)
  const count = 2 + Math.floor(Math.random() * 3)
  const picks = shuffled.slice(0, count)

  return picks.map((food, index) => {
    const defaultUnits: EatWellFoodUnit[] = ['unidade', 'xicara', 'colher_sopa', 'gramas']
    const unit = defaultUnits[index % defaultUnits.length]!
    const quantity = unit === 'gramas' ? 120 + index * 40 : 1 + (index % 2)
    return mockFoodToLogFood(food, quantity, unit)
  })
}

export function createEmptyFoodEntry(): EatWellMealLogFood {
  return {
    id: `food-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: '',
    quantity: 1,
    unit: 'gramas',
    macros: { ...EMPTY_MACROS },
  }
}

export function refreshFoodEntryFromName(
  food: EatWellMealLogFood,
  name: string,
): EatWellMealLogFood {
  const trimmed = name.trim()
  if (!trimmed) {
    return { ...food, name: '', macros: { ...EMPTY_MACROS } }
  }

  const match = searchMockFoods(trimmed, 1)[0]
  const baseMacros = match?.macros ?? {
    ...EMPTY_MACROS,
    calories: Math.max(40, Math.round(trimmed.length * 8 + food.quantity * 12)),
    proteinG: Math.round(food.quantity * 1.2),
    carbsG: Math.round(food.quantity * 3.5),
    fatG: Math.round(food.quantity * 0.8),
    fiberG: Math.round(food.quantity * 0.4),
  }

  return {
    ...food,
    name: match?.name ?? trimmed,
    macros: scaleMacros(baseMacros, food.quantity),
  }
}

export function createManualFoodEntry(
  name: string,
  quantity: number,
  unit: EatWellFoodUnit,
): EatWellMealLogFood {
  const match = searchMockFoods(name, 1)[0]
  const baseMacros = match?.macros ?? {
    ...EMPTY_MACROS,
    calories: Math.max(40, Math.round(name.length * 8 + quantity * 12)),
    proteinG: Math.round(quantity * 1.2),
    carbsG: Math.round(quantity * 3.5),
    fatG: Math.round(quantity * 0.8),
    fiberG: Math.round(quantity * 0.4),
  }

  return {
    id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: match?.name ?? name.trim(),
    quantity,
    unit,
    macros: scaleMacros(baseMacros, quantity),
  }
}

export function applyPortionMultiplier(
  foods: EatWellMealLogFood[],
  portionSize: EatWellPortionSize,
): EatWellMealLogFood[] {
  const multiplier =
    PORTION_SIZE_OPTIONS.find((option) => option.id === portionSize)?.multiplier ?? 1

  if (multiplier === 1) return foods

  return foods.map((food) => ({
    ...food,
    macros: scaleMacros(food.macros, multiplier),
  }))
}

export function mealLogFoodToEntry(food: EatWellMealLogFood): FoodEntry {
  return {
    id: food.id,
    name: food.name,
    portionLabel: formatFoodQuantityLabel(food.quantity, food.unit),
    macros: { ...food.macros },
  }
}

export function beverageToFoodEntry(beverage: EatWellMealBeverage): FoodEntry {
  const normalized = beverage.name.trim().toLowerCase()
  const isWater =
    normalized.includes('água') ||
    normalized.includes('agua') ||
    normalized.includes('water')

  const caloriesPerMl = isWater ? 0 : 0.42
  const carbsPerMl = isWater ? 0 : 0.105

  const macros: MacroNutrients = {
    calories: Math.round(beverage.ml * caloriesPerMl),
    proteinG: 0,
    carbsG: Math.round(beverage.ml * carbsPerMl),
    fatG: 0,
    fiberG: 0,
    sugarsG: isWater ? 0 : Math.round(beverage.ml * carbsPerMl),
    saturatedFatG: 0,
  }

  return {
    id: `beverage-${Date.now()}`,
    name: beverage.name.trim(),
    portionLabel: `${beverage.ml} ml`,
    macros,
  }
}

export function buildMealEntries(
  foods: EatWellMealLogFood[],
  portionSize: EatWellPortionSize,
  beverage: EatWellMealBeverage | null,
): FoodEntry[] {
  const scaledFoods = applyPortionMultiplier(foods, portionSize)
  const entries = scaledFoods.map(mealLogFoodToEntry)
  if (beverage?.name.trim() && beverage.ml > 0) {
    entries.push(beverageToFoodEntry(beverage))
  }
  return entries
}

export function computeWizardTotals(
  foods: EatWellMealLogFood[],
  portionSize: EatWellPortionSize,
  beverage: EatWellMealBeverage | null,
) {
  return sumMacros(buildMealEntries(foods, portionSize, beverage))
}

export function getPortionSizeLabel(portionSize: EatWellPortionSize) {
  return PORTION_SIZE_OPTIONS.find((option) => option.id === portionSize)?.label ?? portionSize
}

export function getMealFeelingLabel(feeling: EatWellMealFeeling) {
  return MEAL_FEELING_OPTIONS.find((option) => option.id === feeling)?.label ?? feeling
}

export function getMealFeelingEmoji(feeling: EatWellMealFeeling) {
  return MEAL_FEELING_OPTIONS.find((option) => option.id === feeling)?.emoji ?? '🙂'
}

export function getMealFoodEntries(meal: { entries: FoodEntry[]; beverage?: EatWellMealBeverage | null }) {
  if (!meal.beverage) return meal.entries
  return meal.entries.filter((entry) => !entry.id.startsWith('beverage-'))
}
