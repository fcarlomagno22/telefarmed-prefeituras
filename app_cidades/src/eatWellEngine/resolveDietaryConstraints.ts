import { eatWellContent } from './content/loadEatWellContent'
import {
  foodMatchesPenalizeTag,
  foodMatchesRequireTag,
  foodViolatesExcludeTag,
} from './foodTagAlignment'
import type { MenuDayConstraintTracker } from './menuDayConstraintTracker'
import { MenuDayConstraintTracker as MenuDayConstraintTrackerClass } from './menuDayConstraintTracker'
import { normalizeEatWellText } from './normalizeText'
import type { EatWellCatalogItem } from './types'
import type { EatWellMenuWizardForm } from '../utils/eatWellMenuWizard'

export type ResolvedDietaryConstraints = {
  excludeTags: Set<string>
  penalizeTags: Set<string>
  requireTags: Set<string>
  maxPerDay: Record<string, number>
}

type ConstraintBucketName = 'diseases' | 'intolerances' | 'dietaryPreferences'

type ConstraintRule = {
  exclude_tags?: string[]
  require_tags?: string[]
  penalize_tags?: string[]
  max_per_day?: Record<string, number | null>
  wizard_values?: string[]
}

const WIZARD_VALUE_ALIASES: Record<string, string> = {
  diabetes: 'diabetes',
  hipertensao: 'hypertension',
  pressao_alta: 'hypertension',
  colesterol: 'high_cholesterol',
  colesterol_alto: 'high_cholesterol',
  tireoide: 'thyroid',
  gastrite: 'gastritis',
  intestino_irritavel: 'irritable_bowel',
  colon_irritavel: 'irritable_bowel',
  anemia: 'anemia',
  osteoporose: 'osteoporosis',
  lactose: 'lactose',
  gluten: 'gluten',
  frutose: 'fructose_intolerance',
  sacarose: 'sucrose_intolerance',
  ovos: 'egg_allergy',
  ovo: 'egg_allergy',
  soja: 'soy_allergy',
  amendoim: 'peanut_allergy',
  frutos_do_mar: 'seafood_allergy',
  vegetariano: 'vegetarian',
  vegetariana: 'vegetarian',
  vegano: 'vegan',
  vegana: 'vegan',
  'low carb': 'low_carb',
  'sem acucar': 'no_added_sugar',
  'sem açúcar': 'no_added_sugar',
  'sem gluten': 'gluten_free_preference',
  'sem glúten': 'gluten_free_preference',
  'sem lactose': 'lactose_free_preference',
}

const WIZARD_CONSTRAINT_ROUTES: Record<string, { bucket: ConstraintBucketName; key: string }> = {
  diabetes: { bucket: 'diseases', key: 'diabetes' },
  hypertension: { bucket: 'diseases', key: 'hypertension' },
  high_cholesterol: { bucket: 'diseases', key: 'high_cholesterol' },
  thyroid: { bucket: 'diseases', key: 'thyroid' },
  gastritis: { bucket: 'diseases', key: 'gastritis' },
  irritable_bowel: { bucket: 'diseases', key: 'irritable_bowel' },
  anemia: { bucket: 'diseases', key: 'anemia' },
  osteoporosis: { bucket: 'diseases', key: 'osteoporosis' },
  pregnancy: { bucket: 'diseases', key: 'pregnancy' },
  lactation: { bucket: 'diseases', key: 'lactation' },
  lactose: { bucket: 'intolerances', key: 'lactose_free' },
  gluten: { bucket: 'intolerances', key: 'gluten_free' },
  fructose_intolerance: { bucket: 'intolerances', key: 'fructose_intolerance' },
  sucrose_intolerance: { bucket: 'intolerances', key: 'sucrose_intolerance' },
  egg_allergy: { bucket: 'intolerances', key: 'egg_allergy' },
  soy_allergy: { bucket: 'intolerances', key: 'soy_allergy' },
  peanut_allergy: { bucket: 'intolerances', key: 'peanut_allergy' },
  seafood_allergy: { bucket: 'intolerances', key: 'seafood_allergy' },
  vegetarian: { bucket: 'dietaryPreferences', key: 'vegetarian' },
  vegan: { bucket: 'dietaryPreferences', key: 'vegan' },
  low_carb: { bucket: 'dietaryPreferences', key: 'low_carb' },
  no_added_sugar: { bucket: 'dietaryPreferences', key: 'no_added_sugar' },
  gluten_free_preference: { bucket: 'dietaryPreferences', key: 'gluten_free_preference' },
  lactose_free_preference: { bucket: 'dietaryPreferences', key: 'lactose_free_preference' },
}

