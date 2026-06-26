import { computeNutritionGoalsFromWizard } from './computeNutritionGoals'
import {
  catalogEntryToFoodEntry,
  getEatWellCatalogEntry,
} from './foodCatalog'
import { adaptCatalogEntryForMenuGeneration } from './adaptCatalogEntryForMenu'
import { foodMatchesRequireTag } from './foodTagAlignment'
import {
  getMenuGenerationIndex,
  getCandidatesForRole,
  MENU_GENERATION_SLOTS,
} from './menuGenerationIndex'
import type { MenuDayConstraintTracker } from './menuDayConstraintTracker'
import { MenuDayConstraintTracker as MenuDayConstraintTrackerClass } from './menuDayConstraintTracker'
import {
  collectMealFamilyKeys,
  getFoodFamilyKey,
  isCompatibleWithDayMenu,
  isCompatibleWithMealSoFar,
  isDayRepeatableFamily,
  isFoodAllowedInSlot,
  validateMealFoodSet,
} from './menuMealCompositionRules'
import type { ResolvedDietaryConstraints } from './resolveDietaryConstraints'
import { foodMatchesConstraints, scoreConstraintAlignment, scoreFoodPreferenceMatch } from './resolveDietaryConstraints'
import { scoreEverydayFood } from './scoreEverydayFood'
import type { EatWellCatalogItem } from './types'
import type { EatWellMenuMeal, FoodEntry, MealSlot, NutritionGoals } from '../types/eatWell'
import type { EatWellMenuWizardForm } from '../utils/eatWellMenuWizard'
import { sumMacros } from '../utils/eatWellNutritionStats'

const MAX_SLOT_ITEMS = 6
const MACRO_PROTEIN_MIN_RATIO = 0.85
const MACRO_FIBER_MIN_RATIO = 0.85
const MACRO_SUGARS_MAX_RATIO = 1.05
const MACRO_SAT_FAT_MAX_RATIO = 1.05

const SKIP_REQUIRE_TAGS = new Set([
  'professional_review_required',
  'professional_review_recommended',
  'safe_food_handling',
  'b12_attention',
  'iodine_aware',
])

const REQUIRE_TAG_SLOT_ROLES: Record<string, Array<{ slot: MealSlot; role: string }>> = {
  iron_source: [
    { slot: 'lunch', role: 'legume' },
    { slot: 'lunch', role: 'lean_protein' },
    { slot: 'dinner', role: 'legume' },
  ],
  legume: [
    { slot: 'lunch', role: 'legume' },
    { slot: 'dinner', role: 'legume' },
  ],
  high_fiber: [
    { slot: 'lunch', role: 'legume' },
    { slot: 'lunch', role: 'fiber_booster' },
    { slot: 'afternoon_snack', role: 'fiber_booster' },
  ],
  soluble_fiber: [{ slot: 'breakfast', role: 'fiber_booster' }],
  folate_source: [
    { slot: 'lunch', role: 'vegetable' },
    { slot: 'breakfast', role: 'fruit' },
    { slot: 'lunch', role: 'legume' },
  ],
  calcium_source: [
    { slot: 'breakfast', role: 'dairy_or_alternative' },
    { slot: 'lunch', role: 'dairy_or_alternative' },
  ],
  lean_protein: [
    { slot: 'lunch', role: 'lean_protein' },
    { slot: 'dinner', role: 'lean_protein' },
    { slot: 'breakfast', role: 'lean_protein' },
  ],
  protein_source: [
    { slot: 'lunch', role: 'protein' },
    { slot: 'dinner', role: 'protein' },
  ],
  fruit: [
    { slot: 'breakfast', role: 'fruit' },
    { slot: 'morning_snack', role: 'fruit' },
  ],
  vegetable: [
    { slot: 'lunch', role: 'vegetable' },
    { slot: 'dinner', role: 'vegetable' },
  ],
  non_starchy_vegetable: [
    { slot: 'lunch', role: 'non_starchy_vegetable' },
    { slot: 'dinner', role: 'non_starchy_vegetable' },
  ],
  whole_grain: [{ slot: 'breakfast', role: 'whole_grain' }],
  whole_grain_or_legume: [
    { slot: 'lunch', role: 'legume' },
    { slot: 'breakfast', role: 'whole_grain' },
  ],
  potassium_source: [
    { slot: 'morning_snack', role: 'fruit' },
    { slot: 'lunch', role: 'vegetable' },
  ],
  low_sodium: [{ slot: 'lunch', role: 'low_sodium_flavor' }],
  plant_protein: [
    { slot: 'lunch', role: 'plant_protein' },
    { slot: 'lunch', role: 'legume' },
  ],
  iron_source_plant: [{ slot: 'lunch', role: 'legume' }],
  minimally_processed: [{ slot: 'lunch', role: 'vegetable' }],
  whole_food: [{ slot: 'breakfast', role: 'fruit' }],
  hydration_item: [{ slot: 'breakfast', role: 'beverage_unsweetened' }],
  low_fodmap_option: [{ slot: 'lunch', role: 'lean_protein' }],
  naturally_gluten_free: [{ slot: 'breakfast', role: 'fruit' }],
  lactose_free: [{ slot: 'breakfast', role: 'lactose_free_dairy_or_alternative' }],
}

