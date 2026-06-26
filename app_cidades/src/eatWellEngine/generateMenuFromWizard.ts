import { isOpenAiMenuGenerationEnabled } from '../config/openai'
import { generateMenuWithOpenAI } from './generateMenuWithOpenAI'
import { eatWellContent } from './content/loadEatWellContent'
import { computeMenuCalorieTarget } from './computeNutritionGoals'
import {
  catalogEntryToFoodEntry,
  getEatWellCatalogEntry,
  resolveDefaultPortion,
} from './foodCatalog'
import { adaptCatalogEntryForMenuGeneration } from './adaptCatalogEntryForMenu'
import {
  ensureMenuGenerationIndex,
  ensureMenuGenerationIndexSync,
  getArchetypesForSlotObjective,
  getCandidatesForRole,
  getMenuGenerationIndex,
  getRoleFilter,
  isMenuGenerationIndexReady,
  MENU_GENERATION_SLOTS,
} from './menuGenerationIndex'
import { refineGeneratedMenu } from './menuPostGenerationRefinement'
import {
  scheduleAfterInteractions,
  yieldToUi,
} from './menuGenerationScheduler'
import {
  createMenuDayConstraintTracker,
  foodMatchesConstraints,
  resolveDietaryConstraints,
  scoreConstraintAlignment,
  scoreFoodPreferenceMatch,
} from './resolveDietaryConstraints'
import type { MenuDayConstraintTracker } from './menuDayConstraintTracker'
import type { EatWellCatalogItem } from './types'
import type { EatWellMenuMeal, EatWellSavedMenu, FoodEntry, MealSlot } from '../types/eatWell'
import type { EatWellMenuObjective, EatWellMenuWizardForm } from '../utils/eatWellMenuWizard'
import { sumMacros } from '../utils/eatWellNutritionStats'
import { isPracticalEverydayFood, isRelaxedEverydayFood, scoreEverydayFood } from './scoreEverydayFood'
import {
  buildMenuGenerationSeed,
  createMenuGenerationNonce,
  pickWeightedRankedCandidate,
  scoreArchetypePersonalization,
  scoreWizardProfileMatch,
} from './menuWizardPersonalization'
import {
  getFoodFamilyKey,
  isCompatibleWithDayMenu,
  isCompatibleWithMealSoFar,
  isFoodAllowedInSlot,
  isHeavyStarchFood,
  isLightSnackCarb,
  resolvePracticalCompositionTemplate,
  validateMealComposition,
  type CompositionTemplate,
} from './menuMealCompositionRules'

const ALGORITHMIC_SLOT_ATTEMPTS = 12
const ARCHETYPE_CANDIDATE_POOL = 8
const CANDIDATE_PICK_POOL_SIZE = 10
const SCORE_RANDOM_SPREAD = 10

type MenuBuildMode = 'strict' | 'relaxed' | 'guarantee'

type MenuBuildOptions = {
  mode: MenuBuildMode
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

  const slotTemplates = eatWellContent.mealCompositionTemplates.slots as Record<
    string,
    { templates: Record<string, CompositionTemplate> }
  >
  const base =
    slotTemplates[slot]?.templates?.[objective] ?? slotTemplates[slot]?.templates?.other

  return resolvePracticalCompositionTemplate(base, slot)
}

function scoreCandidate(
  item: EatWellCatalogItem,
  role: string,
  slot: MealSlot,
  targetCalories: number,
  form: EatWellMenuWizardForm,
  constraints: ReturnType<typeof resolveDietaryConstraints>,
  rng: () => number,
  usedDayFamilyKeys?: Set<string>,
) {
  const catalogEntry = getEatWellCatalogEntry(item.id)
  const portion = catalogEntry ? resolveDefaultPortion(catalogEntry) : null
  if (!portion) return -Infinity

  const calorieDistance = Math.abs(portion.macros.calories - targetCalories)
  const preferenceScore = scoreFoodPreferenceMatch(item, form.likedFoods, form.avoidedFoods)
  const penaltyScore = scoreConstraintAlignment(item, constraints)
  const slotBonus = item.suitable_slots.includes(slot) ? 8 : item.suitable_slots.length === 0 ? 2 : -24
  const roleBonus = getRoleFilter(role).meal_roles?.some((value) => item.meal_roles.includes(value))
    ? 10
    : 0
  const everydayScore = scoreEverydayFood(item, slot)
  const profileScore = scoreWizardProfileMatch(item, form, slot)
  const dayFamilyPenalty =
    usedDayFamilyKeys && !isCompatibleWithDayMenu(item, usedDayFamilyKeys) ? -40 : 0

  return (
    preferenceScore +
    penaltyScore +
    slotBonus +
    roleBonus +
    everydayScore +
    profileScore +
    dayFamilyPenalty -
    calorieDistance * 0.08 +
    rng() * SCORE_RANDOM_SPREAD
  )
}

