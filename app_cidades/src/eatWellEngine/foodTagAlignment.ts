import { normalizeEatWellText } from './normalizeText'
import type { EatWellCatalogItem } from './types'

/** Tags do catálogo / inferidas que disparam uma tag de restrição clínica. */
export const CONSTRAINT_TAG_CATALOG_MATCH: Record<string, string[]> = {
  lactose: ['contains_lactose'],
  regular_milk: ['contains_lactose'],
  dairy: ['contains_lactose'],
  dairy_unspecified: ['contains_lactose'],
  cream: ['contains_lactose', 'fat_source'],
  condensed_milk: ['contains_lactose', 'added_sugar'],
  fresh_cheese_high_lactose: ['contains_lactose'],
  whey_with_lactose: ['contains_lactose'],
  milk: ['contains_lactose'],
  casein: ['contains_lactose'],
  whey: ['contains_lactose'],
  butter: ['contains_lactose', 'fat_source'],
  cheese: ['contains_lactose'],
  yogurt: ['contains_lactose'],
  gluten: ['contains_gluten'],
  wheat: ['contains_gluten'],
  barley: ['contains_gluten'],
  rye: ['contains_gluten'],
  malt: ['contains_gluten'],
  meat: ['contains_meat', 'processed_meat'],
  beef: ['contains_meat'],
  poultry: ['contains_meat'],
  pork: ['contains_meat'],
  lamb: ['contains_meat'],
  gelatin_animal: ['contains_meat'],
  processed_meat: ['processed_meat'],
  processed_red_meat: ['processed_meat', 'contains_meat'],
  fish: ['fish'],
  seafood: ['seafood', 'fish'],
  shellfish: ['seafood'],
  shrimp: ['seafood'],
  crab: ['seafood'],
  mollusk: ['seafood'],
  egg: ['egg'],
  egg_white: ['egg'],
  egg_yolk: ['egg'],
  mayonnaise_with_egg: ['egg'],
  soy: ['soy'],
  soy_protein: ['soy'],
  tofu: ['soy'],
  soy_sauce: ['soy', 'high_sodium'],
  soy_milk: ['soy'],
  peanut: ['peanut'],
  peanut_butter: ['peanut'],
  peanut_oil: ['peanut'],
  tree_nut: ['tree_nut'],
  cashew: ['tree_nut'],
  brazil_nut: ['tree_nut'],
  almond: ['tree_nut'],
  walnut: ['tree_nut'],
  hazelnut: ['tree_nut'],
  pistachio: ['tree_nut'],
  high_sugar: ['high_sugar', 'sugary', 'added_sugar'],
  sugary: ['sugary', 'high_sugar', 'added_sugar'],
  added_sugar_high: ['added_sugar', 'high_sugar', 'sugary'],
  sugary_drink: ['sugary', 'high_sugar', 'added_sugar', 'beverage'],
  sweet_bakery: ['sugary', 'high_sugar', 'added_sugar', 'prepared_food'],
  candy: ['sugary', 'high_sugar', 'added_sugar'],
  dessert: ['sugary', 'high_sugar', 'added_sugar', 'snack'],
  regular_soda: ['sugary', 'high_sugar', 'beverage'],
  syrup: ['added_sugar', 'high_sugar'],
  fruit_juice: ['high_sugar', 'sugary', 'fruit', 'beverage'],
  dried_fruit: ['dried_fruit', 'high_sugar'],
  high_glycemic: ['high_glycemic'],
  refined_carbohydrate: ['high_glycemic'],
  large_starch_portion: ['high_glycemic'],
  white_flour: ['contains_gluten', 'high_glycemic'],
  high_sodium: ['high_sodium'],
  very_high_sodium: ['high_sodium'],
  canned_with_salt: ['high_sodium', 'prepared_food'],
  salty_snack: ['high_sodium', 'snack'],
  ready_to_eat_meal: ['prepared_food', 'prepared_dish', 'high_sodium'],
  instant_noodles: ['prepared_food', 'high_sodium'],
  bouillon_cube: ['high_sodium', 'condiment'],
  soy_sauce_regular: ['soy', 'high_sodium'],
  cheese_high_sodium: ['contains_lactose', 'high_sodium'],
  pickled: ['high_sodium', 'prepared_food'],
  ultraprocessed: ['prepared_food', 'prepared_dish', 'snack', 'processed_meat'],
  packaged_snack: ['snack', 'prepared_food'],
  instant_food: ['prepared_food', 'prepared_dish'],
  deep_fried: ['prepared_food', 'prepared_dish'],
  high_saturated_fat: ['high_saturated_fat', 'fat_source'],
  fatty_meat: ['contains_meat', 'fat_source', 'high_saturated_fat'],
  cream_based: ['contains_lactose', 'fat_source', 'high_saturated_fat'],
  trans_fat: ['hydrogenated_fat'],
  hydrogenated_fat: ['hydrogenated_fat'],
  alcoholic: ['alcoholic'],
  energy_drink: ['caffeinated', 'sugary', 'beverage'],
  caffeinated: ['caffeinated'],
  coffee: ['caffeinated', 'beverage'],
  carbonated: ['beverage'],
  chocolate: ['sugary', 'added_sugar'],
  animal_product: ['contains_meat', 'contains_lactose', 'egg', 'fish'],
  high_fructose: ['high_sugar', 'sugary', 'fruit'],
  high_fructose_sweetener: ['added_sugar', 'high_sugar'],
  honey: ['added_sugar', 'high_sugar'],
  high_fodmap: ['high_fiber', 'contains_lactose', 'contains_gluten'],
  onion: ['condiment'],
  garlic: ['condiment'],
  beans_large_portion: ['high_fiber'],
  milk_lactose: ['contains_lactose'],
  polyol_sweetener: ['added_sugar'],
  extra_large_portion: ['prepared_food'],
  liquid_calories: ['sugary', 'beverage', 'high_sugar'],
  high_energy_density: ['fat_source', 'prepared_food'],
}

