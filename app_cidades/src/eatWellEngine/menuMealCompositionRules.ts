import type { MealSlot } from '../types/eatWell'
import type { EatWellCatalogItem } from './types'
import { normalizeEatWellText } from './normalizeText'

type CompositionRole = {
  role: string
  count: number
  calorie_share: number
  optional?: boolean
}

export type CompositionTemplate = {
  min_items: number
  max_items: number
  required_roles: CompositionRole[]
}

const PREPARATION_NOISE = [
  'sem sal',
  'com sal',
  'no vapor',
  'cozido',
  'cozida',
  'refogado',
  'refogada',
  'grelhado',
  'grelhada',
  'assado',
  'assada',
  'cru',
  'crua',
  'in natura',
  'porcao simples',
  'porcao tradicional',
  'caseiro',
  'caseira',
  'tradicional',
  'simples',
  'sem miolo',
  'sem acucar',
  'sem açúcar',
  'com leite',
  'com oleo',
  'com óleo',
  'com azeite',
  'com alho',
  'temperado',
  'temperada',
  'fatia',
  'colher',
  'xicara',
  'unidade',
  'media',
  'média',
  'grande',
  'pequena',
]

const FOOD_FAMILY_PATTERNS: Array<{ key: string; match: string[] }> = [
  { key: 'brocolis', match: ['brocolis', 'brócolis'] },
  { key: 'cenoura', match: ['cenoura'] },
  { key: 'couve', match: ['couve'] },
  { key: 'abobrinha', match: ['abobrinha'] },
  { key: 'berinjela', match: ['berinjela'] },
  { key: 'espinafre', match: ['espinafre'] },
  { key: 'alface', match: ['alface'] },
  { key: 'tomate', match: ['tomate'] },
  { key: 'arroz', match: ['arroz'] },
  { key: 'feijao', match: ['feijao', 'feijão'] },
  { key: 'cuscuz', match: ['cuscuz'] },
  { key: 'macarrao', match: ['macarrao', 'macarrão'] },
  { key: 'mandioca', match: ['mandioca', 'aipim'] },
  { key: 'batata', match: ['batata'] },
  { key: 'pao', match: ['pao', 'pão', 'paes', 'pães', 'torrada', 'bisnagu'] },
  { key: 'tapioca', match: ['tapioca', 'goma de tapioca'] },
  { key: 'aveia', match: ['aveia'] },
  { key: 'frango', match: ['frango', 'galinha'] },
  { key: 'carne bovina', match: ['carne bovina', 'bovina', 'patinho', 'acem', 'alcatra', 'maminha', 'coxao', 'coxão'] },
  { key: 'carne suina', match: ['porco', 'suina', 'suína', 'pernil', 'lombo suino', 'lombo suíno', 'bisteca'] },
  { key: 'peixe', match: ['peixe', 'tilapia', 'tilápia', 'salmao', 'salmão', 'sardinha', 'bacalhau', 'merluza', 'pescada', 'atum', 'corvina', 'robalo'] },
  { key: 'camarao', match: ['camarao', 'camarão', 'camaroes', 'camarões'] },
  { key: 'ovo', match: ['ovo', 'omelete', 'omeleta'] },
  { key: 'banana', match: ['banana'] },
  { key: 'maca', match: ['maca', 'maçã'] },
  { key: 'mamao', match: ['mamao', 'mamão', 'mamao papaya', 'mamão papaya'] },
  { key: 'laranja', match: ['laranja'] },
  { key: 'melancia', match: ['melancia'] },
  { key: 'abacate', match: ['abacate'] },
  { key: 'morango', match: ['morango'] },
  { key: 'uva', match: ['uva'] },
  { key: 'pera', match: ['pera'] },
  { key: 'manga', match: ['manga'] },
  { key: 'iogurte', match: ['iogurte'] },
  { key: 'leite', match: ['leite'] },
  { key: 'queijo', match: ['queijo', 'requeijao', 'requeijão'] },
  { key: 'presunto', match: ['presunto', 'mortadela', 'salame', 'salame'] },
  { key: 'cafe', match: ['cafe', 'café', 'expresso', 'coado'] },
  { key: 'cha', match: ['cha ', 'chá ', 'chá mate', 'cha mate'] },
  { key: 'agua', match: ['agua', 'água'] },
]

const HEAVY_STARCH_TOKENS = [
  'arroz',
  'cuscuz',
  'macarrao',
  'macarrão',
  'feijao',
  'feijão',
  'mandioca',
  'aipim',
  'farofa',
  'lasanha',
  'pizza',
  'nhoque',
  'polenta',
  'pamonha',
  'goma de tapioca',
  'fecula',
  'fécula',
]