function foodPassesMenuFilters(
  food: EatWellCatalogItem,
  slot: MealSlot,
  constraints: ReturnType<typeof resolveDietaryConstraints>,
  mealFamilyKeys?: Set<string>,
  usedDayFamilyKeys?: Set<string>,
  options: MenuBuildOptions = { mode: 'strict' },
  dayTracker?: MenuDayConstraintTracker,
) {
  if (!foodMatchesConstraints(food, constraints, dayTracker)) return false

  const everydayOk =
    options.mode === 'guarantee'
      ? scoreEverydayFood(food, slot) > -Infinity
      : options.mode === 'relaxed'
        ? isRelaxedEverydayFood(food, slot)
        : isPracticalEverydayFood(food, slot)
  if (!everydayOk) return false

  if (!isFoodAllowedInSlot(food, slot)) return false
  if (food.suitable_slots.length > 0 && !food.suitable_slots.includes(slot)) return false
  if (mealFamilyKeys && !isCompatibleWithMealSoFar(food, slot, mealFamilyKeys)) return false
  if (usedDayFamilyKeys && !isCompatibleWithDayMenu(food, usedDayFamilyKeys)) return false
  if (
    (slot === 'morning_snack' || slot === 'afternoon_snack') &&
    isHeavyStarchFood(food) &&
    !isLightSnackCarb(food)
  ) {
    return false
  }
  return true
}

function tryBuildSlotFromArchetype(
  slot: MealSlot,
  objective: EatWellMenuObjective,
  template: { min_items: number; max_items: number },
  form: EatWellMenuWizardForm,
  constraints: ReturnType<typeof resolveDietaryConstraints>,
  usedFoodIds: Set<string>,
  usedDayFamilyKeys: Set<string>,
  rng: () => number,
  options: MenuBuildOptions = { mode: 'relaxed' },
  dayTracker?: MenuDayConstraintTracker,
): FoodEntry[] | null {
  const archetypes = getArchetypesForSlotObjective(slot, objective)
  if (archetypes.length === 0) return null

  const minItems = options.mode === 'guarantee' ? 1 : Math.min(template.min_items, 2)
  const viableArchetypes: Array<{
    archetype: (typeof archetypes)[number]
    entries: FoodEntry[]
    score: number
  }> = []

  for (const archetype of archetypes) {
    const pickedIds: string[] = []
    const mealFamilyKeys = new Set<string>()
    const dayFamiliesSoFar = new Set(usedDayFamilyKeys)
    let valid = true

    for (const foodId of archetype.food_ids) {
      if (usedFoodIds.has(foodId)) {
        valid = false
        break
      }

      const catalogEntry = getEatWellCatalogEntry(foodId)
      const menuItem = catalogEntry ? adaptCatalogEntryForMenuGeneration(catalogEntry) : null
      if (
        !menuItem ||
        !foodPassesMenuFilters(
          menuItem,
          slot,
          constraints,
          mealFamilyKeys,
          dayFamiliesSoFar,
          options,
          dayTracker,
        )
      ) {
        valid = false
        break
      }

      pickedIds.push(foodId)
      const familyKey = getFoodFamilyKey(menuItem)
      mealFamilyKeys.add(familyKey)
      dayFamiliesSoFar.add(familyKey)
    }

    if (!valid || pickedIds.length < minItems) continue

    const foods = pickedIds
      .map((foodId) => {
        const catalogEntry = getEatWellCatalogEntry(foodId)
        return catalogEntry ? adaptCatalogEntryForMenuGeneration(catalogEntry) : null
      })
      .filter((food): food is EatWellCatalogItem => Boolean(food))

    if (
      !validateMealComposition(foods, slot, template, {
        strict: options.mode === 'strict',
      })
    ) {
      continue
    }

    const entries: FoodEntry[] = []
    for (const foodId of pickedIds) {
      const catalogEntry = getEatWellCatalogEntry(foodId)
      if (!catalogEntry) {
        valid = false
        break
      }

      const entry = catalogEntryToFoodEntry(catalogEntry, `${slot}-${foodId}-arch`)
      if (!entry) {
        valid = false
        break
      }

      entries.push(entry)
    }

    if (!valid || entries.length < minItems) continue

    viableArchetypes.push({
      archetype,
      entries,
      score:
        scoreArchetypePersonalization(archetype, form, slot, foods) +
        scoreFoodPreferenceMatch(
          { name: archetype.label, aliases: [], keywords: [] },
          form.likedFoods,
          form.avoidedFoods,
        ) +
        rng() * 6,
    })
  }

  if (viableArchetypes.length === 0) return null

  viableArchetypes.sort((left, right) => right.score - left.score)
  const picked = pickWeightedRankedCandidate(
    viableArchetypes.map((entry) => ({ item: entry, score: entry.score })),
    rng,
    ARCHETYPE_CANDIDATE_POOL,
  )
  if (!picked) return null

  return picked.item.entries.slice(0, template.max_items)
}