/** Tags que satisfazem exigências de priorização clínica. */
export const CONSTRAINT_REQUIRE_CATALOG_MATCH: Record<string, string[]> = {
  minimally_processed: ['high_fiber', 'low_sugar', 'low_sodium'],
  whole_food: ['high_fiber', 'fruit', 'low_sugar'],
  high_fiber: ['high_fiber'],
  soluble_fiber: ['high_fiber'],
  fruit: ['fruit', 'dried_fruit'],
  vegetable: ['high_fiber', 'low_sodium'],
  non_starchy_vegetable: ['high_fiber', 'low_sodium', 'low_glycemic'],
  cooked_vegetable: ['high_fiber', 'low_sodium'],
  lean_protein: ['high_protein'],
  protein_source: ['high_protein', 'contains_meat', 'fish', 'egg', 'soy'],
  protein_main: ['high_protein', 'contains_meat', 'fish', 'egg'],
  protein_each_main_meal: ['high_protein'],
  legume: ['high_fiber', 'high_protein'],
  whole_grain: ['high_fiber', 'low_glycemic'],
  whole_grain_or_legume: ['high_fiber', 'low_glycemic'],
  low_glycemic_load: ['low_glycemic'],
  low_glycemic_fruit: ['fruit', 'low_glycemic'],
  low_added_sugar: ['low_sugar'],
  low_sodium: ['low_sodium'],
  low_fat: ['low_carb'],
  low_fat_dairy_or_equivalent: ['lactose_free', 'high_protein'],
  lactose_free: ['lactose_free'],
  naturally_gluten_free: ['gluten_free'],
  certified_gluten_free: ['gluten_free'],
  dairy_free: ['lactose_free'],
  egg_free: [],
  soy_free: [],
  peanut_free: [],
  tree_nut_free: [],
  seafood_free: [],
  fish_free: [],
  vegan: ['vegan'],
  vegetarian: ['vegetarian', 'vegan'],
  plant_protein: ['soy', 'high_protein', 'high_fiber'],
  iron_source: ['high_protein', 'contains_meat'],
  iron_source_plant: ['high_fiber', 'high_protein'],
  folate_source: ['high_fiber', 'fruit'],
  calcium_source: ['contains_lactose', 'lactose_free', 'high_protein'],
  calcium_source_if_possible: ['lactose_free', 'high_protein'],
  potassium_source: ['fruit', 'high_fiber', 'low_sodium'],
  unsaturated_fat: ['fat_source'],
  omega_3_source: ['fish', 'seed'],
  hydration_item: ['beverage', 'zero_calorie'],
  mild_flavor: ['low_sodium'],
  low_acidity: ['low_sugar'],
  simple_preparation: ['low_sodium'],
  high_satiety: ['high_protein', 'high_fiber'],
  low_energy_density: ['high_fiber', 'fruit', 'low_sugar'],
  healthy_fat: ['fat_source', 'seed'],
  home_style: ['high_fiber', 'low_sugar'],
  fresh_food: ['fruit', 'high_fiber'],
  staple_food: ['high_fiber', 'high_protein'],
  low_carb: ['low_carb'],
  low_sugar: ['low_sugar'],
  pescatarian: ['fish'],
  fish_or_plant_protein: ['fish', 'soy', 'high_protein'],
  fish_or_plant_omega_3: ['fish', 'seed'],
  alternative_protein: ['high_protein', 'soy', 'egg'],
  olive_oil: ['fat_source'],
  b12_attention: ['high_protein'],
  iodine_aware: ['fish', 'high_protein', 'low_sodium'],
  leafy_green: ['high_fiber', 'low_sodium'],
  low_fodmap_option: ['low_sugar', 'low_sodium', 'gluten_free', 'lactose_free'],
  vitamin_c_pairing: ['fruit', 'high_fiber'],
  vitamin_d_source: ['fish', 'egg', 'high_protein'],
  soft_drink_phosphoric: ['sugary', 'beverage'],
}

