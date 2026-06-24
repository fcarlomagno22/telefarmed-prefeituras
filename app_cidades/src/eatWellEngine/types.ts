import type { EatWellFoodUnit, MacroNutrients, MealSlot } from '../types/eatWell'

export type EatWellCatalogMacros = MacroNutrients

export type EatWellCatalogPortion = {
  amount: number
  unit: string
  grams_equivalent: number
  label: string
  macros?: EatWellCatalogMacros
}

export type EatWellCatalogItem = {
  id: string
  name: string
  aliases?: string[]
  keywords?: string[]
  category: string
  subcategory?: string
  meal_roles: string[]
  suitable_slots: MealSlot[]
  tags: string[]
  macros_per_100g: EatWellCatalogMacros
  default_portion: EatWellCatalogPortion
  portions?: EatWellCatalogPortion[]
  source?: string
  confidence?: string
}

export type EatWellBeverageItem = {
  id: string
  name: string
  aliases?: string[]
  macros_per_100ml: EatWellCatalogMacros
  tags: {
    alcoholic?: boolean
    caffeinated?: boolean
    sugary?: boolean
    zero_calorie?: boolean
  }
  category?: string
}

export type EatWellCatalogEntry = {
  id: string
  name: string
  kind: 'food' | 'beverage'
  food?: EatWellCatalogItem
  beverage?: EatWellBeverageItem
}

export type EatWellSearchResult = EatWellCatalogEntry & {
  score: number
}

export type EatWellResolvedPortion = {
  portionLabel: string
  macros: EatWellCatalogMacros
  gramsEquivalent: number
}

export const EAT_WELL_FOOD_UNIT_MAP: Record<string, EatWellFoodUnit> = {
  gramas: 'gramas',
  g: 'gramas',
  unidade: 'unidade',
  xicara: 'xicara',
  colher_sopa: 'colher_sopa',
  colher_cha: 'colher_cha',
}
