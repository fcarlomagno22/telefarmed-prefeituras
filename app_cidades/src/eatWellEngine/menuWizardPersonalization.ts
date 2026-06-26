import type { MealSlot } from '../types/eatWell'
import type { EatWellMenuWizardForm } from '../utils/eatWellMenuWizard'
import { parseWeightKg } from '../utils/eatWellMenuWizard'
import { normalizeEatWellText } from './normalizeText'
import { foodMatchesRequireTag } from './foodTagAlignment'
import { scoreFoodPreferenceMatch } from './resolveDietaryConstraints'
import type { EatWellCatalogItem } from './types'
import type { MealPlanArchetype } from './menuGenerationIndex'

function parseSleepHours(value: string) {
  const normalized = value.trim().replace(',', '.')
  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizedList(values: string[]) {
  return values.map((value) => normalizeEatWellText(value)).filter(Boolean)
}

/** Semente determinística a partir de todo o perfil + nonce único por geração. */
export function buildMenuGenerationSeed(form: EatWellMenuWizardForm, generationNonce: string) {
  return [
    generationNonce,
    form.menuName.trim(),
    form.objective ?? 'other',
    form.weightKg,
    form.heightMeters,
    form.activityLevel ?? 'moderate',
    form.likedFoods,
    form.avoidedFoods,
    form.diseases.join(','),
    form.otherDiseases,
    form.intolerances.join(','),
    form.otherIntolerances,
    form.dietaryPreferences.join(','),
    String(form.isPregnant),
    String(form.isLactating),
    form.medications,
    String(form.noKnownDiseases),
    String(form.noRegularMedications),
    String(form.noKnownIntolerances),
    String(form.hungerLevel),
    String(form.hasCompulsion),
    form.compulsionFrequency ?? '',
    String(form.consumesAlcohol),
    form.alcoholFrequency ?? '',
    form.alcoholQuantity,
    form.sleepHours,
    String(form.sleepQuality),
    String(form.stressLevel),
    form.stressCauses,
    form.bowelFrequency ?? '',
    form.previousDiets.join(','),
    String(form.neverTriedDiets),
    String(form.informationAccuracyConfirmed),
  ].join('|')
}

export function createMenuGenerationNonce() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/** Pontua alimento com base no perfil completo do wizard (além de gostos/evitar). */
export function scoreWizardProfileMatch(
  item: EatWellCatalogItem,
  form: EatWellMenuWizardForm,
  slot: MealSlot,
): number {
  let score = 0
  const name = normalizeEatWellText(item.name)
  const tags = item.tags
  if (form.isPregnant) {
    if (item.meal_roles.includes('lean_protein')) score += 6
    if (foodMatchesRequireTag(item, 'folate_source')) score += 5
    if (foodMatchesRequireTag(item, 'iron_source')) score += 5
    if (foodMatchesRequireTag(item, 'calcium_source')) score += 4
    if (name.includes('cru') && (item.tags.includes('fish') || item.tags.includes('egg'))) score -= 20
  }

  if (form.isLactating) {
    if (item.meal_roles.includes('hydration_item') || item.category === 'beverages') score += 6
    if (item.meal_roles.includes('lean_protein')) score += 5
    if (item.tags.includes('high_fiber')) score += 4
    if (name.includes('cerveja') || name.includes('vinho') || item.tags.includes('alcoholic')) score -= 20
  }

  const weightKg = parseWeightKg(form.weightKg) ?? 70

  if (form.hungerLevel >= 8) {
    if (item.meal_roles.some((role) => role.includes('protein'))) score += 8
    if (item.meal_roles.includes('fiber_booster')) score += 7
    if (tags.includes('high_fiber') || tags.includes('staple_food')) score += 5
    if (tags.includes('high_glycemic') || tags.includes('high_sugar') || tags.includes('sugary')) {
      score -= 10
    }
  } else if (form.hungerLevel <= 3) {
    if (item.category === 'fruits') score += 5
    if (item.meal_roles.includes('lean_protein')) score += 4
    if (name.includes('sopa') || name.includes('caldo')) score += 3
  }

  if (form.hasCompulsion) {
    if (tags.includes('high_sugar') || tags.includes('sugary')) score -= 14
    if (tags.includes('minimally_processed')) score += 6
    if (name.includes('bolo') || name.includes('biscoito') || name.includes('doce')) score -= 12
    if (form.compulsionFrequency === 'daily') score -= name.includes('acucar') ? 8 : 0
  }

  const sleepHours = parseSleepHours(form.sleepHours)
  if (form.sleepQuality <= 4 || (sleepHours != null && sleepHours < 6)) {
    if (name.includes('banana') || name.includes('iogurte') || name.includes('leite')) score += 5
    if (slot === 'dinner' && (name.includes('cafe') || name.includes('café'))) score -= 16
    if (slot === 'afternoon_snack' && name.includes('cafe')) score -= 6
  }

  if (form.stressLevel >= 7) {
    if (tags.includes('minimally_processed') || tags.includes('home_style')) score += 5
    if (tags.includes('ultra_processed')) score -= 12
    if (name.includes('vegetal') || item.meal_roles.includes('vegetable')) score += 3
  }

  const stressCauses = normalizeEatWellText(form.stressCauses)
  if (stressCauses.includes('trabalho') || stressCauses.includes('rotina')) {
    if (item.tags.includes('quick_prep') || name.includes('pratico') || name.includes('prático')) {
      score += 4
    }
  }

  if (form.consumesAlcohol) {
    if (item.meal_roles.includes('hydration_item') || item.category === 'beverages') score += 5
    if (name.includes('agua') || name.includes('água') || name.includes('chá') || name.includes('cha ')) {
      score += 4
    }
    if (form.alcoholFrequency === 'daily' && slot === 'breakfast') {
      if (name.includes('grelhad') || name.includes('ovo')) score += 3
    }
  }

  if (form.bowelFrequency === 'irregular' || form.bowelFrequency === 'weekly') {
    if (item.meal_roles.includes('fiber_booster')) score += 8
    if (tags.includes('high_fiber')) score += 6
    if (item.meal_roles.includes('legume') || name.includes('feijao') || name.includes('feijão')) {
      score += 5
    }
    if (name.includes('aveia') || name.includes('fruta') || item.category === 'fruits') score += 4
  } else if (form.bowelFrequency === 'twice_thrice_weekly') {
    if (item.meal_roles.includes('fiber_booster')) score += 4
  }

  const previousDiets = normalizedList(form.previousDiets)
  if (previousDiets.some((diet) => diet.includes('low') && diet.includes('carb'))) {
    if (item.meal_roles.includes('non_starchy_vegetable')) score += 5
    if (name.includes('pao') || name.includes('pão') || name.includes('arroz')) score -= 2
  }
  if (previousDiets.some((diet) => diet.includes('cetogen') || diet.includes('keto'))) {
    if (item.meal_roles.some((role) => role.includes('protein'))) score += 4
    if (name.includes('batata') || name.includes('cuscuz')) score -= 3
  }
  if (form.neverTriedDiets && previousDiets.length === 0) {
    if (tags.includes('staple_food') || tags.includes('home_style')) score += 3
  }

  const medications = normalizeEatWellText(form.medications)
  if (medications.includes('metformina') || form.objective === 'diabetes') {
    if (tags.includes('high_glycemic') || tags.includes('high_sugar')) score -= 10
    if (item.meal_roles.includes('low_glycemic_fruit')) score += 6
  }
  if (
    medications.includes('losartana') ||
    medications.includes('enalapril') ||
    form.objective === 'hypertension'
  ) {
    if (tags.includes('high_sodium')) score -= 10
    if (name.includes('sem sal') || item.meal_roles.includes('low_sodium_flavor')) score += 4
  }
  if (medications.includes('levotiroxina')) {
    if (name.includes('couve') || name.includes('espinafre') || name.includes('brocolis')) score += 2
  }

  if (weightKg >= 95 && form.objective === 'weight_loss') {
    if (item.meal_roles.includes('lean_protein')) score += 4
    if (name.includes('frit') || name.includes('empanad')) score -= 8
  }

  if (form.activityLevel === 'very_intense' || form.activityLevel === 'intense') {
    if (item.meal_roles.includes('training_carbohydrate')) score += slot === 'lunch' ? 5 : 3
    if (item.meal_roles.includes('lean_protein')) score += 4
  } else if (form.activityLevel === 'sedentary') {
    if (tags.includes('high_sugar') && slot !== 'morning_snack') score -= 4
    if (item.meal_roles.includes('non_starchy_vegetable')) score += 3
  }

  return score
}

export function scoreArchetypePersonalization(
  archetype: MealPlanArchetype,
  form: EatWellMenuWizardForm,
  slot: MealSlot,
  foods: EatWellCatalogItem[],
) {
  let score = 0

  for (const food of foods) {
    score += scoreFoodPreferenceMatch(food, form.likedFoods, form.avoidedFoods)
    score += scoreWizardProfileMatch(food, form, slot)
  }

  score += scoreFoodPreferenceMatch(
    { name: archetype.label, aliases: [], keywords: [] },
    form.likedFoods,
    form.avoidedFoods,
  )

  return score / Math.max(foods.length, 1)
}

type RankedCandidate<T> = {
  item: T
  score: number
}

/** Escolhe entre os melhores candidatos com peso decrescente (mais variável que sempre pegar o 1º). */
export function pickWeightedRankedCandidate<T>(
  ranked: RankedCandidate<T>[],
  rng: () => number,
  topN = 12,
) {
  const pool = ranked.slice(0, Math.max(1, topN))
  if (pool.length === 0) return null
  if (pool.length === 1) return pool[0] ?? null

  const weights = pool.map((_, index) => Math.pow(0.68, index))
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
  let cursor = rng() * totalWeight

  for (let index = 0; index < pool.length; index += 1) {
    cursor -= weights[index] ?? 0
    if (cursor <= 0) return pool[index] ?? null
  }

  return pool[pool.length - 1] ?? null
}