function pickFoodForRoleSpec(
  roleSpec: { role: string; count: number; calorie_share: number; optional?: boolean },
  slot: MealSlot,
  slotCalories: number,
  form: EatWellMenuWizardForm,
  constraints: ReturnType<typeof resolveDietaryConstraints>,
  usedFoodIds: Set<string>,
  mealFamilyKeys: Set<string>,
  usedDayFamilyKeys: Set<string>,
  rng: () => number,
  options: MenuBuildOptions = { mode: 'strict' },
  dayTracker?: MenuDayConstraintTracker,
) {
  const targetRoleCalories = Math.max(
    40,
    Math.round((slotCalories * roleSpec.calorie_share) / Math.max(roleSpec.count, 1)),
  )

  const entries: FoodEntry[] = []

  for (let index = 0; index < roleSpec.count; index += 1) {
    const candidates = getCandidatesForRole(slot, roleSpec.role, usedFoodIds, (item) =>
      foodPassesMenuFilters(
        item,
        slot,
        constraints,
        mealFamilyKeys,
        usedDayFamilyKeys,
        options,
        dayTracker,
      ),
    )

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
          usedDayFamilyKeys,
        ),
      }))
      .filter((entry) => Number.isFinite(entry.score))
      .sort((left, right) => right.score - left.score)

    const pick = pickWeightedRankedCandidate(ranked, rng, CANDIDATE_PICK_POOL_SIZE)
    if (!pick) break

    const catalogEntry = getEatWellCatalogEntry(pick.item.id)
    if (!catalogEntry) continue

    const entry = catalogEntryToFoodEntry(
      catalogEntry,
      `${slot}-${pick.item.id}-${index}`,
    )
    if (!entry) continue
    entries.push(entry)
    usedFoodIds.add(pick.item.id)
    const familyKey = getFoodFamilyKey(pick.item)
    mealFamilyKeys.add(familyKey)
    usedDayFamilyKeys.add(familyKey)
  }

  return entries
}

function foodIdFromSlotEntry(entry: FoodEntry, slot: MealSlot) {
  const prefix = `${slot}-`
  const raw = entry.id.startsWith(prefix) ? entry.id.slice(prefix.length) : entry.id
  return raw.replace(/-(?:\d+|arch|boost|req|macro-p|macro-f|fb-\d+)$/, '')
}

function foodsFromSlotEntries(entries: FoodEntry[], slot: MealSlot) {
  return entries
    .map((entry) => {
      const catalogEntry = getEatWellCatalogEntry(foodIdFromSlotEntry(entry, slot))
      return catalogEntry ? adaptCatalogEntryForMenuGeneration(catalogEntry) : null
    })
    .filter((food): food is EatWellCatalogItem => Boolean(food))
}

