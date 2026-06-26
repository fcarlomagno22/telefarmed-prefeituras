import type { MealSlot } from '../types/eatWell'
import type { EatWellMenuObjective } from '../utils/eatWellMenuWizard'
import { eatWellContent } from './content/loadEatWellContent'
import { getEatWellCatalogEntry, getEatWellCatalogIndex } from './foodCatalog'
import { adaptCatalogEntryForMenuGeneration } from './adaptCatalogEntryForMenu'
import { normalizeEatWellText } from './normalizeText'
import { runInBackgroundChunks, scheduleAfterInteractions, yieldToUi } from './menuGenerationScheduler'
import { isEverydayPoolMember, isPracticalEverydayFood } from './scoreEverydayFood'
import type { EatWellCatalogItem } from './types'

export const MENU_GENERATION_SLOTS: MealSlot[] = [
  'breakfast',
  'morning_snack',
  'lunch',
  'afternoon_snack',
  'dinner',
  'basket',
]

const BEVERAGE_MENU_SLOTS: MealSlot[] = [
  'breakfast',
  'morning_snack',
  'afternoon_snack',
  'lunch',
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

export type MealPlanArchetype = {
  id: string
  label: string
  slot: MealSlot
  objective: EatWellMenuObjective
  food_ids: string[]
  approximate_calories?: number
}

type MenuGenerationIndex = {
  everydayPool: EatWellCatalogItem[]
  candidatesBySlotRole: Map<string, EatWellCatalogItem[]>
  archetypesBySlotObjective: Map<string, MealPlanArchetype[]>
}

const MENU_GENERATION_INDEX_VERSION = 2

let menuGenerationIndex: MenuGenerationIndex | null = null
let indexBuildPromise: Promise<MenuGenerationIndex> | null = null
let builtIndexVersion = 0

function invalidateMenuGenerationIndexIfStale() {
  if (builtIndexVersion === MENU_GENERATION_INDEX_VERSION) return
  menuGenerationIndex = null
  indexBuildPromise = null
}

function getRoleFilter(role: string): RoleFilter {
  const roles = eatWellContent.mealRoleMapping.roles as Record<string, RoleFilter>
  return roles[role] ?? { meal_roles: ['snack'] }
}

function itemMatchesRoleFilter(item: EatWellCatalogItem, filter: RoleFilter, slot: MealSlot) {
  if (filter.suitable_slots?.length && !filter.suitable_slots.includes(slot)) return false
  if (filter.meal_roles?.length) {
    const itemRoles = item.meal_roles ?? []
    if (!filter.meal_roles.some((role) => itemRoles.includes(role))) return false
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

function slotRoleKey(slot: MealSlot, role: string) {
  return `${slot}:${role}`
}

function slotObjectiveKey(slot: MealSlot, objective: EatWellMenuObjective) {
  return `${slot}:${objective}`
}

function appendCandidate(map: Map<string, EatWellCatalogItem[]>, key: string, item: EatWellCatalogItem) {
  const current = map.get(key)
  if (current) {
    current.push(item)
    return
  }
  map.set(key, [item])
}

function buildArchetypeIndex() {
  const archetypesBySlotObjective = new Map<string, MealPlanArchetype[]>()
  const archetypes = eatWellContent.mealPlanArchetypes.archetypes as MealPlanArchetype[]

  for (const archetype of archetypes) {
    const key = slotObjectiveKey(archetype.slot, archetype.objective)
    const current = archetypesBySlotObjective.get(key) ?? []
    current.push(archetype)
    archetypesBySlotObjective.set(key, current)
  }

  return archetypesBySlotObjective
}

function buildMenuGenerationIndexSync(): MenuGenerationIndex {
  const roleKeys = Object.keys(eatWellContent.mealRoleMapping.roles as Record<string, RoleFilter>)
  const catalogFoods = getEatWellCatalogIndex().foods
  const everydayPool: EatWellCatalogItem[] = []
  const candidatesBySlotRole = new Map<string, EatWellCatalogItem[]>()

  for (const food of catalogFoods) {
    if (!isEverydayPoolMember(food)) continue
    everydayPool.push(food)

    const slots = food.suitable_slots.length > 0 ? food.suitable_slots : MENU_GENERATION_SLOTS

    for (const slot of slots) {
      if (!isPracticalEverydayFood(food, slot)) continue

      for (const roleKey of roleKeys) {
        const filter = getRoleFilter(roleKey)
        if (!itemMatchesRoleFilter(food, filter, slot)) continue
        appendCandidate(candidatesBySlotRole, slotRoleKey(slot, roleKey), food)
      }
    }
  }

  for (const beverageEntry of getEatWellCatalogIndex().beverages) {
    const adapted = adaptCatalogEntryForMenuGeneration({
      id: beverageEntry.id,
      name: beverageEntry.name,
      kind: 'beverage',
      beverage: beverageEntry,
    })
    if (!adapted) continue

    for (const slot of BEVERAGE_MENU_SLOTS) {
      for (const roleKey of roleKeys) {
        const filter = getRoleFilter(roleKey)
        if (!itemMatchesRoleFilter(adapted, filter, slot)) continue
        appendCandidate(candidatesBySlotRole, slotRoleKey(slot, roleKey), adapted)
      }
    }
  }

  return finalizeMenuGenerationIndex({
    everydayPool,
    candidatesBySlotRole,
    archetypesBySlotObjective: buildArchetypeIndex(),
  })
}

function finalizeMenuGenerationIndex(index: MenuGenerationIndex) {
  builtIndexVersion = MENU_GENERATION_INDEX_VERSION
  return index
}

async function buildMenuGenerationIndexInternal(): Promise<MenuGenerationIndex> {
  const roleKeys = Object.keys(eatWellContent.mealRoleMapping.roles as Record<string, RoleFilter>)
  const catalogFoods = getEatWellCatalogIndex().foods
  const everydayPool: EatWellCatalogItem[] = []
  const candidatesBySlotRole = new Map<string, EatWellCatalogItem[]>()

  const chunkSize = 400
  const chunks = Math.ceil(catalogFoods.length / chunkSize)

  await runInBackgroundChunks(chunks, async (chunkIndex) => {
    const start = chunkIndex * chunkSize
    const slice = catalogFoods.slice(start, start + chunkSize)

    for (const food of slice) {
      if (!isEverydayPoolMember(food)) continue
      everydayPool.push(food)

      const slots =
        food.suitable_slots.length > 0 ? food.suitable_slots : MENU_GENERATION_SLOTS

      for (const slot of slots) {
        if (!isPracticalEverydayFood(food, slot)) continue

        for (const roleKey of roleKeys) {
          const filter = getRoleFilter(roleKey)
          if (!itemMatchesRoleFilter(food, filter, slot)) continue
          appendCandidate(candidatesBySlotRole, slotRoleKey(slot, roleKey), food)
        }
      }
    }
  })

  for (const beverageEntry of getEatWellCatalogIndex().beverages) {
    const adapted = adaptCatalogEntryForMenuGeneration({
      id: beverageEntry.id,
      name: beverageEntry.name,
      kind: 'beverage',
      beverage: beverageEntry,
    })
    if (!adapted) continue

    for (const slot of BEVERAGE_MENU_SLOTS) {
      for (const roleKey of roleKeys) {
        const filter = getRoleFilter(roleKey)
        if (!itemMatchesRoleFilter(adapted, filter, slot)) continue
        appendCandidate(candidatesBySlotRole, slotRoleKey(slot, roleKey), adapted)
      }
    }
  }

  return finalizeMenuGenerationIndex({
    everydayPool,
    candidatesBySlotRole,
    archetypesBySlotObjective: buildArchetypeIndex(),
  })
}

export function getMenuGenerationIndex() {
  if (!menuGenerationIndex) {
    throw new Error('Menu generation index not ready. Call ensureMenuGenerationIndex() first.')
  }
  return menuGenerationIndex
}

export function isMenuGenerationIndexReady() {
  return menuGenerationIndex !== null
}

export function ensureMenuGenerationIndexSync() {
  invalidateMenuGenerationIndexIfStale()
  if (menuGenerationIndex) return menuGenerationIndex
  menuGenerationIndex = buildMenuGenerationIndexSync()
  return menuGenerationIndex
}

export async function ensureMenuGenerationIndex(onProgress?: (progress: number) => void) {
  invalidateMenuGenerationIndexIfStale()
  if (menuGenerationIndex) return menuGenerationIndex

  if (!indexBuildPromise) {
    indexBuildPromise = scheduleAfterInteractions(async () => {
      onProgress?.(5)
      await yieldToUi()
      const built = await buildMenuGenerationIndexInternal()
      menuGenerationIndex = built
      onProgress?.(100)
      return built
    })
  }

  return indexBuildPromise
}

export function warmMenuGenerationIndex() {
  void ensureMenuGenerationIndex()
}

export function getCandidatesForRole(
  slot: MealSlot,
  role: string,
  usedFoodIds: Set<string>,
  constraintFilter: (item: EatWellCatalogItem) => boolean,
) {
  const index = menuGenerationIndex
  if (!index) return []

  const bucket = index.candidatesBySlotRole.get(slotRoleKey(slot, role)) ?? []

  return bucket.filter(
    (item) => !(usedFoodIds ?? new Set()).has(item.id) && constraintFilter(item),
  )
}

export function getArchetypesForSlotObjective(slot: MealSlot, objective: EatWellMenuObjective) {
  const index = menuGenerationIndex
  if (!index) return []

  return index.archetypesBySlotObjective.get(slotObjectiveKey(slot, objective)) ?? []
}

export function resolveArchetypeFoodIds(foodIds: string[]) {
  return foodIds
    .map((foodId) => getEatWellCatalogEntry(foodId))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
}

export { itemMatchesRoleFilter, getRoleFilter }