const GLUTEN_EXCLUDE_SAFE = new Set(['gluten', 'wheat', 'barley', 'rye', 'malt', 'cross_contamination_gluten_risk'])
const LACTOSE_EXCLUDE_SAFE = new Set([
  'lactose',
  'regular_milk',
  'dairy',
  'dairy_unspecified',
  'cream',
  'condensed_milk',
  'fresh_cheese_high_lactose',
  'milk',
  'casein',
  'whey',
  'butter',
  'cheese',
  'yogurt',
  'milk_lactose',
])

function includesAny(name: string, tokens: string[]) {
  return tokens.some((token) => name.includes(normalizeEatWellText(token)))
}

function inferTagsFromItem(item: EatWellCatalogItem) {
  const name = normalizeEatWellText(item.name)
  const inferred: string[] = []

  if (
    includesAny(name, ['leite', 'iogurte', 'queijo', 'requeijao', 'requeijão', 'manteiga', 'nata', 'creme de leite']) &&
    !includesAny(name, ['sem lactose', 'lactose free', 'zero lactose', 'vegetal', 'de soja', 'de amendoim'])
  ) {
    inferred.push('contains_lactose')
  }

  if (includesAny(name, ['ovo', 'omelete', 'omeleta'])) inferred.push('egg')
  if (includesAny(name, ['frit', 'empanad', 'fritura'])) inferred.push('deep_fried', 'prepared_food')
  if (includesAny(name, ['doce', 'bolo', 'sobremesa', 'brigadeiro', 'pudim', 'sorvete'])) {
    inferred.push('dessert', 'added_sugar', 'high_sugar')
  }
  if (includesAny(name, ['refrigerante', 'suco de caixinha', 'nectar', 'néctar'])) {
    inferred.push('sugary_drink', 'high_sugar')
  }
  if (includesAny(name, ['cafe', 'café', 'expresso', 'coado'])) inferred.push('caffeinated', 'beverage')
  if (includesAny(name, ['cerveja', 'vinho', 'vodka', 'cachaça', 'cachaca', 'drink alcool'])) {
    inferred.push('alcoholic')
  }
  if (includesAny(name, ['feijao', 'feijão', 'lentilha', 'grao de bico', 'grão de bico', 'ervilha'])) {
    inferred.push('legume', 'high_fiber', 'iron_source')
  }
  if (includesAny(name, ['espinafre', 'carne', 'figado', 'fígado', 'sardinha'])) inferred.push('iron_source')
  if (includesAny(name, ['iogurte', 'queijo', 'leite', 'brocolis', 'couve'])) inferred.push('calcium_source')
  if (includesAny(name, ['pao', 'pão', 'macarrao', 'macarrão', 'torrada']) && !includesAny(name, ['integral', 'sem gluten', 'sem glúten'])) {
    inferred.push('contains_gluten')
  }
  if (includesAny(name, ['pao', 'pão', 'torrada', 'bolacha', 'biscoito']) && includesAny(name, ['integral', 'centeio', 'aveia'])) {
    inferred.push('whole_grain')
  }
  if (includesAny(name, ['presunto', 'salame', 'linguica', 'linguiça', 'salsicha', 'bacon', 'mortadela'])) {
    inferred.push('processed_meat', 'high_sodium')
  }
  if (includesAny(name, ['amendoim', 'pasta de amendoim'])) inferred.push('peanut')
  if (includesAny(name, ['castanha', 'noz', 'amendoa', 'amêndoa', 'macadamia'])) inferred.push('tree_nut')
  if (includesAny(name, ['camarao', 'camarão', 'lula', 'polvo', 'marisco'])) inferred.push('seafood')
  if (includesAny(name, ['mel', 'xarope', 'melaço', 'melaco'])) inferred.push('high_fructose', 'added_sugar')
  if (includesAny(name, ['maca', 'maçã', 'pera', 'manga em calda'])) inferred.push('high_fructose', 'fruit')
  if (item.category === 'fruits' || item.meal_roles.some((role) => role.includes('fruit'))) inferred.push('fruit')
  if (item.meal_roles.some((role) => role.includes('vegetable'))) inferred.push('vegetable', 'high_fiber')
  if (item.meal_roles.some((role) => role.includes('protein'))) inferred.push('high_protein')
  if (item.category === 'beverages' || item.meal_roles.includes('beverage')) inferred.push('beverage')

  return inferred
}

