import type { EatWellMenuObjective } from '../utils/eatWellMenuWizard'

export type EatWellTab = 'diary' | 'week' | 'menus'

export type MealSlot =
  | 'breakfast'
  | 'morning_snack'
  | 'lunch'
  | 'afternoon_snack'
  | 'dinner'
  | 'basket'
  | 'off_schedule'

export type MacroNutrients = {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
  sugarsG: number
  saturatedFatG: number
}

export type EatWellFoodUnit = 'unidade' | 'xicara' | 'colher_sopa' | 'colher_cha' | 'gramas'

export type EatWellPortionSize = 'small' | 'medium' | 'large'

export type EatWellMealFeeling = 'light' | 'ok' | 'heavy' | 'overdid'

export type EatWellMealLogFood = {
  id: string
  name: string
  quantity: number
  unit: EatWellFoodUnit
  macros: MacroNutrients
}

export type EatWellMealBeverage = {
  name: string
  ml: number
}

export type FoodEntry = {
  id: string
  name: string
  portionLabel: string
  macros: MacroNutrients
}

export type MealLog = {
  id: string
  slot: MealSlot
  loggedAt: string
  entries: FoodEntry[]
  photoUri?: string | null
  portionSize?: EatWellPortionSize
  feeling?: EatWellMealFeeling | null
  beverage?: EatWellMealBeverage | null
}

export type WaterLog = {
  id: string
  ml: number
  loggedAt: string
}

export type EatWellDailyRecord = {
  dateIso: string
  meals: MealLog[]
  waterLogs: WaterLog[]
}

export type NutritionGoals = {
  baseCalories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
  sugarsMaxG: number
  saturatedFatMaxG: number
  waterMl: number
}

export type EatWellFavorite = {
  id: string
  label: string
  slot: MealSlot
  entries: FoodEntry[]
}

export type EatWellMenuMeal = {
  slot: MealSlot
  entries: FoodEntry[]
}

export type EatWellSavedMenu = {
  id: string
  name: string
  objective: EatWellMenuObjective
  createdAt: string
  meals: EatWellMenuMeal[]
  approximateCalories: number
}

export type EatWellMenuFoodStatus = 'consumed' | 'skipped'

export type EatWellMenuDayLog = {
  menuId: string
  dateIso: string
  entryStatuses: Record<string, EatWellMenuFoodStatus>
  entryOverrides: Record<string, FoodEntry>
}

export type DailyNutritionTotals = MacroNutrients & {
  waterMl: number
}

export type BalanceScoreBreakdown = {
  score: number
  caloriesScore: number
  macroScore: number
  fiberScore: number
  sugarsScore: number
  saturatedFatScore: number
  waterScore: number
}

export type MealSlotContribution = {
  slot: MealSlot
  calories: number
  percentage: number
}

export type MacroChipId =
  | 'fiber'
  | 'sugars'
  | 'saturated_fat'
  | 'protein'
  | 'carbs'
  | 'fat'

export type RunWalkDayEnergy = {
  totalCaloriesBurned: number
  activities: Array<{
    id: string
    activityName: string
    modality: string
    estimatedCalories: number
    activeMinutes: number
    completedAt: string
    locationCity?: string | null
    locationState?: string | null
  }>
}

export type EatWellWeekChartMode = 'both' | 'calories' | 'water'

export type EatWellWeekDayStat = {
  dateIso: string
  weekdayLabel: string
  dayNumber: number
  isToday: boolean
  isFuture: boolean
  calories: number
  waterMl: number
  balanceScore: number
  proteinG: number
  adjustedCalorieTarget: number
  hasData: boolean
}

export type EatWellWeekBalanceDistribution = {
  excellent: number
  good: number
  fair: number
  low: number
}

export type EatWellWeekHighlight = {
  id: string
  title: string
  subtitle: string
  value: string
  dateIso: string
  accentColor: string
}

export type EatWellWeekMealItem = {
  dateIso: string
  weekdayLabel: string
  meal: MealLog
  calories: number
}

export type EatWellWeekSummary = {
  weekLabel: string
  totalCalories: number
  totalWaterMl: number
  avgDailyCalories: number
  avgBalanceScore: number
  caloriesDeltaPct: number | null
  waterDeltaPct: number | null
  macroTotals: MacroNutrients
  macroAverages: MacroNutrients
  dayStats: EatWellWeekDayStat[]
  balanceDistribution: EatWellWeekBalanceDistribution
  runWalkTotalBurned: number
  runWalkActiveDays: number
  highlights: EatWellWeekHighlight[]
  meals: EatWellWeekMealItem[]
}
