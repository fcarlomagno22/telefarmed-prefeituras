import { MOCK_FOOD_DATABASE } from '../data/mockEatWellFoods'
import type { EatWellMenuMeal, EatWellSavedMenu, FoodEntry, MealSlot } from '../types/eatWell'
import {
  getMenuObjectiveLabel,
  type EatWellMenuObjective,
  type EatWellMenuWizardForm,
} from './eatWellMenuWizard'
import { sumMacros } from './eatWellNutritionStats'

type MenuPlanSlot = {
  slot: MealSlot
  foodIds: string[]
}

const DEFAULT_MENU_PLAN: MenuPlanSlot[] = [
  { slot: 'breakfast', foodIds: ['food-egg', 'food-bread'] },
  { slot: 'morning_snack', foodIds: ['food-banana'] },
  { slot: 'lunch', foodIds: ['food-rice', 'food-beans', 'food-chicken', 'food-salad'] },
  { slot: 'afternoon_snack', foodIds: ['food-cheese'] },
  { slot: 'dinner', foodIds: ['food-salad', 'food-chicken', 'food-potato'] },
  { slot: 'basket', foodIds: ['food-banana', 'food-cheese'] },
]

const OBJECTIVE_MENU_PLANS: Partial<Record<EatWellMenuObjective, MenuPlanSlot[]>> = {
  weight_loss: [
    { slot: 'breakfast', foodIds: ['food-egg', 'food-banana'] },
    { slot: 'morning_snack', foodIds: ['food-banana'] },
    { slot: 'lunch', foodIds: ['food-salad', 'food-chicken', 'food-beans'] },
    { slot: 'afternoon_snack', foodIds: ['food-cheese'] },
    { slot: 'dinner', foodIds: ['food-salad', 'food-chicken'] },
    { slot: 'basket', foodIds: ['food-banana'] },
  ],
  hypertrophy: [
    { slot: 'breakfast', foodIds: ['food-egg', 'food-bread', 'food-banana'] },
    { slot: 'morning_snack', foodIds: ['food-cheese'] },
    { slot: 'lunch', foodIds: ['food-rice', 'food-beans', 'food-chicken', 'food-potato'] },
    { slot: 'afternoon_snack', foodIds: ['food-bread', 'food-cheese'] },
    { slot: 'dinner', foodIds: ['food-pasta', 'food-chicken', 'food-salad'] },
  ],
  gain_weight: [
    { slot: 'breakfast', foodIds: ['food-egg', 'food-bread', 'food-banana'] },
    { slot: 'morning_snack', foodIds: ['food-cheese'] },
    { slot: 'lunch', foodIds: ['food-rice', 'food-beans', 'food-chicken', 'food-potato'] },
    { slot: 'afternoon_snack', foodIds: ['food-bread', 'food-cheese'] },
    { slot: 'dinner', foodIds: ['food-pasta', 'food-chicken', 'food-salad'] },
  ],
}

function foodEntryFromMock(foodId: string, menuId: string, index: number): FoodEntry | null {
  const food = MOCK_FOOD_DATABASE.find((item) => item.id === foodId)
  if (!food) return null

  return {
    id: `${menuId}-${foodId}-${index}`,
    name: food.name,
    portionLabel: food.portionLabel,
    macros: { ...food.macros },
  }
}

function buildMeals(menuId: string, objective: EatWellMenuObjective): EatWellMenuMeal[] {
  const plan = OBJECTIVE_MENU_PLANS[objective] ?? DEFAULT_MENU_PLAN

  return plan
    .map((item) => {
      const entries = item.foodIds
        .map((foodId, index) => foodEntryFromMock(foodId, menuId, index))
        .filter((entry): entry is FoodEntry => entry != null)

      return { slot: item.slot, entries }
    })
    .filter((meal) => meal.entries.length > 0)
}

export function generateEatWellMenuFromWizard(form: EatWellMenuWizardForm): EatWellSavedMenu {
  const id = `menu-${Date.now()}`
  const objective = form.objective ?? 'other'
  const name = form.menuName.trim() || 'Meu cardápio'
  const createdAt = new Date().toISOString()
  const meals = buildMeals(id, objective)
  const allEntries = meals.flatMap((meal) => meal.entries)
  const approximateCalories = Math.round(sumMacros(allEntries).calories)

  return {
    id,
    name,
    objective,
    createdAt,
    meals,
    approximateCalories,
  }
}

/** Cardápio demo para Meus Cardápios — evita refazer o wizard a cada teste. */
export function createMockEatWellMenu(): EatWellSavedMenu {
  const id = 'menu-mock-semana-equilibrada'
  const objective: EatWellMenuObjective = 'weight_loss'
  const meals = buildMeals(id, objective)
  const allEntries = meals.flatMap((meal) => meal.entries)
  const createdAt = new Date()
  createdAt.setDate(createdAt.getDate() - 3)
  createdAt.setHours(10, 30, 0, 0)

  return {
    id,
    name: 'Semana equilibrada',
    objective,
    createdAt: createdAt.toISOString(),
    meals,
    approximateCalories: Math.round(sumMacros(allEntries).calories),
  }
}

export const DEFAULT_EAT_WELL_MENUS: EatWellSavedMenu[] = [createMockEatWellMenu()]

export function formatEatWellMenuCreatedAt(iso: string): string {
  const date = new Date(iso)
  const datePart = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const timePart = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return `${datePart} · ${timePart}`
}

export function formatEatWellMenuSubtitle(menu: EatWellSavedMenu): string {
  return `${getMenuObjectiveLabel(menu.objective)} · ${formatEatWellMenuCreatedAt(menu.createdAt)}`
}
