import { normalizeEatWellText } from '../normalizeText'
import { SLOT_SPECS } from './buildMenuAiPrompt'
import type { EatWellMenuMeal, EatWellSavedMenu, FoodEntry, MacroNutrients, MealSlot } from '../../types/eatWell'
import type { EatWellMenuWizardForm } from '../../utils/eatWellMenuWizard'
import { computeNutritionGoalsFromWizard } from '../computeNutritionGoals'
import { sumMacros } from '../../utils/eatWellNutritionStats'

const REQUIRED_SLOTS: MealSlot[] = SLOT_SPECS.map((spec) => spec.slot)

const FAMILY_PATTERNS: Array<{ key: string; tokens: string[] }> = [
  { key: 'arroz', tokens: ['arroz'] },
  { key: 'feijao', tokens: ['feijao', 'feijão'] },
  { key: 'frango', tokens: ['frango', 'galinha'] },
  { key: 'peixe', tokens: ['peixe', 'tilapia', 'tilápia', 'salmao', 'salmão', 'sardinha', 'bacalhau'] },
  { key: 'carne', tokens: ['carne bovina', 'bovina', 'patinho', 'carne'] },
  { key: 'ovo', tokens: ['ovo', 'omelete', 'omeleta'] },
  { key: 'banana', tokens: ['banana'] },
  { key: 'tapioca', tokens: ['tapioca'] },
  { key: 'pao', tokens: ['pao', 'pão'] },
  { key: 'macarrao', tokens: ['macarrao', 'macarrão'] },
  { key: 'cuscuz', tokens: ['cuscuz'] },
  { key: 'iogurte', tokens: ['iogurte'] },
  { key: 'queijo', tokens: ['queijo'] },
  { key: 'batata', tokens: ['batata'] },
  { key: 'mandioca', tokens: ['mandioca', 'aipim'] },
]

type AiMacroPayload = Partial<MacroNutrients> & { calories?: number }

export type AiMenuEntry = {
  name?: string
  portion_label?: string
  macros?: AiMacroPayload
}

export type AiMenuResponse = {
  menu_name?: string
  rationale_short?: string
  meals?: Array<{
    slot?: string
    entries?: AiMenuEntry[]
  }>
  daily_totals?: AiMacroPayload
  water_recommendation_ml?: number
}

function inferFoodFamily(name: string) {
  const normalized = normalizeEatWellText(name)
  for (const family of FAMILY_PATTERNS) {
    if (family.tokens.some((token) => normalized.includes(normalizeEatWellText(token)))) {
      return family.key
    }
  }
  const tokens = normalized.split(' ').filter(Boolean)
  return tokens.slice(0, 2).join(' ') || normalized
}

function isRepeatableFamily(familyKey: string) {
  return familyKey === 'agua' || familyKey.includes('agua') || familyKey.includes('cha')
}