function commitSlotEntries(
  entries: FoodEntry[],
  slot: MealSlot,
  usedFoodIds: Set<string>,
  usedDayFamilyKeys: Set<string>,
  dayTracker?: MenuDayConstraintTracker,
) {
  for (const entry of entries) {
    const foodId = foodIdFromSlotEntry(entry, slot)
    usedFoodIds.add(foodId)
    const food = foodsFromSlotEntries([entry], slot)[0]
    if (food) {
      usedDayFamilyKeys.add(getFoodFamilyKey(food))
      dayTracker?.recordFood(food)
    }
  }
}

function buildAlgorithmicSlotEntries(
  template: CompositionTemplate,
  slot: MealSlot,
  slotCalories: number,
  form: EatWellMenuWizardForm,
  constraints: ReturnType<typeof resolveDietaryConstraints>,
  usedFoodIds: Set<string>,
  usedDayFamilyKeys: Set<string>,
  rng: () => number,
  options: MenuBuildOptions = { mode: 'strict' },
  dayTracker?: MenuDayConstraintTracker,
) {
  const attempts = options.mode === 'guarantee' ? 4 : ALGORITHMIC_SLOT_ATTEMPTS
  const strictValidation = options.mode === 'strict'

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const localUsedIds = new Set(usedFoodIds)
    const localDayFamilies = new Set(usedDayFamilyKeys)
    const mealFamilyKeys = new Set<string>()
    const entries: FoodEntry[] = []

    const roles =
      options.mode === 'guarantee'
        ? template.required_roles.filter((role) => !role.optional).slice(0, 3)
        : template.required_roles

    for (const roleSpec of roles.length > 0 ? roles : template.required_roles.slice(0, 2)) {
      entries.push(
        ...pickFoodForRoleSpec(
          roleSpec,
          slot,
          slotCalories,
          form,
          constraints,
          localUsedIds,
          mealFamilyKeys,
          localDayFamilies,
          rng,
          options,
          dayTracker,
        ),
      )
    }

    const foods = foodsFromSlotEntries(entries, slot)
    if (foods.length === 0) continue

    if (
      !validateMealComposition(foods, slot, template, {
        strict: strictValidation,
      })
    ) {
      continue
    }

    commitSlotEntries(entries, slot, usedFoodIds, usedDayFamilyKeys, dayTracker)
    return entries.slice(0, template.max_items)
  }

  return []
}

async function buildAlgorithmicSlotEntriesAsync(
  template: CompositionTemplate,
  slot: MealSlot,
  slotCalories: number,
  form: EatWellMenuWizardForm,
  constraints: ReturnType<typeof resolveDietaryConstraints>,
  usedFoodIds: Set<string>,
  usedDayFamilyKeys: Set<string>,
  rng: () => number,
  options: MenuBuildOptions = { mode: 'strict' },
  onAttempt?: () => void,
  dayTracker?: MenuDayConstraintTracker,
) {
  const attempts = options.mode === 'guarantee' ? 4 : ALGORITHMIC_SLOT_ATTEMPTS
  const strictValidation = options.mode === 'strict'

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const localUsedIds = new Set(usedFoodIds)
    const localDayFamilies = new Set(usedDayFamilyKeys)
    const mealFamilyKeys = new Set<string>()
    const entries: FoodEntry[] = []

    const roles =
      options.mode === 'guarantee'
        ? template.required_roles.filter((role) => !role.optional).slice(0, 3)
        : template.required_roles

    for (const roleSpec of roles.length > 0 ? roles : template.required_roles.slice(0, 2)) {
      entries.push(
        ...pickFoodForRoleSpec(
          roleSpec,
          slot,
          slotCalories,
          form,
          constraints,
          localUsedIds,
          mealFamilyKeys,
          localDayFamilies,
          rng,
          options,
          dayTracker,
        ),
      )
      if (attempt === 0) await yieldToUi()
    }

    const foods = foodsFromSlotEntries(entries, slot)
    if (foods.length === 0) {
      onAttempt?.()
      await yieldToUi()
      continue
    }

    if (
      !validateMealComposition(foods, slot, template, {
        strict: strictValidation,
      })
    ) {
      onAttempt?.()
      await yieldToUi()
      continue
    }

    commitSlotEntries(entries, slot, usedFoodIds, usedDayFamilyKeys, dayTracker)
    return entries.slice(0, template.max_items)
  }

  return []
}