type RefinementContext = {
  form: EatWellMenuWizardForm
  constraints: ResolvedDietaryConstraints
  dayTracker: MenuDayConstraintTracker
  usedFoodIds: Set<string>
  usedDayFamilyKeys: Set<string>
  rng: () => number
}

function foodIdFromEntry(entry: FoodEntry, slot: MealSlot) {
  const prefix = `${slot}-`
  const raw = entry.id.startsWith(prefix) ? entry.id.slice(prefix.length) : entry.id
  return raw.replace(/-(?:\d+|arch|boost|req|macro)$/, '')
}

function collectMenuFoods(meals: EatWellMenuMeal[]) {
  const foods: EatWellCatalogItem[] = []

  for (const meal of meals) {
    for (const entry of meal.entries) {
      const catalogEntry = getEatWellCatalogEntry(foodIdFromEntry(entry, meal.slot))
      const item = catalogEntry ? adaptCatalogEntryForMenuGeneration(catalogEntry) : null
      if (item) foods.push(item)
    }
  }

  return foods
}

function rebuildTrackerState(
  meals: EatWellMenuMeal[],
  constraints: ResolvedDietaryConstraints,
) {
  const tracker = new MenuDayConstraintTrackerClass(constraints.maxPerDay)
  for (const food of collectMenuFoods(meals)) {
    tracker.recordFood(food)
  }
  return tracker
}

function seedUsedSets(meals: EatWellMenuMeal[]) {
  const usedFoodIds = new Set<string>()
  const usedDayFamilyKeys = new Set<string>()

  for (const meal of meals) {
    for (const entry of meal.entries) {
      const foodId = foodIdFromEntry(entry, meal.slot)
      usedFoodIds.add(foodId)
      const catalogEntry = getEatWellCatalogEntry(foodId)
      const item = catalogEntry ? adaptCatalogEntryForMenuGeneration(catalogEntry) : null
      if (item) usedDayFamilyKeys.add(getFoodFamilyKey(item))
    }
  }

  return { usedFoodIds, usedDayFamilyKeys }
}

function findMealIndex(meals: EatWellMenuMeal[], slot: MealSlot) {
  return meals.findIndex((meal) => meal.slot === slot)
}

function scoreRefinementCandidate(
  item: EatWellCatalogItem,
  slot: MealSlot,
  ctx: RefinementContext,
  requireTag?: string,
) {
  let score = scoreConstraintAlignment(item, ctx.constraints) + scoreEverydayFood(item, slot)
  score += scoreFoodPreferenceMatch(item, ctx.form.likedFoods, ctx.form.avoidedFoods)
  if (requireTag && foodMatchesRequireTag(item, requireTag)) score += 20
  score += ctx.rng() * 4
  return score
}

function canAddFoodToSlot(
  item: EatWellCatalogItem,
  slot: MealSlot,
  mealEntries: FoodEntry[],
  ctx: RefinementContext,
) {
  if (ctx.usedFoodIds?.has(item.id)) return false
  if (!foodMatchesConstraints(item, ctx.constraints, ctx.dayTracker)) return false
  if (!isFoodAllowedInSlot(item, slot)) return false
  if (item.suitable_slots.length > 0 && !item.suitable_slots.includes(slot)) return false
  if (!isCompatibleWithDayMenu(item, ctx.usedDayFamilyKeys)) return false

  const mealFoods = mealEntries
    .map((entry) => {
      const catalogEntry = getEatWellCatalogEntry(foodIdFromEntry(entry, slot))
      return catalogEntry ? adaptCatalogEntryForMenuGeneration(catalogEntry) : null
    })
    .filter((food): food is EatWellCatalogItem => Boolean(food))

  const familyKeys = collectMealFamilyKeys(mealFoods)
  if (!isCompatibleWithMealSoFar(item, slot, familyKeys)) return false
  if (!validateMealFoodSet([...mealFoods, item], slot)) return false

  return scoreEverydayFood(item, slot) > -Infinity
}

