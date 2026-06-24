import beverageCatalog from '../../../assets/foods/beverage_catalog.json'
import dietaryConstraints from '../../../assets/foods/dietary_constraints.json'
import foodDatabaseLote1 from '../../../assets/foods/food_database_lote_1_cereais_massas_paes.json'
import foodDatabaseLote2 from '../../../assets/foods/food_database_lote_2_carnes_aves_peixes_ovos.json'
import foodDatabaseLote3 from '../../../assets/foods/food_database_lote_3_leguminosas.json'
import foodDatabaseLote4 from '../../../assets/foods/food_database_lote_4_verduras_legumes.json'
import foodDatabaseLote5 from '../../../assets/foods/food_database_lote_5_frutas.json'
import foodDatabaseLote6 from '../../../assets/foods/food_database_lote_6_laticinios.json'
import foodDatabaseLote7 from '../../../assets/foods/food_database_lote_7_oleos_gorduras_castanhas.json'
import foodDatabaseLote8 from '../../../assets/foods/food_database_lote_8_pratos_preparados_br.json'
import foodDatabaseLote9 from '../../../assets/foods/food_database_lote_9_padaria_lanches_fast_food.json'
import foodDatabaseLote10 from '../../../assets/foods/food_database_lote_10_doces_snacks.json'
import foodDatabaseLote11 from '../../../assets/foods/food_database_lote_11_temperos_molhos.json'
import foodDatabaseLote12 from '../../../assets/foods/food_database_lote_12_bebidas.json'
import foodSearchSynonyms from '../../../assets/foods/food_search_synonyms.json'
import foodSubstitutionRules from '../../../assets/foods/food_substitution_rules.json'
import insightTemplates from '../../../assets/foods/insight_templates.json'
import mealCompositionTemplates from '../../../assets/foods/meal_composition_templates.json'
import mealPlanArchetypes from '../../../assets/foods/meal_plan_archetypes.json'
import mealRoleMapping from '../../../assets/foods/meal_role_mapping.json'
import menuGenerationRules from '../../../assets/foods/menu_generation_rules.json'
import nutritionCalculationRules from '../../../assets/foods/nutrition_calculation_rules.json'
import photoLabelMapping from '../../../assets/foods/photo_label_mapping.json'
import portionUnitsRegistry from '../../../assets/foods/portion_units_registry.json'
import type { EatWellBeverageItem, EatWellCatalogItem } from '../types'

export const EAT_WELL_CONTENT_VERSION = '1.0.0'

const foodDatabaseLots = [
  foodDatabaseLote1,
  foodDatabaseLote2,
  foodDatabaseLote3,
  foodDatabaseLote4,
  foodDatabaseLote5,
  foodDatabaseLote6,
  foodDatabaseLote7,
  foodDatabaseLote8,
  foodDatabaseLote9,
  foodDatabaseLote10,
  foodDatabaseLote11,
  foodDatabaseLote12,
] as const

export const eatWellContent = {
  beverageCatalog,
  dietaryConstraints,
  foodSearchSynonyms,
  foodSubstitutionRules,
  insightTemplates,
  mealCompositionTemplates,
  mealPlanArchetypes,
  mealRoleMapping,
  menuGenerationRules,
  nutritionCalculationRules,
  photoLabelMapping,
  portionUnitsRegistry,
} as const

export function getAllFoodCatalogItems(): EatWellCatalogItem[] {
  return foodDatabaseLots.flatMap((lot) => lot.items as EatWellCatalogItem[])
}

export function getAllBeverageCatalogItems(): EatWellBeverageItem[] {
  return (beverageCatalog.beverages ?? []) as EatWellBeverageItem[]
}

export type EatWellContent = typeof eatWellContent