function buildGuaranteedSlotEntries(
  template: CompositionTemplate,
  slot: MealSlot,
  slotCalories: number,
  form: EatWellMenuWizardForm,
  constraints: ReturnType<typeof resolveDietaryConstraints>,
  usedFoodIds: Set<string>,
  usedDayFamilyKeys: Set<string>,
  rng: () => number,
  dayTracker?: MenuDayConstraintTracker,
) {
  const algorithmic = buildAlgorithmicSlotEntries(
    template,
    slot,
    slotCalories,
    form,
    constraints,
    usedFoodIds,
    usedDayFamilyKeys,
    rng,
    { mode: 'guarantee' },
    dayTracker,
  )
  if (algorithmic.length > 0) return algorithmic

  const index = getMenuGenerationIndex()
  const fallbackPool = [...index.everydayPool]
    .sort(() => rng() - 0.5)
    .slice(0, 80)

  const localUsedIds = new Set(usedFoodIds)
  const mealFamilyKeys = new Set<string>()
  const dayFamiliesSoFar = new Set(usedDayFamilyKeys)
  const entries: FoodEntry[] = []

  for (const item of fallbackPool) {
    if (entries.length >= Math.max(1, Math.min(template.max_items, 3))) break
    if (
      !foodPassesMenuFilters(
        item,
        slot,
        constraints,
        mealFamilyKeys,
        dayFamiliesSoFar,
        { mode: 'guarantee' },
        dayTracker,
      )
    ) {
      continue
    }

    const catalogEntry = getEatWellCatalogEntry(item.id)
    if (!catalogEntry) continue

    const entry = catalogEntryToFoodEntry(catalogEntry, `${slot}-${item.id}-fb-${entries.length}`)
    if (!entry) continue

    entries.push(entry)
    localUsedIds.add(item.id)
    const familyKey = getFoodFamilyKey(item)
    mealFamilyKeys.add(familyKey)
    dayFamiliesSoFar.add(familyKey)
  }

  if (entries.length === 0) return []

  commitSlotEntries(entries, slot, usedFoodIds, usedDayFamilyKeys, dayTracker)
  return entries
}

function resolveSlotEntries(
  template: CompositionTemplate,
  slot: MealSlot,
  slotCalories: number,
  form: EatWellMenuWizardForm,
  objective: EatWellMenuObjective,
  constraints: ReturnType<typeof resolveDietaryConstraints>,
  usedFoodIds: Set<string>,
  usedDayFamilyKeys: Set<string>,
  rng: () => number,
  dayTracker?: MenuDayConstraintTracker,
) {
  const strictEntries = buildAlgorithmicSlotEntries(
    template,
    slot,
    slotCalories,
    form,
    constraints,
    usedFoodIds,
    usedDayFamilyKeys,
    rng,
    { mode: 'strict' },
    dayTracker,
  )
  if (strictEntries.length >= template.min_items) return strictEntries

  const archetypeEntries = tryBuildSlotFromArchetype(
    slot,
    objective,
    template,
    form,
    constraints,
    usedFoodIds,
    usedDayFamilyKeys,
    rng,
    { mode: 'relaxed' },
    dayTracker,
  )
  if (archetypeEntries && archetypeEntries.length >= Math.min(template.min_items, 2)) {
    commitSlotEntries(archetypeEntries, slot, usedFoodIds, usedDayFamilyKeys, dayTracker)
    return archetypeEntries
  }

  const relaxedEntries = buildAlgorithmicSlotEntries(
    template,
    slot,
    slotCalories,
    form,
    constraints,
    usedFoodIds,
    usedDayFamilyKeys,
    rng,
    { mode: 'relaxed' },
    dayTracker,
  )
  if (relaxedEntries.length >= Math.min(template.min_items, 2)) return relaxedEntries

  const guaranteedEntries = buildGuaranteedSlotEntries(
    template,
    slot,
    slotCalories,
    form,
    constraints,
    usedFoodIds,
    usedDayFamilyKeys,
    rng,
    dayTracker,
  )
  if (guaranteedEntries.length > 0) return guaranteedEntries

  if (archetypeEntries && archetypeEntries.length > 0) {
    commitSlotEntries(archetypeEntries, slot, usedFoodIds, usedDayFamilyKeys, dayTracker)
    return archetypeEntries
  }

  return strictEntries.length > 0 ? strictEntries : relaxedEntries
}