function appendFoodToSlot(
  meals: EatWellMenuMeal[],
  slot: MealSlot,
  item: EatWellCatalogItem,
  ctx: RefinementContext,
  suffix: string,
) {
  const mealIndex = findMealIndex(meals, slot)
  const catalogEntry = getEatWellCatalogEntry(item.id)
  if (!catalogEntry) return false

  const targetMeal =
    mealIndex >= 0
      ? meals[mealIndex]!
      : (() => {
          const created = { slot, entries: [] as FoodEntry[] }
          meals.push(created)
          return created
        })()

  if (targetMeal.entries.length >= MAX_SLOT_ITEMS) return false

  const entry = catalogEntryToFoodEntry(
    catalogEntry,
    `${slot}-${item.id}-${suffix}-${targetMeal.entries.length}`,
  )
  if (!entry) return false

  targetMeal.entries.push(entry)
  ctx.usedFoodIds.add(item.id)
  ctx.usedDayFamilyKeys.add(getFoodFamilyKey(item))
  ctx.dayTracker.recordFood(item)
  return true
}

function pickBestCandidate(
  meals: EatWellMenuMeal[],
  slot: MealSlot,
  role: string,
  ctx: RefinementContext,
  requireTag?: string,
) {
  const mealIndex = findMealIndex(meals, slot)
  const mealEntries = mealIndex >= 0 ? meals[mealIndex]!.entries : []

  const candidates = getCandidatesForRole(slot, role, ctx.usedFoodIds, (item) =>
    canAddFoodToSlot(item, slot, mealEntries, ctx),
  )

  const ranked = candidates
    .map((item) => ({
      item,
      score: scoreRefinementCandidate(item, slot, ctx, requireTag),
    }))
    .filter((entry) => Number.isFinite(entry.score))
    .sort((left, right) => right.score - left.score)

  return ranked[0]?.item ?? null
}

function fulfillMissingRequireTags(meals: EatWellMenuMeal[], ctx: RefinementContext) {
  const actionableRequireTags = [...ctx.constraints.requireTags].filter(
    (tag) => !SKIP_REQUIRE_TAGS.has(tag),
  )

  let menuFoods = collectMenuFoods(meals)
  let missing = ctx.dayTracker.getMissingRequireTags(new Set(actionableRequireTags), menuFoods)

  for (const requireTag of [...missing]) {
    const placements = REQUIRE_TAG_SLOT_ROLES[requireTag] ?? [
      { slot: 'lunch' as MealSlot, role: 'vegetable' },
      { slot: 'dinner' as MealSlot, role: 'lean_protein' },
    ]

    let added = false
    for (const { slot, role } of placements) {
      const mealEntries =
        findMealIndex(meals, slot) >= 0 ? meals[findMealIndex(meals, slot)]!.entries : []

      const candidate =
        pickBestCandidate(meals, slot, role, ctx, requireTag) ??
        getMenuGenerationIndex()
          .everydayPool.filter(
            (item) =>
              foodMatchesRequireTag(item, requireTag) &&
              canAddFoodToSlot(item, slot, mealEntries, ctx),
          )
          .sort(
            (left, right) =>
              scoreRefinementCandidate(right, slot, ctx, requireTag) -
              scoreRefinementCandidate(left, slot, ctx, requireTag),
          )[0]

      if (!candidate) continue
      if (appendFoodToSlot(meals, slot, candidate, ctx, 'req')) {
        added = true
        break
      }
    }

    if (added) {
      menuFoods = collectMenuFoods(meals)
      missing = ctx.dayTracker.getMissingRequireTags(new Set(actionableRequireTags), menuFoods)
    }
  }
}

function evaluateMacroGaps(meals: EatWellMenuMeal[], goals: NutritionGoals) {
  const totals = sumMacros(meals.flatMap((meal) => meal.entries))

  return {
    totals,
    needsProtein: totals.proteinG < goals.proteinG * MACRO_PROTEIN_MIN_RATIO,
    needsFiber: totals.fiberG < goals.fiberG * MACRO_FIBER_MIN_RATIO,
    sugarsHigh: totals.sugarsG > goals.sugarsMaxG * MACRO_SUGARS_MAX_RATIO,
    satFatHigh: totals.saturatedFatG > goals.saturatedFatMaxG * MACRO_SAT_FAT_MAX_RATIO,
  }
}

