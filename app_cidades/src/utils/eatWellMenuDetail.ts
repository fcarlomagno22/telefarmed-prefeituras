import type {
  EatWellMenuDayLog,
  EatWellMenuFoodStatus,
  EatWellMenuMeal,
  EatWellSavedMenu,
  FoodEntry,
  MacroNutrients,
  MealSlot,
} from '../types/eatWell'
import { sumMacros } from './eatWellNutritionStats'
import { getMealSlotConfig } from './eatWellMealSlots'

export const MENU_DETAIL_SLOTS: MealSlot[] = [
  'breakfast',
  'morning_snack',
  'lunch',
  'afternoon_snack',
  'dinner',
  'basket',
]

export const MENU_DETAIL_SUGGESTED_TIMES: Partial<Record<MealSlot, string>> = {
  breakfast: '08:00',
  morning_snack: '10:30',
  lunch: '12:30',
  afternoon_snack: '15:30',
  dinner: '19:30',
  basket: '—',
}

export function getMenuDetailSuggestedTime(slot: MealSlot): string {
  return MENU_DETAIL_SUGGESTED_TIMES[slot] ?? getMealSlotConfig(slot).suggestedTime
}

export function getMenuMealForSlot(menu: EatWellSavedMenu, slot: MealSlot): EatWellMenuMeal | null {
  return menu.meals.find((meal) => meal.slot === slot) ?? null
}

export function buildMenuEntryStatusKey(slot: MealSlot, entryId: string) {
  return `${slot}:${entryId}`
}

export function getMenuEntryStatus(
  dayLog: EatWellMenuDayLog | null,
  slot: MealSlot,
  entryId: string,
): EatWellMenuFoodStatus | null {
  if (!dayLog) return null
  return dayLog.entryStatuses[buildMenuEntryStatusKey(slot, entryId)] ?? null
}

export function getResolvedFoodEntry(
  dayLog: EatWellMenuDayLog | null,
  slot: MealSlot,
  entry: FoodEntry,
): FoodEntry {
  const key = buildMenuEntryStatusKey(slot, entry.id)
  return dayLog?.entryOverrides?.[key] ?? entry
}

export function resolveMealWithOverrides(
  meal: EatWellMenuMeal | null,
  dayLog: EatWellMenuDayLog | null,
  slot: MealSlot,
): EatWellMenuMeal | null {
  if (!meal) return null

  return {
    ...meal,
    entries: meal.entries.map((entry) => getResolvedFoodEntry(dayLog, slot, entry)),
  }
}

export function computeMenuConsumedEntries(
  menu: EatWellSavedMenu,
  dayLog: EatWellMenuDayLog | null,
  slot?: MealSlot,
): FoodEntry[] {
  const meals = slot != null ? menu.meals.filter((meal) => meal.slot === slot) : menu.meals
  const consumed: FoodEntry[] = []

  for (const meal of meals) {
    for (const entry of meal.entries) {
      const resolved = getResolvedFoodEntry(dayLog, meal.slot, entry)
      if (getMenuEntryStatus(dayLog, meal.slot, entry.id) === 'consumed') {
        consumed.push(resolved)
      }
    }
  }

  return consumed
}

export function computeMenuConsumedMacros(
  menu: EatWellSavedMenu,
  dayLog: EatWellMenuDayLog | null,
  slot?: MealSlot,
): MacroNutrients {
  return sumMacros(computeMenuConsumedEntries(menu, dayLog, slot))
}

export function computeMealConsumedMacros(
  meal: EatWellMenuMeal | null,
  dayLog: EatWellMenuDayLog | null,
  slot: MealSlot,
): MacroNutrients {
  if (!meal) return sumMacros([])

  const consumed = meal.entries
    .filter((entry) => getMenuEntryStatus(dayLog, slot, entry.id) === 'consumed')
    .map((entry) => getResolvedFoodEntry(dayLog, slot, entry))

  return sumMacros(consumed)
}

export function computeMenuMealCalories(
  meal: EatWellMenuMeal | null,
  dayLog: EatWellMenuDayLog | null = null,
  slot?: MealSlot,
): number {
  if (!meal) return 0

  const entries =
    dayLog && slot
      ? meal.entries.map((entry) => getResolvedFoodEntry(dayLog, slot, entry))
      : meal.entries

  return Math.round(sumMacros(entries).calories)
}

export function countMenuMealStatuses(
  meal: EatWellMenuMeal | null,
  dayLog: EatWellMenuDayLog | null,
  slot: MealSlot,
) {
  if (!meal) {
    return { consumed: 0, skipped: 0, total: 0 }
  }

  let consumed = 0
  let skipped = 0

  for (const entry of meal.entries) {
    const status = getMenuEntryStatus(dayLog, slot, entry.id)
    if (status === 'consumed') consumed += 1
    if (status === 'skipped') skipped += 1
  }

  return { consumed, skipped, total: meal.entries.length }
}

export type MenuDayCompletionStatus = 'none' | 'partial' | 'complete'

export function getSuggestedMenuMeals(menu: EatWellSavedMenu): EatWellMenuMeal[] {
  return MENU_DETAIL_SLOTS.map((slot) => getMenuMealForSlot(menu, slot)).filter(
    (meal): meal is EatWellMenuMeal => meal != null && meal.entries.length > 0,
  )
}

/** Refeição marcada = ao menos um alimento com ✓ ou ✗ */
export function isMenuMealMarked(
  meal: EatWellMenuMeal,
  dayLog: EatWellMenuDayLog | null,
): boolean {
  return meal.entries.some(
    (entry) => getMenuEntryStatus(dayLog, meal.slot, entry.id) != null,
  )
}

export function computeMenuDayCompletionStatus(
  menu: EatWellSavedMenu,
  dayLog: EatWellMenuDayLog | null,
): MenuDayCompletionStatus {
  const suggestedMeals = getSuggestedMenuMeals(menu)
  if (suggestedMeals.length === 0) return 'none'

  const markedCount = suggestedMeals.filter((meal) => isMenuMealMarked(meal, dayLog)).length

  if (markedCount === 0) return 'none'
  if (markedCount === suggestedMeals.length) return 'complete'
  return 'partial'
}
