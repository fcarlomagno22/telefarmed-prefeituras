import type { FoodEntry } from '../types/eatWell'
import {
  getAllBeverageCatalogItems,
  getAllFoodCatalogItems,
} from './content/loadEatWellContent'
import { normalizeEatWellText } from './normalizeText'
import { scaleMacrosFrom100g } from './scaleMacros'
import type {
  EatWellBeverageItem,
  EatWellCatalogEntry,
  EatWellCatalogItem,
  EatWellResolvedPortion,
  EatWellSearchResult,
} from './types'

type CatalogIndex = {
  byId: Map<string, EatWellCatalogEntry>
  foods: EatWellCatalogItem[]
  beverages: EatWellBeverageItem[]
  synonymToIds: Map<string, string[]>
}

let catalogIndex: CatalogIndex | null = null

function buildSynonymIndex() {
  const synonymToIds = new Map<string, string[]>()

  function addSynonym(text: string, id: string) {
    const normalized = normalizeEatWellText(text)
    if (!normalized) return
    const current = synonymToIds.get(normalized) ?? []
    if (!current.includes(id)) current.push(id)
    synonymToIds.set(normalized, current)
  }

  for (const food of getAllFoodCatalogItems()) {
    addSynonym(food.name, food.id)
    for (const alias of food.aliases ?? []) addSynonym(alias, food.id)
    for (const keyword of food.keywords ?? []) addSynonym(keyword, food.id)
  }

  for (const beverage of getAllBeverageCatalogItems()) {
    addSynonym(beverage.name, beverage.id)
    for (const alias of beverage.aliases ?? []) addSynonym(alias, beverage.id)
  }

  return synonymToIds
}

function buildCatalogIndex(): CatalogIndex {
  const byId = new Map<string, EatWellCatalogEntry>()
  const foods = getAllFoodCatalogItems()
  const beverages = getAllBeverageCatalogItems()

  for (const food of foods) {
    byId.set(food.id, { id: food.id, name: food.name, kind: 'food', food })
  }

  for (const beverage of beverages) {
    byId.set(beverage.id, { id: beverage.id, name: beverage.name, kind: 'beverage', beverage })
  }

  return {
    byId,
    foods,
    beverages,
    synonymToIds: buildSynonymIndex(),
  }
}

export function getEatWellCatalogIndex() {
  if (!catalogIndex) catalogIndex = buildCatalogIndex()
  return catalogIndex
}

export function getEatWellCatalogEntry(id: string): EatWellCatalogEntry | null {
  return getEatWellCatalogIndex().byId.get(id) ?? null
}

export function resolveDefaultPortion(
  entry: EatWellCatalogEntry,
): EatWellResolvedPortion | null {
  if (entry.kind === 'food' && entry.food) {
    const food = entry.food
    const defaultPortion = food.default_portion
    const matched =
      food.portions?.find((portion) => portion.label === defaultPortion.label) ??
      food.portions?.[0]

    if (matched?.macros) {
      return {
        portionLabel: matched.label,
        macros: matched.macros,
        gramsEquivalent: matched.grams_equivalent,
      }
    }

    const grams = defaultPortion.grams_equivalent || 100
    return {
      portionLabel: defaultPortion.label,
      macros: scaleMacrosFrom100g(food.macros_per_100g, grams),
      gramsEquivalent: grams,
    }
  }

  if (entry.kind === 'beverage' && entry.beverage) {
    const ml = 200
    return {
      portionLabel: `${ml} ml`,
      macros: scaleMacrosFrom100g(entry.beverage.macros_per_100ml, ml),
      gramsEquivalent: ml,
    }
  }

  return null
}

export function catalogEntryToFoodEntry(
  entry: EatWellCatalogEntry,
  entryId?: string,
): FoodEntry | null {
  const portion = resolveDefaultPortion(entry)
  if (!portion) return null

  return {
    id: entryId ?? `${entry.id}-${Date.now()}`,
    name: entry.name,
    portionLabel: portion.portionLabel,
    macros: { ...portion.macros },
  }
}

function scoreSearchMatch(query: string, entry: EatWellCatalogEntry): number {
  const normalizedQuery = normalizeEatWellText(query)
  if (!normalizedQuery) return 0

  const name = normalizeEatWellText(entry.name)
  if (name === normalizedQuery) return 100
  if (name.startsWith(normalizedQuery)) return 90
  if (name.includes(normalizedQuery)) return 75

  const source = entry.kind === 'food' ? entry.food : null
  if (source) {
    for (const alias of source.aliases ?? []) {
      const normalizedAlias = normalizeEatWellText(alias)
      if (normalizedAlias === normalizedQuery) return 95
      if (normalizedAlias.startsWith(normalizedQuery)) return 85
      if (normalizedAlias.includes(normalizedQuery)) return 70
    }
    for (const keyword of source.keywords ?? []) {
      const normalizedKeyword = normalizeEatWellText(keyword)
      if (normalizedKeyword.includes(normalizedQuery)) return 60
    }
  }

  return 0
}

export function searchEatWellCatalog(query: string, limit = 8): EatWellSearchResult[] {
  const normalizedQuery = normalizeEatWellText(query)
  const index = getEatWellCatalogIndex()

  if (!normalizedQuery) {
    return index.foods.slice(0, limit).map((food) => ({
      id: food.id,
      name: food.name,
      kind: 'food' as const,
      food,
      score: 1,
    }))
  }

  const synonymIds = index.synonymToIds.get(normalizedQuery) ?? []
  const results = new Map<string, EatWellSearchResult>()

  for (const id of synonymIds) {
    const entry = index.byId.get(id)
    if (!entry) continue
    results.set(id, { ...entry, score: 98 })
  }

  for (const entry of index.byId.values()) {
    const score = scoreSearchMatch(query, entry)
    if (score <= 0) continue
    const current = results.get(entry.id)
    if (!current || score > current.score) {
      results.set(entry.id, { ...entry, score })
    }
  }

  return [...results.values()].sort((left, right) => right.score - left.score).slice(0, limit)
}

export function resolveEatWellFoodByName(name: string): EatWellCatalogEntry | null {
  const match = searchEatWellCatalog(name, 1)[0]
  return match ?? null
}

export function getEatWellFoodDatabaseSize() {
  const index = getEatWellCatalogIndex()
  return index.foods.length + index.beverages.length
}
