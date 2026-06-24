import { eatWellContent } from './content/loadEatWellContent'
import { computeMenuCalorieTarget } from './computeNutritionGoals'
import {
  catalogEntryToFoodEntry,
  getEatWellCatalogEntry,
  getEatWellCatalogIndex,
  resolveDefaultPortion,
} from './foodCatalog'
import {
  foodMatchesConstraints,
  resolveDietaryConstraints,
  scoreFoodPreferenceMatch,
} from './resolveDietaryConstraints'
import type { EatWellCatalogItem } from './types'
import type { EatWellMenuMeal, EatWellSavedMenu, FoodEntry, MealSlot } from '../types/eatWell'
import type { EatWellMenuObjective, EatWellMenuWizardForm } from '../utils/eatWellMenuWizard'
import { sumMacros } from '../utils/eatWellNutritionStats'
import { normalizeEatWellText } from './normalizeText'

const MENU_SLOTS: MealSlot[] = [
  'breakfast',
  'morning_snack',
  'lunch',
  'afternoon_snack',
  'dinner',
  'basket',
]

type RoleFilter = {
  meal_roles?: string[]
  tags_any?: string[]
  categories?: string[]
  name_keywords_any?: string[]
  suitable_slots?: MealSlot[]
}

function hashSeed(input: string) {
  let hash = 2166136261
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function createRng(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

function getSlotCalorieShare(objective: EatWellMenuObjective, slot: MealSlot) {
  const distribution =
    eatWellContent.menuGenerationRules.calorie_distribution_by_slot.by_objective?.[
      objective
    ] ??
    eatWellContent.menuGenerationRules.calorie_distribution_by_slot.default
  return (distribution[slot as keyof typeof distribution] ?? 0) / 100
}

function getCompositionTemplate(objective: EatWellMenuObjective, slot: MealSlot) {
  type CompositionRole = {
    role: string
    count: number
    calorie_share: number
    optional?: boolean
  }
  type CompositionTemplate = {
    min_items: number
    max_items: number
    required_roles: CompositionRole[]
  }

  const slotTemplates = eatWellContent.mealCompositionTemplates.slots as Record<
    string,
    { templates: Record<string, CompositionTemplate> }
  >
  return slotTemplates[slot]?.templates?.[objective] ?? slotTemplates[slot]?.templates?.other
}

function getRoleFilter(role: string): RoleFilter {
  const roles = eatWellContent.mealRoleMapping.roles as Record<string, RoleFilter>
  return roles[role] ?? { meal_roles: ['snack'] }
}

function itemMatchesRoleFilter(item: EatWellCatalogItem, filter: RoleFilter, slot: MealSlot) {
  if (filter.suitable_slots?.length && !filter.suitable_slots.includes(slot)) return false
  if (filter.meal_roles?.length && !filter.meal_roles.some((role) => item.meal_roles.includes(role))) {
    return false
  }
  if (filter.categories?.length && !filter.categories.includes(item.category)) return false
  if (filter.tags_any?.length && !filter.tags_any.some((tag) => item.tags.includes(tag))) {
    const normalizedName = normalizeEatWellText(item.name)
    const keywordMatch = filter.name_keywords_any?.some((keyword) =>
      normalizedName.includes(normalizeEatWellText(keyword)),
    )
    if (!keywordMatch) return false
  } else if (filter.name_keywords_any?.length) {
    const normalizedName = normalizeEatWellText(item.name)
    if (!filter.name_keywords_any.some((keyword) => normalizedName.includes(normalizeEatWellText(keyword)))) {
      return false
    }
  }
  return true
}

function scoreCandidate(
  item: EatWellCatalogItem,
  role: string,
  slot: MealSlot,
  targetCalories: number,
  form: EatWellMenuWizardForm,
  constraints: ReturnType<typeof resolveDietaryConstraints>,
  rng: () => number,
) {
  const portion = resolveDefaultPortion({ id: item.id, name: item.name, kind: 'food', food: item })
  if (!portion) return -Infinity

  const calorieDistance = Math.abs(portion.macros.calories - targetCalories)
  const preferenceScore = scoreFoodPreferenceMatch(item, form.likedFoods, form.avoidedFoods)
  const penaltyScore = item.tags.reduce(
    (sum, tag) => sum + (constraints.penalizeTags.has(tag) ? -8 : 0),
    0,
  )
  const slotBonus = item.suitable_slots.includes(slot) ? 8 : 0
  const roleBonus = getRoleFilter(role).meal_roles?.some((value) => item.meal_roles.includes(value))
    ? 10
    : 0

  return (
    preferenceScore +
    penaltyScore +
    slotBonus +
    roleBonus -
    calorieDistance * 0.08 +
    rng() * 4
  )
}

function pickFoodsForSlot(
  form: EatWellMenuWizardForm,
  objective: EatWellMenuObjective,
  slot: MealSlot,
  usedFoodIds: Set<string>,
  rng: () => number,
) {
  const constraints = resolveDietaryConstraints(form)
  const template = getCompositionTemplate(objective, slot)
  const dailyCalories = computeMenuCalorieTarget(form)
  const slotCalories = Math.max(80, Math.round(dailyCalories * getSlotCalorieShare(objective, slot)))
  const entries: FoodEntry[] = []

  if (!template) return entries

  for (const roleSpec of template.required_roles) {
    const filter = getRoleFilter(roleSpec.role)
    const targetRoleCalories = Math.max(
      40,
      Math.round((slotCalories * roleSpec.calorie_share) / Math.max(roleSpec.count, 1)),
    )

    const candidates = getEatWellCatalogIndex().foods.filter((item) => {
      if (usedFoodIds.has(item.id)) return false
      if (!foodMatchesConstraints(item.tags, constraints)) return false
      return itemMatchesRoleFilter(item, filter, slot)
    })

    const ranked = candidates
      .map((item) => ({
        item,
        score: scoreCandidate(
          item,
          roleSpec.role,
          slot,
          targetRoleCalories,
          form,
          constraints,
          rng,
        ),
      }))
      .filter((entry) => Number.isFinite(entry.score))
      .sort((left, right) => right.score - left.score)

    for (let index = 0; index < roleSpec.count; index += 1) {
      const pick = ranked[index]
      if (!pick) break
      const entry = catalogEntryToFoodEntry(
        { id: pick.item.id, name: pick.item.name, kind: 'food', food: pick.item },
        `${slot}-${pick.item.id}-${index}`,
      )
      if (!entry) continue
      entries.push(entry)
      usedFoodIds.add(pick.item.id)
    }
  }

  if (entries.length >= template.min_items) return entries.slice(0, template.max_items)

  const fallbackArchetype = (
    eatWellContent.mealPlanArchetypes.archetypes as Array<{
      slot: MealSlot
      objective: EatWellMenuObjective
      food_ids: string[]
    }>
  ).find((archetype) => archetype.slot === slot && archetype.objective === objective)

  if (fallbackArchetype) {
    for (const foodId of fallbackArchetype.food_ids) {
      if (entries.length >= template.max_items) break
      if (usedFoodIds.has(foodId)) continue
      const catalogEntry = getEatWellCatalogEntry(foodId)
      if (!catalogEntry) continue
      const tags =
        catalogEntry.kind === 'food'
          ? (catalogEntry.food?.tags ?? [])
          : []
      if (!foodMatchesConstraints(tags, constraints)) continue
      const entry = catalogEntryToFoodEntry(catalogEntry, `${slot}-${foodId}-arch`)
      if (!entry) continue
      entries.push(entry)
      usedFoodIds.add(foodId)
    }
  }

  return entries.slice(0, template.max_items)
}

export function generateEatWellMenuFromWizard(form: EatWellMenuWizardForm): EatWellSavedMenu {
  const id = `menu-${Date.now()}`
  const objective = form.objective ?? 'other'
  const name = form.menuName.trim() || 'Meu cardápio'
  const createdAt = new Date().toISOString()
  const seed = hashSeed(
    [
      name,
      objective,
      form.weightKg,
      form.heightMeters,
      form.activityLevel,
      form.likedFoods,
      form.avoidedFoods,
      form.diseases.join(','),
      form.intolerances.join(','),
      form.dietaryPreferences.join(','),
    ].join('|'),
  )
  const rng = createRng(seed)
  const usedFoodIds = new Set<string>()
  const meals: EatWellMenuMeal[] = []

  for (const slot of MENU_SLOTS) {
    const entries = pickFoodsForSlot(form, objective, slot, usedFoodIds, rng)
    if (entries.length > 0) meals.push({ slot, entries })
  }

  const allEntries = meals.flatMap((meal) => meal.entries)

  return {
    id,
    name,
    objective,
    createdAt,
    meals,
    approximateCalories: Math.round(sumMacros(allEntries).calories),
  }
}

export function createDemoEatWellMenu(objective: EatWellMenuObjective = 'weight_loss'): EatWellSavedMenu {
  return generateEatWellMenuFromWizard({
    menuName: 'Semana equilibrada',
    heightMeters: '1,70',
    weightKg: '72,0',
    objective,
    activityLevel: 'moderate',
    diseases: [],
    otherDiseases: '',
    noKnownDiseases: true,
    medications: '',
    noRegularMedications: true,
    intolerances: [],
    otherIntolerances: '',
    noKnownIntolerances: true,
    dietaryPreferences: [],
    likedFoods: 'frango, arroz, feijão, salada',
    avoidedFoods: '',
    hungerLevel: 5,
    hasCompulsion: false,
    compulsionFrequency: null,
    consumesAlcohol: false,
    alcoholFrequency: null,
    alcoholQuantity: '',
    sleepHours: '7',
    sleepQuality: 6,
    stressLevel: 4,
    stressCauses: '',
    bowelFrequency: 'daily',
    previousDiets: [],
    neverTriedDiets: true,
    informationAccuracyConfirmed: true,
  })
}