const DIRECT_TAG_RULES: Record<string, { exclude?: string[]; require?: string[]; penalize?: string[] }> = {
  vegetarian: { exclude: ['meat', 'beef', 'poultry', 'pork', 'fish', 'seafood', 'processed_meat'] },
  vegan: {
    exclude: ['animal_product', 'meat', 'contains_meat', 'contains_lactose', 'egg', 'dairy', 'honey'],
  },
  lactose: { exclude: ['lactose', 'regular_milk', 'contains_lactose'] },
  gluten: { exclude: ['gluten', 'wheat', 'contains_gluten'] },
  'sem lactose': { exclude: ['lactose', 'regular_milk', 'contains_lactose'] },
  'sem glúten': { exclude: ['gluten', 'wheat', 'contains_gluten'] },
  'sem gluten': { exclude: ['gluten', 'wheat', 'contains_gluten'] },
}

function normalizeWizardValue(value: string) {
  const normalized = normalizeEatWellText(value)
  return WIZARD_VALUE_ALIASES[normalized] ?? normalized.replace(/\s+/g, '_')
}

function mergeConstraintBucket(
  target: Set<string>,
  values: string[] | undefined,
  strategy: 'union' | 'intersect' = 'union',
) {
  if (!values?.length) return
  if (strategy === 'union') {
    values.forEach((value) => target.add(value))
    return
  }
  if (target.size === 0) {
    values.forEach((value) => target.add(value))
    return
  }
  const next = new Set(values)
  for (const value of [...target]) {
    if (!next.has(value)) target.delete(value)
  }
}

function mergeMaxPerDay(
  target: Record<string, number>,
  values: Record<string, number | null> | undefined,
) {
  if (!values) return

  for (const [tag, limit] of Object.entries(values)) {
    if (limit == null) continue
    const current = target[tag]
    if (current === undefined) {
      target[tag] = limit
      continue
    }
    if (limit === 0 || current === 0) {
      target[tag] = 0
      continue
    }
    target[tag] = Math.min(current, limit)
  }
}

function applyConstraintRule(
  rule: ConstraintRule,
  excludeTags: Set<string>,
  penalizeTags: Set<string>,
  requireTags: Set<string>,
  maxPerDay: Record<string, number>,
) {
  mergeConstraintBucket(excludeTags, rule.exclude_tags)
  mergeConstraintBucket(penalizeTags, rule.penalize_tags)
  mergeConstraintBucket(requireTags, rule.require_tags)
  mergeMaxPerDay(maxPerDay, rule.max_per_day)
}

function findConstraintRule(
  bucket: Record<string, ConstraintRule>,
  normalizedValue: string,
) {
  if (bucket[normalizedValue]) return bucket[normalizedValue]

  for (const rule of Object.values(bucket)) {
    if (rule.wizard_values?.some((value) => normalizeWizardValue(value) === normalizedValue)) {
      return rule
    }
  }

  return null
}

function applyWizardSelection(
  normalized: string,
  constraints: Record<ConstraintBucketName, Record<string, ConstraintRule>>,
  excludeTags: Set<string>,
  penalizeTags: Set<string>,
  requireTags: Set<string>,
  maxPerDay: Record<string, number>,
) {
  const route = WIZARD_CONSTRAINT_ROUTES[normalized]
  if (route) {
    const rule = constraints[route.bucket]?.[route.key]
    if (rule) {
      applyConstraintRule(rule, excludeTags, penalizeTags, requireTags, maxPerDay)
      return
    }
  }

  for (const bucketName of ['diseases', 'intolerances', 'dietaryPreferences'] as const) {
    const rule = findConstraintRule(constraints[bucketName] ?? {}, normalized)
    if (!rule) continue
    applyConstraintRule(rule, excludeTags, penalizeTags, requireTags, maxPerDay)
  }
}