const SNACK_LIGHT_CARB_TOKENS = [
  'tapioca pronta',
  'tapioca com',
  'pao de queijo',
  'pão de queijo',
  'biscoito',
  'torrada',
  'aveia',
  'granola',
  'bolo caseiro',
  'bolo simples',
  'cuscuz de milho',
]

const SNACK_FORBIDDEN_FRUIT_TOKENS = [
  'cacau',
  'polpa de cacau',
  'cacau polpa',
  'fruta do cacau',
  'graviola',
  'cupuacu',
  'cupuaçu',
  'jabuticaba',
  'pitanga',
  'araca',
  'araçá',
  'caja',
  'cajá',
  'pequi',
  'umbu',
  'bacuri',
  'camu camu',
]

const BASKET_FORBIDDEN_TOKENS = [
  'arroz',
  'feijao',
  'feijão',
  'cuscuz',
  'macarrao',
  'macarrão',
  'carne bovina',
  'frango grelhado',
  'peixe',
  'farofa',
  'pao frances',
  'pão francês',
  'pao integral',
  'pão integral',
  'pao de forma',
  'pão de forma',
  'sem miolo',
  'goma de tapioca',
  'empanad',
  'cru',
]

const PRACTICAL_BASKET_TEMPLATE: CompositionTemplate = {
  min_items: 1,
  max_items: 2,
  required_roles: [
    { role: 'fruit', count: 1, calorie_share: 0.55, optional: false },
    { role: 'dairy_or_alternative', count: 1, calorie_share: 0.35, optional: true },
    { role: 'beverage_unsweetened', count: 1, calorie_share: 0.1, optional: true },
  ],
}

function stripPreparationNoise(name: string) {
  let cleaned = name
  for (const token of PREPARATION_NOISE) {
    cleaned = cleaned.replaceAll(normalizeEatWellText(token), ' ')
  }
  return cleaned.replace(/\s+/g, ' ').trim()
}

/** Agrupa variações do mesmo alimento (ex.: brócolis no vapor vs sem sal). */
export function getFoodFamilyKey(item: EatWellCatalogItem): string {
  const name = normalizeEatWellText(item.name)

  for (const family of FOOD_FAMILY_PATTERNS) {
    if (family.match.some((token) => name.includes(normalizeEatWellText(token)))) {
      return family.key
    }
  }

  if (item.tags.includes('fish') || item.tags.includes('seafood')) {
    if (name.includes('camarao') || name.includes('camarão')) return 'camarao'
    return 'peixe'
  }

  if (item.tags.includes('contains_meat') || item.category === 'meats') {
    if (name.includes('frango') || name.includes('galinha')) return 'frango'
    if (name.includes('porco') || name.includes('suina') || name.includes('suína')) return 'carne suina'
    if (name.includes('carne') || name.includes('bovina') || name.includes('patinho')) return 'carne bovina'
  }

  if (item.category === 'fruits' || item.meal_roles.some((role) => role.includes('fruit'))) {
    const stripped = stripPreparationNoise(name)
    const fruitToken = stripped.split(' ').find(Boolean)
    if (fruitToken && fruitToken.length >= 3) return fruitToken
  }

  if (item.keywords?.length) {
    const keyword = normalizeEatWellText(item.keywords[0])
    if (keyword.length >= 3) return keyword
  }

  const stripped = stripPreparationNoise(name)
  const tokens = stripped.split(' ').filter(Boolean)
  return tokens.slice(0, 2).join(' ') || name
}

/** Água pode repetir no dia; demais famílias não. */
export function isDayRepeatableFamily(familyKey: string) {
  return familyKey === 'agua'
}

const STARCH_FAMILY_KEYS = [
  'arroz',
  'cuscuz',
  'macarrao',
  'feijao',
  'mandioca',
  'batata',
  'tapioca',
  'pao',
] as const

export function isStarchFamilyKey(familyKey: string) {
  return STARCH_FAMILY_KEYS.includes(familyKey as (typeof STARCH_FAMILY_KEYS)[number])
}

export function isHeavyStarchFood(item: EatWellCatalogItem) {
  const name = normalizeEatWellText(item.name)
  if (name.includes('pao de queijo') || name.includes('pão de queijo')) return false
  return HEAVY_STARCH_TOKENS.some((token) => name.includes(normalizeEatWellText(token)))
}