export function resolveEffectiveFoodTags(item: EatWellCatalogItem) {
  const tags = new Set<string>([...item.tags, ...inferTagsFromItem(item)])

  if (item.meal_roles.some((role) => role.includes('protein'))) tags.add('high_protein')
  if (item.meal_roles.some((role) => role.includes('fruit'))) tags.add('fruit')
  if (item.meal_roles.some((role) => role.includes('vegetable'))) tags.add('vegetable')
  if (item.tags.includes('gluten_free')) tags.add('naturally_gluten_free')
  if (item.tags.includes('lactose_free')) tags.add('lactose_free')

  return tags
}

function catalogTagsMatchConstraint(
  effectiveTags: Set<string>,
  constraintTag: string,
  map: Record<string, string[]>,
) {
  const candidates = map[constraintTag] ?? [constraintTag]
  return candidates.some((tag) => effectiveTags.has(tag))
}

function isExcludeSafeForItem(effectiveTags: Set<string>, excludeTag: string) {
  if (GLUTEN_EXCLUDE_SAFE.has(excludeTag)) {
    if (effectiveTags.has('gluten_free') && !effectiveTags.has('contains_gluten')) return true
  }
  if (LACTOSE_EXCLUDE_SAFE.has(excludeTag)) {
    if (effectiveTags.has('lactose_free') && !effectiveTags.has('contains_lactose')) return true
  }
  return false
}

export function foodViolatesExcludeTag(
  item: EatWellCatalogItem,
  excludeTag: string,
  effectiveTags = resolveEffectiveFoodTags(item),
) {
  if (isExcludeSafeForItem(effectiveTags, excludeTag)) return false
  return catalogTagsMatchConstraint(effectiveTags, excludeTag, CONSTRAINT_TAG_CATALOG_MATCH)
}

export function foodMatchesRequireTag(
  item: EatWellCatalogItem,
  requireTag: string,
  effectiveTags = resolveEffectiveFoodTags(item),
) {
  if (catalogTagsMatchConstraint(effectiveTags, requireTag, CONSTRAINT_REQUIRE_CATALOG_MATCH)) {
    return true
  }

  const name = normalizeEatWellText(item.name)
  if (requireTag === 'legume' && includesAny(name, ['feijao', 'feijão', 'lentilha', 'grao de bico', 'grão de bico'])) {
    return true
  }
  if (requireTag === 'iron_source' && includesAny(name, ['feijao', 'feijão', 'carne', 'figado', 'fígado', 'espinafre', 'sardinha'])) {
    return true
  }
  if (requireTag === 'calcium_source' && includesAny(name, ['leite', 'iogurte', 'queijo', 'brocolis', 'brócolis', 'couve'])) {
    return true
  }
  if (requireTag === 'egg_free' && !effectiveTags.has('egg')) return true
  if (requireTag === 'soy_free' && !effectiveTags.has('soy')) return true
  if (requireTag === 'peanut_free' && !effectiveTags.has('peanut')) return true
  if (requireTag === 'tree_nut_free' && !effectiveTags.has('tree_nut')) return true
  if (requireTag === 'seafood_free' && !effectiveTags.has('seafood') && !effectiveTags.has('fish')) return true
  if (requireTag === 'fish_free' && !effectiveTags.has('fish')) return true
  if (requireTag === 'low_fodmap_option') {
    return (
      !effectiveTags.has('contains_lactose') &&
      !effectiveTags.has('contains_gluten') &&
      !includesAny(name, ['cebola', 'alho', 'feijao', 'feijão'])
    )
  }

  return false
}

export function foodMatchesPenalizeTag(
  item: EatWellCatalogItem,
  penalizeTag: string,
  effectiveTags = resolveEffectiveFoodTags(item),
) {
  return catalogTagsMatchConstraint(effectiveTags, penalizeTag, CONSTRAINT_TAG_CATALOG_MATCH)
}

export function getDailyLimitTagsForFood(
  item: EatWellCatalogItem,
  maxPerDay: Record<string, number>,
) {
  const effectiveTags = resolveEffectiveFoodTags(item)
  const matched: string[] = []

  for (const limitTag of Object.keys(maxPerDay)) {
    if (foodViolatesExcludeTag(item, limitTag, effectiveTags) || foodMatchesPenalizeTag(item, limitTag, effectiveTags)) {
      matched.push(limitTag)
    }
  }

  return matched
}