function readMacro(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

function normalizeMacros(raw: AiMacroPayload | undefined): MacroNutrients | null {
  if (!raw) return null

  const calories = readMacro(raw.calories)
  const proteinG = readMacro(raw.proteinG)
  const carbsG = readMacro(raw.carbsG)
  const fatG = readMacro(raw.fatG)
  const fiberG = readMacro(raw.fiberG)
  const sugarsG = readMacro(raw.sugarsG)
  const saturatedFatG = readMacro(raw.saturatedFatG)

  if (calories == null || proteinG == null || carbsG == null || fatG == null) return null

  return {
    calories,
    proteinG,
    carbsG,
    fatG,
    fiberG: fiberG ?? 0,
    sugarsG: sugarsG ?? 0,
    saturatedFatG: saturatedFatG ?? 0,
  }
}

function slugify(value: string) {
  return normalizeEatWellText(value).replace(/\s+/g, '-').slice(0, 40)
}

export function validateAiMenuResponse(parsed: AiMenuResponse, form: EatWellMenuWizardForm) {
  const errors: string[] = []
  const goals = computeNutritionGoalsFromWizard(form)
  const usedNames = new Set<string>()
  const usedFamilies = new Set<string>()
  const slotsPresent = new Set<string>()
  const allEntries: FoodEntry[] = []

  if (!parsed.meals?.length) {
    return ['Resposta sem refeições.']
  }

  for (const meal of parsed.meals) {
    const slot = meal.slot as MealSlot | undefined
    const spec = SLOT_SPECS.find((item) => item.slot === slot)

    if (!slot || !spec) {
      errors.push(`Slot inválido: ${meal.slot ?? 'desconhecido'}`)
      continue
    }

    slotsPresent.add(slot)
    const entries = meal.entries ?? []

    if (entries.length < spec.min_items) {
      errors.push(`${spec.label} (${slot}) precisa de pelo menos ${spec.min_items} itens.`)
    }
    if (entries.length > spec.max_items) {
      errors.push(`${spec.label} (${slot}) excede ${spec.max_items} itens.`)
    }

    for (const entry of entries) {
      const name = entry.name?.trim()
      const portionLabel = entry.portion_label?.trim()
      const macros = normalizeMacros(entry.macros)

      if (!name) {
        errors.push(`Item sem nome em ${slot}.`)
        continue
      }
      if (!portionLabel) {
        errors.push(`Item "${name}" sem porção em ${slot}.`)
        continue
      }
      if (!macros) {
        errors.push(`Item "${name}" com macros inválidos em ${slot}.`)
        continue
      }
      if (macros.calories <= 0) {
        errors.push(`Item "${name}" com calorias inválidas.`)
      }

      const normalizedName = normalizeEatWellText(name)
      if (usedNames.has(normalizedName)) {
        errors.push(`Alimento repetido no dia: ${name}`)
      }

      const family = inferFoodFamily(name)
      if (!isRepeatableFamily(family) && usedFamilies.has(family)) {
        errors.push(`Família repetida no dia (${family}): ${name}`)
      }

      if (form.avoidedFoods.trim()) {
        const avoided = form.avoidedFoods
          .split(/[,;\n]+/)
          .map((value) => normalizeEatWellText(value))
          .filter(Boolean)
        if (avoided.some((term) => normalizedName.includes(term))) {
          errors.push(`Item proibido pelo usuário: ${name}`)
        }
      }

      usedNames.add(normalizedName)
      if (!isRepeatableFamily(family)) usedFamilies.add(family)

      allEntries.push({
        id: `${slot}-${slugify(name)}`,
        name,
        portionLabel,
        macros,
      })
    }
  }

  for (const spec of SLOT_SPECS) {
    if (!slotsPresent.has(spec.slot)) {
      errors.push(`Faltou ${spec.label} (${spec.slot}).`)
    }
  }

  if (allEntries.length > 0) {
    const totals = sumMacros(allEntries)
    const calorieRatio = totals.calories / Math.max(goals.baseCalories, 1)
    if (calorieRatio < 0.85 || calorieRatio > 1.15) {
      errors.push(
        `Calorias do dia (${Math.round(totals.calories)} kcal) fora da meta (${goals.baseCalories} kcal). Ajuste porções.`,
      )
    }
    if (totals.proteinG < goals.proteinG * 0.8) {
      errors.push(`Proteína do dia (${Math.round(totals.proteinG)}g) abaixo da meta (${goals.proteinG}g).`)
    }
    if (totals.fiberG < goals.fiberG * 0.75) {
      errors.push(`Fibra do dia (${Math.round(totals.fiberG)}g) abaixo da meta (${goals.fiberG}g).`)
    }
  }

  return errors
}

export function mapAiMenuResponseToSavedMenu(
  form: EatWellMenuWizardForm,
  parsed: AiMenuResponse,
): EatWellSavedMenu {
  const id = `menu-ai-${Date.now()}`
  const objective = form.objective ?? 'other'
  const name = parsed.menu_name?.trim() || form.menuName.trim() || 'Meu cardápio'
  const createdAt = new Date().toISOString()
  const meals: EatWellMenuMeal[] = []

  for (const spec of SLOT_SPECS) {
    const meal = parsed.meals?.find((item) => item.slot === spec.slot)
    const entries: FoodEntry[] = []

    for (const [index, entry] of (meal?.entries ?? []).entries()) {
      const macros = normalizeMacros(entry.macros)
      const foodName = entry.name?.trim()
      const portionLabel = entry.portion_label?.trim()
      if (!macros || !foodName || !portionLabel) continue

      entries.push({
        id: `${spec.slot}-${slugify(foodName)}-${index}`,
        name: foodName,
        portionLabel,
        macros,
      })
    }

    if (entries.length > 0) {
      meals.push({ slot: spec.slot, entries })
    }
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

export function parseAiMenuJson(content: string): AiMenuResponse {
  const trimmed = content.trim()
  const jsonStart = trimmed.indexOf('{')
  const jsonEnd = trimmed.lastIndexOf('}')
  if (jsonStart < 0 || jsonEnd <= jsonStart) {
    throw new Error('Resposta da IA não contém JSON.')
  }

  return JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1)) as AiMenuResponse
}
