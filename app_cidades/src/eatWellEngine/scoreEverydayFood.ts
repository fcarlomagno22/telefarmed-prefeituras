import type { MealSlot } from '../types/eatWell'
import type { EatWellCatalogItem } from './types'
import { normalizeEatWellText } from './normalizeText'

const EXOTIC_OR_OBSCURE_KEYWORDS = [
  'pitanga',
  'caja',
  'cajá',
  'araca',
  'araçá',
  'guandu',
  'graviola',
  'cupuacu',
  'cupuaçu',
  'jabuticaba',
  'sapoti',
  'umbu',
  'murici',
  'bacuri',
  'cambuci',
  'jenipapo',
  'carambola',
  'fruta-do-conde',
  'pinha',
  'pequi',
  'buriti',
  'camu camu',
  'cacau polpa',
  'polpa de cacau',
  'cacau fruta',
  'fruta do cacau',
  'linguado',
  'robalo',
  'pescada',
  'namorado',
  'corvina',
  'dourado',
]

const IMPRACTICAL_KEYWORDS = [
  'fecula',
  'preparado com agua',
  'mingau em agua',
  'cru limpo',
  'cru sem pele',
  'cru sem osso',
  'cru em cubos',
  'cru em fil',
  'cru em file',
  'cru em posta',
  'cru em tiras',
  'cru em pedacos',
  'cru em pedaços',
  'cru fatiado',
  'cru picado',
  'cru mo',
  'cru moid',
  'cru desfiado',
]

const EVERYDAY_BOOST_KEYWORDS = [
  'arroz branco cozido',
  'arroz integral cozido',
  'arroz cozido',
  'feijao carioca cozido',
  'feijão carioca cozido',
  'feijao preto cozido',
  'feijão preto cozido',
  'frango grelhado',
  'peito de frango',
  'carne bovina',
  'patinho',
  'tilapia grelhad',
  'tilápia grelhad',
  'sardinha',
  'ovo cozido',
  'omelete',
  'ovo mexido',
  'pao frances',
  'pão francês',
  'pao integral',
  'pão integral',
  'banana in natura',
  'maca in natura',
  'maçã in natura',
  'mamao in natura',
  'mamão in natura',
  'iogurte natural',
  'leite desnatado',
  'aveia em flocos',
  'cafe com leite',
  'café com leite',
  'cafe sem acucar',
  'café sem açúcar',
  'tapioca',
  'cuscuz',
  'mandioca cozida',
  'batata cozida',
  'batata doce cozida',
  'salada de alface',
  'alface e tomate',
  'couve refogada',
  'brocolis cozido',
  'brócolis cozido',
  'cenoura cozida',
  'macarrao cozido',
  'macarrão cozido',
  'farofa',
  'queijo branco',
  'presunto',
  'melancia in natura',
  'laranja in natura',
  'abacate in natura',
]

const PREPARED_PROTEIN_KEYWORDS = [
  'grelhad',
  'cozid',
  'assad',
  'refogad',
  'frit',
  'omelete',
  'mexid',
  'desfiad',
  'ensopad',
  'no vapor',
  'sopa de',
]

const FRUIT_WEIRD_PREPARATIONS = [
  'grelhad',
  'assad',
  'compota',
  'desidrat',
  'polpa congelada',
  'amassad',
  'pure',
  'purê',
  'cozida sem acucar',
  'cozida sem açúcar',
  'salada de fruta',
]

const BREAKFAST_FORBIDDEN_KEYWORDS = [
  'salada',
  'feijao',
  'feijão',
  'guandu',
  'arroz',
  'macarrao',
  'macarrão',
  'fecula',
  'peixe',
  'carne bovina',
  'frango',
]

const RAW_TOKEN_PATTERN = /\bcru\b|\bcrua\b|\bcrus\b|\bcruas\b/

function includesKeyword(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(normalizeEatWellText(keyword)))
}

function hasWeirdFruitPreparation(name: string, category: string) {
  if (category !== 'fruits') return false

  const normalized = normalizeEatWellText(name)
  if (normalized.includes('in natura')) return false

  return FRUIT_WEIRD_PREPARATIONS.some((prep) => normalized.includes(normalizeEatWellText(prep)))
}

function isAnimalProteinItem(item: EatWellCatalogItem) {
  return (
    item.tags.includes('fish') ||
    item.tags.includes('contains_meat') ||
    item.tags.includes('egg') ||
    (item.meal_roles.includes('protein_main') &&
      (item.category === 'meats' ||
        item.subcategory?.includes('peix') ||
        item.subcategory?.includes('frango') ||
        item.subcategory?.includes('carne') ||
        item.subcategory?.includes('ovo')))
  )
}