function boostMacroWithRole(
  meals: EatWellMenuMeal[],
  ctx: RefinementContext,
  placements: Array<{ slot: MealSlot; role: string }>,
  suffix: string,
) {
  for (const { slot, role } of placements) {
    const candidate = pickBestCandidate(meals, slot, role, ctx)
    if (candidate && appendFoodToSlot(meals, slot, candidate, ctx, suffix)) {
      return true
    }
  }
  return false
}

function trimHighSugarItem(meals: EatWellMenuMeal[], ctx: RefinementContext) {
  let worst: { mealIndex: number; entryIndex: number; sugarsG: number } | null = null

  meals.forEach((meal, mealIndex) => {
    meal.entries.forEach((entry, entryIndex) => {
      if (entry.macros.sugarsG <= 4) return
      if (!worst || entry.macros.sugarsG > worst.sugarsG) {
        worst = { mealIndex, entryIndex, sugarsG: entry.macros.sugarsG }
      }
    })
  })

  if (!worst) return false

  const target = worst as { mealIndex: number; entryIndex: number; sugarsG: number }
  const meal = meals[target.mealIndex]
  if (!meal) return false

  const removed = meal.entries.splice(target.entryIndex, 1)[0]
  if (!removed) return false

  const foodId = foodIdFromEntry(removed, meal.slot)
  ctx.usedFoodIds.delete(foodId)
  ctx.dayTracker = rebuildTrackerState(meals, ctx.constraints)
  return true
}

function refineMenuMacros(meals: EatWellMenuMeal[], ctx: RefinementContext, goals: NutritionGoals) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const gaps = evaluateMacroGaps(meals, goals)
    if (!gaps.needsProtein && !gaps.needsFiber && !gaps.sugarsHigh && !gaps.satFatHigh) break

    let changed = false

    if (gaps.needsProtein) {
      changed =
        boostMacroWithRole(meals, ctx, [
          { slot: 'lunch', role: 'lean_protein' },
          { slot: 'dinner', role: 'lean_protein' },
          { slot: 'afternoon_snack', role: 'lean_protein' },
        ], 'macro-p') || changed
    }

    if (gaps.needsFiber) {
      changed =
        boostMacroWithRole(meals, ctx, [
          { slot: 'lunch', role: 'legume' },
          { slot: 'lunch', role: 'fiber_booster' },
          { slot: 'afternoon_snack', role: 'fiber_booster' },
        ], 'macro-f') || changed
    }

    if (gaps.sugarsHigh) {
      changed = trimHighSugarItem(meals, ctx) || changed
    }

    if (!changed) break
  }
}

function removeDuplicateDayFamilies(meals: EatWellMenuMeal[]) {
  const seenFamilies = new Set<string>()

  for (const meal of meals) {
    const kept: FoodEntry[] = []

    for (const entry of meal.entries) {
      const catalogEntry = getEatWellCatalogEntry(foodIdFromEntry(entry, meal.slot))
      const item = catalogEntry ? adaptCatalogEntryForMenuGeneration(catalogEntry) : null
      if (!item) {
        kept.push(entry)
        continue
      }

      const familyKey = getFoodFamilyKey(item)
      if (!isDayRepeatableFamily(familyKey) && seenFamilies.has(familyKey)) {
        continue
      }

      seenFamilies.add(familyKey)
      kept.push(entry)
    }

    meal.entries = kept
  }

  return meals.filter((meal) => meal.entries.length > 0)
}

export function refineGeneratedMenu(
  meals: EatWellMenuMeal[],
  form: EatWellMenuWizardForm,
  constraints: ResolvedDietaryConstraints,
  dayTracker: MenuDayConstraintTracker,
  rng: () => number,
) {
  const orderedMeals = MENU_GENERATION_SLOTS.map((slot) => {
    const existing = meals.find((meal) => meal.slot === slot)
    return existing ?? null
  }).filter((meal): meal is EatWellMenuMeal => Boolean(meal))

  const { usedFoodIds, usedDayFamilyKeys } = seedUsedSets(orderedMeals)
  const ctx: RefinementContext = {
    form,
    constraints,
    dayTracker: rebuildTrackerState(orderedMeals, constraints),
    usedFoodIds,
    usedDayFamilyKeys,
    rng,
  }

  fulfillMissingRequireTags(orderedMeals, ctx)

  const goals = computeNutritionGoalsFromWizard(form)
  refineMenuMacros(orderedMeals, ctx, goals)

  const dedupedMeals = removeDuplicateDayFamilies(orderedMeals)
  return dedupedMeals
}