export function resolveDietaryConstraints(form: EatWellMenuWizardForm): ResolvedDietaryConstraints {
  const excludeTags = new Set<string>()
  const penalizeTags = new Set<string>()
  const requireTags = new Set<string>()
  const maxPerDay: Record<string, number> = {}
  const constraints = eatWellContent.dietaryConstraints.constraints as Record<
    ConstraintBucketName,
    Record<string, ConstraintRule>
  >

  mergeConstraintBucket(excludeTags, eatWellContent.dietaryConstraints.global_defaults.exclude_tags)
  mergeConstraintBucket(penalizeTags, eatWellContent.dietaryConstraints.global_defaults.penalize_tags)
  mergeConstraintBucket(requireTags, eatWellContent.dietaryConstraints.global_defaults.require_tags)
  mergeMaxPerDay(maxPerDay, eatWellContent.dietaryConstraints.global_defaults.max_per_day)

  const allValues = [
    ...form.diseases,
    ...form.intolerances,
    ...form.dietaryPreferences,
    form.otherDiseases,
    form.otherIntolerances,
  ]
    .flatMap((value) => value.split(/[,;\n]+/))
    .map((value) => value.trim())
    .filter(Boolean)

  for (const rawValue of allValues) {
    const normalized = normalizeWizardValue(rawValue)
    const direct = DIRECT_TAG_RULES[normalized] ?? DIRECT_TAG_RULES[rawValue.trim().toLowerCase()]
    if (direct?.exclude) mergeConstraintBucket(excludeTags, direct.exclude)
    if (direct?.require) mergeConstraintBucket(requireTags, direct.require)
    if (direct?.penalize) mergeConstraintBucket(penalizeTags, direct.penalize)

    applyWizardSelection(normalized, constraints, excludeTags, penalizeTags, requireTags, maxPerDay)
  }

  if (form.isPregnant) {
    applyWizardSelection('pregnancy', constraints, excludeTags, penalizeTags, requireTags, maxPerDay)
  }
  if (form.isLactating) {
    applyWizardSelection('lactation', constraints, excludeTags, penalizeTags, requireTags, maxPerDay)
  }

  if (form.objective === 'diabetes') {
    mergeConstraintBucket(penalizeTags, ['high_glycemic', 'high_sugar', 'sugary', 'refined_carbohydrate'])
    mergeMaxPerDay(maxPerDay, { dessert: 0, fruit_juice: 0, sugary_drink: 0 })
  }
  if (form.objective === 'hypertension') {
    mergeConstraintBucket(penalizeTags, ['high_sodium', 'processed_meat'])
    mergeMaxPerDay(maxPerDay, { high_sodium: 1, processed_meat: 0 })
  }

  for (const required of [...requireTags]) {
    if (excludeTags.has(required)) requireTags.delete(required)
  }
  for (const penalized of [...penalizeTags]) {
    if (excludeTags.has(penalized)) penalizeTags.delete(penalized)
  }

  return { excludeTags, penalizeTags, requireTags, maxPerDay }
}

export function foodMatchesConstraints(
  item: EatWellCatalogItem,
  constraints: ResolvedDietaryConstraints,
  tracker?: MenuDayConstraintTracker,
) {
  for (const excludeTag of constraints.excludeTags) {
    if (foodViolatesExcludeTag(item, excludeTag)) return false
  }

  if (tracker && !tracker.canAddFood(item)) return false
  return true
}

export function scoreConstraintAlignment(
  item: EatWellCatalogItem,
  constraints: ResolvedDietaryConstraints,
) {
  let score = 0

  for (const tag of constraints.penalizeTags) {
    if (foodMatchesPenalizeTag(item, tag)) score -= 8
  }
  for (const tag of constraints.requireTags) {
    if (foodMatchesRequireTag(item, tag)) score += 6
  }

  return score
}

export function scoreFoodPreferenceMatch(
  food: { name: string; aliases?: string[]; keywords?: string[] },
  likedFoods: string,
  avoidedFoods: string,
) {
  const liked = likedFoods
    .split(/[,;\n]+/)
    .map((value) => normalizeEatWellText(value))
    .filter(Boolean)
  const avoided = avoidedFoods
    .split(/[,;\n]+/)
    .map((value) => normalizeEatWellText(value))
    .filter(Boolean)

  const haystack = normalizeEatWellText(
    [food.name, ...(food.aliases ?? []), ...(food.keywords ?? [])].join(' '),
  )

  let score = 0
  for (const term of liked) {
    if (haystack.includes(term)) score += 12
  }
  for (const term of avoided) {
    if (haystack.includes(term)) score -= 40
  }
  return score
}

export function createMenuDayConstraintTracker(constraints: ResolvedDietaryConstraints) {
  return new MenuDayConstraintTrackerClass(constraints.maxPerDay)
}