async function resolveSlotEntriesAsync(
  template: CompositionTemplate,
  slot: MealSlot,
  slotCalories: number,
  form: EatWellMenuWizardForm,
  objective: EatWellMenuObjective,
  constraints: ReturnType<typeof resolveDietaryConstraints>,
  usedFoodIds: Set<string>,
  usedDayFamilyKeys: Set<string>,
  rng: () => number,
  onAttempt?: () => void,
  dayTracker?: MenuDayConstraintTracker,
) {
  const strictEntries = await buildAlgorithmicSlotEntriesAsync(
    template,
    slot,
    slotCalories,
    form,
    constraints,
    usedFoodIds,
    usedDayFamilyKeys,
    rng,
    { mode: 'strict' },
    onAttempt,
    dayTracker,
  )
  if (strictEntries.length >= template.min_items) return strictEntries

  await yieldToUi()
  const archetypeEntries = tryBuildSlotFromArchetype(
    slot,
    objective,
    template,
    form,
    constraints,
    usedFoodIds,
    usedDayFamilyKeys,
    rng,
    { mode: 'relaxed' },
    dayTracker,
  )
  if (archetypeEntries && archetypeEntries.length >= Math.min(template.min_items, 2)) {
    commitSlotEntries(archetypeEntries, slot, usedFoodIds, usedDayFamilyKeys, dayTracker)
    return archetypeEntries
  }

  await yieldToUi()
  const relaxedEntries = await buildAlgorithmicSlotEntriesAsync(
    template,
    slot,
    slotCalories,
    form,
    constraints,
    usedFoodIds,
    usedDayFamilyKeys,
    rng,
    { mode: 'relaxed' },
    onAttempt,
    dayTracker,
  )
  if (relaxedEntries.length >= Math.min(template.min_items, 2)) return relaxedEntries

  await yieldToUi()
  const guaranteedEntries = buildGuaranteedSlotEntries(
    template,
    slot,
    slotCalories,
    form,
    constraints,
    usedFoodIds,
    usedDayFamilyKeys,
    rng,
    dayTracker,
  )
  if (guaranteedEntries.length > 0) return guaranteedEntries

  if (archetypeEntries && archetypeEntries.length > 0) {
    commitSlotEntries(archetypeEntries, slot, usedFoodIds, usedDayFamilyKeys, dayTracker)
    return archetypeEntries
  }

  return strictEntries.length > 0 ? strictEntries : relaxedEntries
}

function createGenerationRng(form: EatWellMenuWizardForm) {
  const generationNonce = createMenuGenerationNonce()
  const seed = hashSeed(buildMenuGenerationSeed(form, generationNonce))
  return createRng(seed)
}

function countGenerationSteps(objective: EatWellMenuObjective) {
  let steps = 1

  for (const slot of MENU_GENERATION_SLOTS) {
    const template = getCompositionTemplate(objective, slot)
    steps += 2
    steps += ALGORITHMIC_SLOT_ATTEMPTS
    steps += template?.required_roles.length ?? 0
  }

  return steps
}