export function isLightSnackCarb(item: EatWellCatalogItem) {
  const name = normalizeEatWellText(item.name)
  if (isHeavyStarchFood(item)) return false
  return SNACK_LIGHT_CARB_TOKENS.some((token) => name.includes(normalizeEatWellText(token)))
}

export function isBreadFamily(item: EatWellCatalogItem) {
  const name = normalizeEatWellText(item.name)
  return (
    name.includes('pao') ||
    name.includes('pão') ||
    name.includes('paes') ||
    name.includes('pães') ||
    name.includes('torrada') ||
    name.includes('bisnagu')
  )
}

export function isSnackForbiddenFruit(item: EatWellCatalogItem) {
  const name = normalizeEatWellText(item.name)
  return includesAny(name, SNACK_FORBIDDEN_FRUIT_TOKENS)
}

function isFruitFood(item: EatWellCatalogItem) {
  return item.category === 'fruits' || item.meal_roles.some((role) => role.includes('fruit'))
}

function isProteinFood(item: EatWellCatalogItem) {
  return item.meal_roles.some(
    (role) => role.includes('protein') || role === 'lean_protein' || role === 'egg',
  )
}

function isDairyFood(item: EatWellCatalogItem) {
  return item.category === 'dairy' || item.meal_roles.some((role) => role.includes('dairy'))
}

function isBeverageFood(item: EatWellCatalogItem) {
  return (
    item.category === 'beverages' ||
    item.meal_roles.some((role) => role.includes('beverage') || role.includes('hydration'))
  )
}

function includesAny(name: string, tokens: string[]) {
  return tokens.some((token) => name.includes(normalizeEatWellText(token)))
}

export function isFoodAllowedInSlot(item: EatWellCatalogItem, slot: MealSlot) {
  const name = normalizeEatWellText(item.name)

  if (name.includes('empanad')) return false

  if (slot === 'morning_snack' || slot === 'afternoon_snack') {
    if (isSnackForbiddenFruit(item)) return false
    if (isHeavyStarchFood(item)) return false
    if (includesAny(name, ['salada', 'sopa', 'caldo', 'ensopado', 'moqueca', 'estrogonofe'])) {
      return false
    }
    if (item.meal_roles.includes('vegetable') && !item.meal_roles.includes('fruit')) return false
    if (name.includes('brocolis') || name.includes('brócolis')) return false
    if (item.category === 'legumes') return false
  }

  if (slot === 'morning_snack') {
    if (includesAny(name, ['arroz', 'feijao', 'feijão', 'cuscuz', 'macarrao', 'macarrão', 'farofa'])) {
      return false
    }
  }

  if (slot === 'basket') {
    if (includesAny(name, BASKET_FORBIDDEN_TOKENS)) return false
    if (isHeavyStarchFood(item)) return false
    if (isBreadFamily(item)) return false
    if (item.category === 'meats' || item.tags.includes('contains_meat')) return false
    if (name.includes('frango') || name.includes('peixe') || name.includes('carne')) return false
  }

  if (slot === 'lunch' || slot === 'dinner') {
    if (name.includes('in natura') && item.category === 'fruits') return false
  }

  return true
}

export function isCompatibleWithMealSoFar(
  item: EatWellCatalogItem,
  slot: MealSlot,
  familyKeysInMeal: Set<string>,
) {
  const familyKey = getFoodFamilyKey(item)

  if (familyKeysInMeal.has(familyKey)) return false

  if (slot === 'breakfast' || slot === 'lunch' || slot === 'dinner') {
    if (isStarchFamilyKey(familyKey)) {
      const starchesInMeal = [...familyKeysInMeal].filter(isStarchFamilyKey)
      if (starchesInMeal.length >= 1) return false
    }
  }

  if (slot === 'morning_snack' || slot === 'afternoon_snack') {
    if (isHeavyStarchFood(item)) return false
    const starchesInMeal = [...familyKeysInMeal].filter((key) =>
      ['arroz', 'cuscuz', 'macarrao', 'feijao', 'mandioca', 'batata', 'tapioca', 'pao'].includes(key),
    )
    const candidateStarch = ['arroz', 'cuscuz', 'macarrao', 'feijao', 'mandioca', 'batata', 'tapioca', 'pao']
    if (candidateStarch.includes(familyKey) && starchesInMeal.length >= 1) return false
  }

  if (slot === 'basket') {
    if (isBreadFamily(item) && [...familyKeysInMeal].some((key) => key === 'pao' || key === 'tapioca')) {
      return false
    }
    if (familyKeysInMeal.size >= 2) return false
  }

  if (slot === 'lunch' || slot === 'dinner') {
    const vegFamilies = ['brocolis', 'cenoura', 'couve', 'abobrinha', 'berinjela', 'espinafre']
    if (vegFamilies.includes(familyKey) && familyKeysInMeal.has(familyKey)) {
      return false
    }
  }

  return true
}