function isRawOrUnpreparedProtein(item: EatWellCatalogItem, slot?: MealSlot) {
  const name = normalizeEatWellText(item.name)

  if (item.category === 'fruits' || item.category === 'vegetables') return false

  if (item.category === 'legumes') {
    if (RAW_TOKEN_PATTERN.test(name) && name.includes('seco')) {
      return slot !== 'basket'
    }
    if (RAW_TOKEN_PATTERN.test(name) && slot && slot !== 'basket') {
      return !name.includes('cozid') && !name.includes('refogad')
    }
    return false
  }

  if (!isAnimalProteinItem(item)) return false

  if (RAW_TOKEN_PATTERN.test(name)) return true

  if (!slot || slot === 'basket') return false

  const hasPreparedForm = PREPARED_PROTEIN_KEYWORDS.some((keyword) =>
    name.includes(normalizeEatWellText(keyword)),
  )
  const isSimpleReadyItem =
    name.includes('ovo coz') ||
    name.includes('iogurte') ||
    name.includes('queijo') ||
    name.includes('leite') ||
    name.includes('presunto')

  return !hasPreparedForm && !isSimpleReadyItem
}

export function isPracticalEverydayFood(item: EatWellCatalogItem, slot?: MealSlot) {
  if (item.meal_roles.includes('beverage') && item.category === 'beverages') return true
  return scoreEverydayFood(item, slot) >= 8
}

export function isRelaxedEverydayFood(item: EatWellCatalogItem, slot?: MealSlot) {
  if (item.meal_roles.includes('beverage') && item.category === 'beverages') return true
  return scoreEverydayFood(item, slot) >= 0
}

export function isEverydayPoolMember(item: EatWellCatalogItem) {
  return scoreEverydayFood(item) >= 8
}

/** Pontua alimentos comuns e práticos do dia a dia. Retorna -Infinity para candidatos inviáveis. */
export function scoreEverydayFood(item: EatWellCatalogItem, slot?: MealSlot): number {
  const name = normalizeEatWellText(item.name)
  let score = 0

  if (includesKeyword(name, EXOTIC_OR_OBSCURE_KEYWORDS)) return -Infinity
  if (includesKeyword(name, IMPRACTICAL_KEYWORDS)) return -Infinity
  if (name.includes('empanad')) return -Infinity
  if (hasWeirdFruitPreparation(item.name, item.category)) return -Infinity
  if (isRawOrUnpreparedProtein(item, slot)) return -Infinity
  if (name.includes('derretid')) return -Infinity
  if (name.includes('margarina') && !name.includes('pao') && !name.includes('pão')) return -Infinity

  if (slot === 'breakfast') {
    if (includesKeyword(name, BREAKFAST_FORBIDDEN_KEYWORDS)) return -Infinity
    if (item.meal_roles.includes('vegetable') && !item.meal_roles.includes('fruit')) return -Infinity
    if (item.category === 'legumes') return -Infinity
    if (isAnimalProteinItem(item) && !name.includes('ovo') && !name.includes('queijo') && !name.includes('presunto')) {
      return -Infinity
    }
  }

  if (slot === 'morning_snack' || slot === 'afternoon_snack') {
    if (name.includes('cacau') && !name.includes('achocolat') && !name.includes('com cacau')) {
      return -Infinity
    }
    if (item.meal_roles.includes('vegetable') && !item.meal_roles.includes('fruit')) return -Infinity
    if (name.includes('salada') && !name.includes('fruta')) return -Infinity
    if (isAnimalProteinItem(item) && !name.includes('ovo') && !name.includes('iogurte') && !name.includes('queijo')) {
      return -Infinity
    }
    if (
      name.includes('arroz') ||
      name.includes('cuscuz') ||
      name.includes('feijao') ||
      name.includes('feijão') ||
      name.includes('macarrao') ||
      name.includes('macarrão') ||
      name.includes('farofa') ||
      name.includes('mandioca') ||
      name.includes('goma de tapioca')
    ) {
      return -Infinity
    }
    if (name.includes('brocolis') || name.includes('brócolis')) return -Infinity
  }

  if (slot === 'basket') {
    if (
      name.includes('arroz') ||
      name.includes('feijao') ||
      name.includes('feijão') ||
      name.includes('cuscuz') ||
      name.includes('macarrao') ||
      name.includes('macarrão') ||
      name.includes('pao ') ||
      name.includes('pão ') ||
      name.includes('pao de') ||
      name.includes('pão de') ||
      name.includes('sem miolo') ||
      name.includes('goma de tapioca') ||
      name.includes('frango') ||
      name.includes('carne bovina') ||
      name.includes('peixe')
    ) {
      return -Infinity
    }
    if (isAnimalProteinItem(item)) return -Infinity
  }

  if (item.category === 'fruits' && name.includes('in natura')) score += 28

  for (const keyword of EVERYDAY_BOOST_KEYWORDS) {
    if (name.includes(normalizeEatWellText(keyword))) {
      score += 18
      break
    }
  }

  if (item.tags.includes('minimally_processed')) score += 8
  if (item.tags.includes('home_style')) score += 8
  if (item.tags.includes('staple_food')) score += 12

  const wordCount = item.name.split(/\s+/).length
  if (wordCount > 5) score -= 16
  if (wordCount > 7) score -= 24

  if (name.includes('cru seco') && slot !== 'basket') return -Infinity

  return score
}