async function buildMenuFromWizard(
  form: EatWellMenuWizardForm,
  onProgress?: (progress: number) => void,
): Promise<EatWellSavedMenu> {
  const objective = form.objective ?? 'other'
  const totalSteps = countGenerationSteps(objective)
  let completedSteps = 0

  const tick = () => {
    completedSteps += 1
    onProgress?.(Math.min(99, Math.round((completedSteps / totalSteps) * 100)))
  }

  const id = `menu-${Date.now()}`
  const name = form.menuName.trim() || 'Meu cardápio'
  const createdAt = new Date().toISOString()
  const rng = createGenerationRng(form)
  const usedFoodIds = new Set<string>()
  const usedDayFamilyKeys = new Set<string>()
  const meals: EatWellMenuMeal[] = []
  const constraints = resolveDietaryConstraints(form)
  const dayTracker = createMenuDayConstraintTracker(constraints)

  tick()
  await yieldToUi()

  for (const slot of MENU_GENERATION_SLOTS) {
    await yieldToUi()
    const template = getCompositionTemplate(objective, slot)
    if (!template) continue

    const dailyCalories = computeMenuCalorieTarget(form)
    const slotCalories = Math.max(80, Math.round(dailyCalories * getSlotCalorieShare(objective, slot)))

    const entries = await resolveSlotEntriesAsync(
      template,
      slot,
      slotCalories,
      form,
      objective,
      constraints,
      usedFoodIds,
      usedDayFamilyKeys,
      rng,
      tick,
      dayTracker,
    )
    tick()

    if (entries.length > 0) {
      meals.push({ slot, entries })
    }
  }

  const refinedMeals = refineGeneratedMenu(meals, form, constraints, dayTracker, rng)
  const allEntries = refinedMeals.flatMap((meal) => meal.entries)
  onProgress?.(100)

  return {
    id,
    name,
    objective,
    createdAt,
    meals: refinedMeals,
    approximateCalories: Math.round(sumMacros(allEntries).calories),
  }
}

export async function generateEatWellMenuFromWizardAsync(
  form: EatWellMenuWizardForm,
  onProgress?: (progress: number) => void,
): Promise<EatWellSavedMenu> {
  const report = (value: number) => onProgress?.(value)

  if (isOpenAiMenuGenerationEnabled()) {
    report(2)
    return generateMenuWithOpenAI(form, report)
  }

  if (!isMenuGenerationIndexReady()) {
    report(1)
    await ensureMenuGenerationIndex((indexProgress) => {
      report(Math.max(1, Math.round(indexProgress * 0.12)))
    })
  }

  report(isMenuGenerationIndexReady() ? 8 : 12)

  return scheduleAfterInteractions(async () => {
    return buildMenuFromWizard(form, (menuProgress) => {
      const base = isMenuGenerationIndexReady() ? 12 : 15
      report(Math.min(99, base + Math.round(menuProgress * ((100 - base) / 100))))
    })
  })
}

export function generateEatWellMenuFromWizard(form: EatWellMenuWizardForm): EatWellSavedMenu {
  ensureMenuGenerationIndexSync()

  const objective = form.objective ?? 'other'
  const id = `menu-${Date.now()}`
  const name = form.menuName.trim() || 'Meu cardápio'
  const createdAt = new Date().toISOString()
  const rng = createGenerationRng(form)
  const usedFoodIds = new Set<string>()
  const usedDayFamilyKeys = new Set<string>()
  const meals: EatWellMenuMeal[] = []
  const constraints = resolveDietaryConstraints(form)
  const dayTracker = createMenuDayConstraintTracker(constraints)

  for (const slot of MENU_GENERATION_SLOTS) {
    const template = getCompositionTemplate(objective, slot)
    if (!template) continue

    const dailyCalories = computeMenuCalorieTarget(form)
    const slotCalories = Math.max(80, Math.round(dailyCalories * getSlotCalorieShare(objective, slot)))

    const entries = resolveSlotEntries(
      template,
      slot,
      slotCalories,
      form,
      objective,
      constraints,
      usedFoodIds,
      usedDayFamilyKeys,
      rng,
      dayTracker,
    )

    if (entries.length > 0) {
      meals.push({ slot, entries })
    }
  }

  const refinedMeals = refineGeneratedMenu(meals, form, constraints, dayTracker, rng)
  const allEntries = refinedMeals.flatMap((meal) => meal.entries)

  return {
    id,
    name,
    objective,
    createdAt,
    meals: refinedMeals,
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
    isPregnant: false,
    isLactating: false,
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
