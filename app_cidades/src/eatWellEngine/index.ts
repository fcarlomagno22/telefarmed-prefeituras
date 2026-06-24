export { EAT_WELL_CONTENT_VERSION, eatWellContent } from './content/loadEatWellContent'
export { buildDailyInsight, resolvePhotoLabels } from './buildInsightFromTemplates'
export { computeMenuCalorieTarget, computeNutritionGoalsFromWizard } from './computeNutritionGoals'
export {
  catalogEntryToFoodEntry,
  getEatWellCatalogEntry,
  getEatWellCatalogIndex,
  getEatWellFoodDatabaseSize,
  resolveDefaultPortion,
  resolveEatWellFoodByName,
  searchEatWellCatalog,
} from './foodCatalog'
export {
  createDemoEatWellMenu,
  generateEatWellMenuFromWizard,
} from './generateMenuFromWizard'
export {
  delaySubstitutionLoading,
  findSimilarFoodAlternatives,
  SUBSTITUTION_LOADING_MS,
} from './findFoodSubstitutions'
export {
  foodMatchesConstraints,
  resolveDietaryConstraints,
  scoreFoodPreferenceMatch,
} from './resolveDietaryConstraints'
export { normalizeEatWellText } from './normalizeText'
export { scaleMacros, scaleMacrosFrom100g } from './scaleMacros'
export type {
  EatWellBeverageItem,
  EatWellCatalogEntry,
  EatWellCatalogItem,
  EatWellSearchResult,
} from './types'
