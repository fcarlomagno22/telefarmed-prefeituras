import type { MealSlot } from '../types/eatWell'
import type { EatWellBeverageItem, EatWellCatalogEntry, EatWellCatalogItem } from './types'

const BEVERAGE_SUITABLE_SLOTS: MealSlot[] = [
  'breakfast',
  'morning_snack',
  'afternoon_snack',
  'lunch',
  'dinner',
  'basket',
]

function beverageTagsToList(tags: EatWellBeverageItem['tags']) {
  const list: string[] = []
  if (tags.alcoholic) list.push('alcoholic')
  if (tags.caffeinated) list.push('caffeinated')
  if (tags.sugary) list.push('sugary')
  if (tags.zero_calorie) list.push('zero_calorie')
  if (!tags.sugary && !tags.zero_calorie) list.push('low_sugar')
  return list
}

/** Normaliza alimento ou bebida do catálogo para o motor de cardápio. */
export function adaptCatalogEntryForMenuGeneration(entry: EatWellCatalogEntry): EatWellCatalogItem | null {
  if (entry.kind === 'food' && entry.food) return entry.food

  if (entry.kind === 'beverage' && entry.beverage) {
    const beverage = entry.beverage
    const macros = beverage.macros_per_100ml

    return {
      id: beverage.id,
      name: beverage.name,
      aliases: beverage.aliases,
      category: 'beverages',
      meal_roles: ['beverage'],
      suitable_slots: BEVERAGE_SUITABLE_SLOTS,
      tags: beverageTagsToList(beverage.tags),
      macros_per_100g: {
        calories: macros.calories,
        proteinG: macros.proteinG,
        carbsG: macros.carbsG,
        fatG: macros.fatG,
        fiberG: macros.fiberG,
        sugarsG: macros.sugarsG,
        saturatedFatG: macros.saturatedFatG,
      },
      default_portion: {
        amount: 200,
        unit: 'ml',
        grams_equivalent: 200,
        label: '200 ml',
      },
    }
  }

  return null
}