export function isCompatibleWithDayMenu(
  item: EatWellCatalogItem,
  usedDayFamilyKeys: Set<string>,
) {
  const familyKey = getFoodFamilyKey(item)
  if (!usedDayFamilyKeys.has(familyKey)) return true
  return isDayRepeatableFamily(familyKey)
}

export function findDuplicateDayFamilyKeys(items: EatWellCatalogItem[]) {
  const seen = new Set<string>()
  const duplicates = new Set<string>()

  for (const item of items) {
    const familyKey = getFoodFamilyKey(item)
    if (isDayRepeatableFamily(familyKey)) continue
    if (seen.has(familyKey)) duplicates.add(familyKey)
    seen.add(familyKey)
  }

  return duplicates
}

export function resolvePracticalCompositionTemplate(
  base: CompositionTemplate | undefined,
  slot: MealSlot,
): CompositionTemplate | undefined {
  if (!base) return undefined

  if (slot === 'basket') {
    return PRACTICAL_BASKET_TEMPLATE
  }

  if (slot === 'breakfast') {
    return {
      ...base,
      min_items: Math.max(base.min_items, 3),
      required_roles: base.required_roles.map((role) => {
        if (role.role === 'beverage_unsweetened' || role.role === 'hydration_item') {
          return { ...role, optional: true }
        }
        if (role.role === 'protein' || role.role === 'lean_protein') {
          return { ...role, optional: false }
        }
        return role
      }),
    }
  }

  if (slot === 'morning_snack') {
    return {
      ...base,
      min_items: Math.min(base.min_items, 2),
      max_items: Math.min(base.max_items, 3),
      required_roles: base.required_roles
        .filter((role) => role.role !== 'complex_carbohydrate' && role.role !== 'whole_grain')
        .map((role) =>
          role.role === 'training_carbohydrate'
            ? { ...role, role: 'fiber_booster', count: 1, optional: true }
            : role,
        ),
    }
  }

  if (slot === 'afternoon_snack') {
    return {
      ...base,
      max_items: Math.min(base.max_items, 3),
      required_roles: base.required_roles.map((role) => {
        if (role.role !== 'complex_carbohydrate' && role.role !== 'whole_grain') return role
        return { ...role, count: 1, optional: true, calorie_share: 0.2 }
      }),
    }
  }

  if (slot === 'lunch' || slot === 'dinner') {
    return {
      ...base,
      max_items: Math.min(base.max_items, 5),
    }
  }

  return base
}

export function collectMealFamilyKeys(items: EatWellCatalogItem[]) {
  return new Set(items.map((item) => getFoodFamilyKey(item)))
}

export function validateMealFoodSet(foods: EatWellCatalogItem[], slot: MealSlot) {
  const familyKeys = new Set<string>()

  for (const food of foods) {
    if (!isFoodAllowedInSlot(food, slot)) return false
    if (!isCompatibleWithMealSoFar(food, slot, familyKeys)) return false
    familyKeys.add(getFoodFamilyKey(food))
  }

  return true
}

/** Valida composição final da refeição (famílias, mínimo de itens e combinações práticas). */
export function validateMealComposition(
  foods: EatWellCatalogItem[],
  slot: MealSlot,
  template?: Pick<CompositionTemplate, 'min_items'>,
  options?: { strict?: boolean },
) {
  const strict = options?.strict !== false

  if (foods.length === 0) return false
  if (template && foods.length < template.min_items) {
    if (strict) return false
    if (foods.length < Math.max(1, Math.min(template.min_items, 2))) return false
  }
  if (!validateMealFoodSet(foods, slot)) return false

  const familyKeys = collectMealFamilyKeys(foods)
  if (familyKeys.size !== foods.length) return false

  if (slot === 'breakfast' && strict) {
    const hasBread = foods.some(isBreadFamily)
    const companions = foods.filter(
      (food) => isFruitFood(food) || isProteinFood(food) || isDairyFood(food) || isBeverageFood(food),
    )

    if (foods.length === 1) return false
    if (hasBread && companions.length < 1) return false
    if (!hasBread && companions.length < 2) return false
  }

  if (slot === 'morning_snack' || slot === 'afternoon_snack') {
    if (foods.some(isSnackForbiddenFruit)) return false
    if (foods.length === 1 && isBreadFamily(foods[0]!)) return false
  }

  return true
}
