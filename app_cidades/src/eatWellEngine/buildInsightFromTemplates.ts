import { eatWellContent } from './content/loadEatWellContent'
import { searchEatWellCatalog } from './foodCatalog'
import { normalizeEatWellText } from './normalizeText'
import type { DailyNutritionTotals, NutritionGoals } from '../types/eatWell'
import { MEAL_SLOT_CONFIG, MEAL_SLOT_ORDER } from '../utils/eatWellMealSlots'

type InsightContext = {
  protein_pct: number
  sugars_g: number
  water_pct: number
  calorie_ratio: number
  fiber_g: number
  balance_score: number
  remaining_slots: number
  weekday: string
  suggested_food: string
  slot_label: string
}

function evaluateTemplateCondition(
  condition: {
    all?: Array<{ field: string; operator: string; value: number | string | number[] | string[] }>
    any?: Array<{ field: string; operator: string; value: number | string | number[] | string[] }>
  },
  ctx: InsightContext,
) {
  const evaluateAtomic = (rule: {
    field: string
    operator: string
    value: number | string | number[] | string[]
  }) => {
    const actual = ctx[rule.field as keyof InsightContext]
    const expected = rule.value

    if (Array.isArray(expected)) {
      if (typeof actual === 'number' && expected.every((item) => typeof item === 'number')) {
        if (rule.operator === 'includes') return expected.includes(actual)
      }
      if (typeof actual === 'string' && expected.every((item) => typeof item === 'string')) {
        if (rule.operator === 'includes') return expected.includes(actual)
      }
      return false
    }

    if (typeof actual === 'number' && typeof expected === 'number') {
      switch (rule.operator) {
        case '<':
          return actual < expected
        case '<=':
          return actual <= expected
        case '>':
          return actual > expected
        case '>=':
          return actual >= expected
        case '==':
          return actual === expected
        default:
          return false
      }
    }

    if (typeof actual === 'string' && typeof expected === 'string') {
      return rule.operator === '==' ? actual === expected : false
    }

    return false
  }

  if (condition.all?.length) return condition.all.every(evaluateAtomic)
  if (condition.any?.length) return condition.any.some(evaluateAtomic)
  return false
}

function renderTemplate(
  template: string,
  ctx: InsightContext,
  defaults?: Record<string, string>,
) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = ctx[key as keyof InsightContext]
    if (value != null && value !== '') return String(value)
    return defaults?.[key] ?? ''
  })
}

function buildContext(
  totals: DailyNutritionTotals,
  goals: NutritionGoals,
  adjustedCalorieTarget: number,
  filledSlots: number,
): InsightContext {
  const remainingSlots = Math.max(0, MEAL_SLOT_ORDER.length - filledSlots - 1)
  const nextSlot = MEAL_SLOT_ORDER.find((_, index) => index >= filledSlots) ?? 'dinner'
  const suggested = searchEatWellCatalog('frango grelhado', 1)[0]?.name ?? 'uma proteína magra'

  return {
    protein_pct: goals.proteinG > 0 ? Math.round((totals.proteinG / goals.proteinG) * 100) : 0,
    sugars_g: Math.round(totals.sugarsG),
    water_pct: goals.waterMl > 0 ? Math.round((totals.waterMl / goals.waterMl) * 100) : 0,
    calorie_ratio:
      adjustedCalorieTarget > 0 ? Math.round((totals.calories / adjustedCalorieTarget) * 100) : 0,
    fiber_g: Math.round(totals.fiberG),
    balance_score: 0,
    remaining_slots: remainingSlots,
    weekday: new Date().toLocaleDateString('pt-BR', { weekday: 'long' }),
    suggested_food: suggested,
    slot_label: MEAL_SLOT_CONFIG[nextSlot].label.toLowerCase(),
  }
}

export function buildDailyInsight(
  totals: DailyNutritionTotals,
  goals: NutritionGoals,
  adjustedCalorieTarget: number,
  filledMealCount = 0,
): string | null {
  const ctx = buildContext(totals, goals, adjustedCalorieTarget, filledMealCount)
  const templates = [...(eatWellContent.insightTemplates.templates ?? [])].sort(
    (left, right) => (right.priority ?? 0) - (left.priority ?? 0),
  )

  for (const item of templates) {
    if (!evaluateTemplateCondition(item.condition, ctx)) continue
    const rendered = renderTemplate(item.template, ctx, item.defaults).trim()
    if (rendered) return rendered
  }

  return null
}

export function resolvePhotoLabels(labels: string[]) {
  const mapping = eatWellContent.photoLabelMapping.labels as Array<{
    label: string
    candidates: Array<{ food_id: string; weight: number }>
  }>

  const resolved = new Map<string, number>()
  for (const rawLabel of labels) {
    const label = normalizeEatWellText(rawLabel)
    const match = mapping.find((entry) => entry.label === label)
    if (!match) continue
    for (const candidate of match.candidates) {
      resolved.set(
        candidate.food_id,
        Math.max(resolved.get(candidate.food_id) ?? 0, candidate.weight),
      )
    }
  }

  return [...resolved.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([foodId]) => foodId)
}
