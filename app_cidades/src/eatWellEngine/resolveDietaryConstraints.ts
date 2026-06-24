import { eatWellContent } from './content/loadEatWellContent'
import { normalizeEatWellText } from './normalizeText'
import type { EatWellMenuWizardForm } from '../utils/eatWellMenuWizard'

export type ResolvedDietaryConstraints = {
  excludeTags: Set<string>
  penalizeTags: Set<string>
  requireTags: Set<string>
}

const WIZARD_VALUE_ALIASES: Record<string, string> = {
  diabetes: 'diabetes',
  hipertensao: 'hypertension',
  pressao_alta: 'hypertension',
  colesterol: 'high_cholesterol',
  colesterol_alto: 'high_cholesterol',
  lactose: 'lactose',
  gluten: 'gluten',
  frutose: 'fructose',
  vegetariano: 'vegetarian',
  vegetariana: 'vegetarian',
  vegano: 'vegan',
  vegana: 'vegan',
  'low carb': 'low_carb',
  'sem acucar': 'no_added_sugar',
  'sem açúcar': 'no_added_sugar',
  'sem gluten': 'gluten_free',
  'sem glúten': 'gluten_free',
  'sem lactose': 'lactose_free',
}

const DIRECT_TAG_RULES: Record<string, { exclude?: string[]; require?: string[] }> = {
  vegetarian: { exclude: ['contains_meat'] },
  vegan: { exclude: ['contains_meat', 'contains_lactose', 'egg', 'dairy'] },
  lactose: { exclude: ['contains_lactose'] },
  gluten: { exclude: ['contains_gluten'] },
  'sem lactose': { exclude: ['contains_lactose'] },
  'sem glúten': { exclude: ['contains_gluten'] },
  'sem gluten': { exclude: ['contains_gluten'] },
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

function findConstraintRule(
  bucket: Record<string, { exclude_tags?: string[]; require_tags?: string[]; penalize_tags?: string[] }>,
  normalizedValue: string,
) {
  if (bucket[normalizedValue]) return bucket[normalizedValue]

  for (const [key, rule] of Object.entries(bucket)) {
    const ruleRecord = rule as { wizard_values?: string[] }
    if (ruleRecord.wizard_values?.some((value) => normalizeWizardValue(value) === normalizedValue)) {
      return rule
    }
  }

  return null
}

export function resolveDietaryConstraints(form: EatWellMenuWizardForm): ResolvedDietaryConstraints {
  const excludeTags = new Set<string>()
  const penalizeTags = new Set<string>()
  const requireTags = new Set<string>()
  const constraints = eatWellContent.dietaryConstraints.constraints as Record<
    string,
    Record<string, { exclude_tags?: string[]; require_tags?: string[]; penalize_tags?: string[] }>
  >

  mergeConstraintBucket(excludeTags, eatWellContent.dietaryConstraints.global_defaults.exclude_tags)
  mergeConstraintBucket(penalizeTags, eatWellContent.dietaryConstraints.global_defaults.penalize_tags)
  mergeConstraintBucket(requireTags, eatWellContent.dietaryConstraints.global_defaults.require_tags)

  const allValues = [
    ...form.diseases,
    ...form.intolerances,
    ...form.dietaryPreferences,
    form.otherDiseases,
    form.otherIntolerances,
  ]
    .map((value) => value.trim())
    .filter(Boolean)

  for (const rawValue of allValues) {
    const normalized = normalizeWizardValue(rawValue)
    const direct = DIRECT_TAG_RULES[normalized] ?? DIRECT_TAG_RULES[rawValue.trim().toLowerCase()]
    if (direct?.exclude) mergeConstraintBucket(excludeTags, direct.exclude)
    if (direct?.require) mergeConstraintBucket(requireTags, direct.require)

    for (const bucketName of ['diseases', 'intolerances', 'dietaryPreferences'] as const) {
      const rule = findConstraintRule(constraints[bucketName] ?? {}, normalized)
      if (!rule) continue
      mergeConstraintBucket(excludeTags, rule.exclude_tags)
      mergeConstraintBucket(penalizeTags, rule.penalize_tags)
      mergeConstraintBucket(requireTags, rule.require_tags)
    }
  }

  if (form.objective === 'diabetes') {
    mergeConstraintBucket(penalizeTags, ['high_glycemic', 'high_sugar', 'sugary'])
  }
  if (form.objective === 'hypertension') {
    mergeConstraintBucket(penalizeTags, ['high_sodium'])
  }

  for (const required of [...requireTags]) {
    if (excludeTags.has(required)) requireTags.delete(required)
  }

  return { excludeTags, penalizeTags, requireTags }
}

export function foodMatchesConstraints(
  tags: string[],
  constraints: ResolvedDietaryConstraints,
) {
  if (tags.some((tag) => constraints.excludeTags.has(tag))) return false
  return true
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
