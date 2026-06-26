import { foodMatchesRequireTag, getDailyLimitTagsForFood } from './foodTagAlignment'
import type { EatWellCatalogItem } from './types'

export class MenuDayConstraintTracker {
  private readonly counts = new Map<string, number>()

  constructor(private readonly maxPerDay: Record<string, number>) {}

  canAddFood(item: EatWellCatalogItem) {
    for (const [tag, limit] of Object.entries(this.maxPerDay)) {
      if (!this.foodTriggersLimitTag(item, tag)) continue
      const count = this.counts.get(tag) ?? 0
      if (limit === 0 || count >= limit) return false
    }

    return true
  }

  recordFood(item: EatWellCatalogItem) {
    for (const tag of getDailyLimitTagsForFood(item, this.maxPerDay)) {
      this.counts.set(tag, (this.counts.get(tag) ?? 0) + 1)
    }
  }

  getMissingRequireTags(requireTags: Set<string>, menuFoods: EatWellCatalogItem[]) {
    const missing = new Set<string>()

    for (const requireTag of requireTags) {
      const satisfied = menuFoods.some((food) => foodMatchesRequireTag(food, requireTag))
      if (!satisfied) missing.add(requireTag)
    }

    return missing
  }

  private foodTriggersLimitTag(item: EatWellCatalogItem, tag: string) {
    return getDailyLimitTagsForFood(item, { [tag]: this.maxPerDay[tag] ?? 0 }).includes(tag)
  }
}
