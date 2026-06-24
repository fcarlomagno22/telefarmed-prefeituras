/**
 * Corrige referências de food_id nos JSONs do Comer Bem e gera arquivos faltantes.
 * Uso: node scripts/fixEatWellFoodAssets.js
 */
const fs = require('fs')
const path = require('path')

const FOODS_DIR = path.join(__dirname, '../assets/foods')

function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function loadCatalog() {
  const catalog = new Map()
  const byNormName = new Map()
  const byNormAlias = new Map()
  const ids = []

  for (const file of fs
    .readdirSync(FOODS_DIR)
    .filter((name) => name.startsWith('food_database_lote_'))) {
    const data = JSON.parse(fs.readFileSync(path.join(FOODS_DIR, file), 'utf8'))
    for (const item of data.items ?? []) {
      catalog.set(item.id, item)
      ids.push(item.id)
      const normName = normalizeText(item.name)
      if (!byNormName.has(normName)) byNormName.set(normName, item.id)
      for (const alias of item.aliases ?? []) {
        const normAlias = normalizeText(alias)
        if (!byNormAlias.has(normAlias)) byNormAlias.set(normAlias, item.id)
      }
    }
  }

  return { catalog, byNormName, byNormAlias, ids }
}

function loadBeverages() {
  const beverages = new Map()
  const byNormName = new Map()
  const byNormAlias = new Map()
  const data = JSON.parse(fs.readFileSync(path.join(FOODS_DIR, 'beverage_catalog.json'), 'utf8'))
  for (const item of data.beverages ?? []) {
    beverages.set(item.id, item)
    const normName = normalizeText(item.name)
    if (!byNormName.has(normName)) byNormName.set(normName, item.id)
    for (const alias of item.aliases ?? []) {
      const normAlias = normalizeText(alias)
      if (!byNormAlias.has(normAlias)) byNormAlias.set(normAlias, item.id)
    }
  }
  return { beverages, byNormName, byNormAlias }
}

const LEGACY_ID_MAP = {
  bev_cafe_sem_acucar: 'bev_cafe_coado_sem_acucar',
  bev_cha_sem_acucar: 'bev_cha_preto_sem_acucar',
  bev_leite_desnatado: 'bev_leite_desnatado',
  food_abacate: 'food-abacate-in-natura',
  food_abobora: 'food-abobora-moranga-cru',
  food_abobora_cozida: 'food-abobora-moranga-cozido-sem-sal',
  food_abobrinha: 'food-abobrinha-italiana-cru',
  food_abobrinha_refogada: 'food-abobrinha-italiana-refogado-com-alho-e-oleo',
  food_alface: 'food-alface-crespa-cru',
  food_arroz_branco_cozido: 'food-arroz-branco-tipo-1-cozido-sem-sal',
  food_arroz_branco_cru: 'food-arroz-branco-tipo-1-cru',
  food_arroz_integral_cozido: 'food-arroz-integral-agulhinha-cozido-sem-sal',
  food_arroz_integral_cru: 'food-arroz-integral-agulhinha-cru',
  food_aveia_flocos: 'food-aveia-em-flocos-finos-seco',
  food_azeite_oliva: 'food-azeite-de-oliva-extra-virgem-cru-para-salada',
  food_banana: 'food-banana-prata-in-natura',
  food_batata_doce: 'food-batata-doce-cru',
  food_batata_doce_cozida: 'food-batata-doce-cozido-sem-sal',
  food_beterraba_cozida: 'food-beterraba-cozido-sem-sal',
  food_brocolis: 'food-brocolis-cru',
  food_brocolis_cozido: 'food-brocolis-cozido-sem-sal',
  food_castanha_caju: 'food-castanha-de-caju-torrada-sem-sal',
  food_cenoura: 'food-cenoura-cru',
  food_cenoura_cozida: 'food-cenoura-cozido-sem-sal',
  food_chia: 'food-chia-crua-sem-sal',
  food_couve: 'food-couve-manteiga-cru',
  food_couve_refogada: 'food-couve-manteiga-refogado-com-alho-e-oleo',
  food_crepioca: 'food-beiju-de-tapioca-simples-porcao-simples',
  food_cuscuz_milho: 'food-cuscuz-de-milho-cozido-porcao-simples',
  food_feijao_carioca_cozido: 'food-feijao-carioca-cozido-sem-sal-com-caldo',
  food_feijao_carioca_cru: 'food-feijao-carioca-cru-seco',
  food_feijao_preto_cozido: 'food-feijao-preto-cozido-sem-sal-com-caldo',
  food_feijao_preto_cru: 'food-feijao-preto-cru-seco',
  food_frango_desfiado: 'food-ave-peito-de-frango-sem-pele-desfiado-ao-molho',
  food_frango_grelhado: 'food-ave-peito-de-frango-sem-pele-grelhado-sem-oleo',
  food_frango_peito_cru: 'food-ave-peito-de-frango-sem-pele-cru-limpo',
  food_grao_de_bico: 'food-grao-de-bico-cozido-sem-sal-com-caldo',
  food_grao_de_bico_cru: 'food-grao-de-bico-cru-seco',
  food_iogurte_natural: 'food-iogurte-natural-integral-natural',
  food_laranja: 'food-laranja-pera-in-natura',
  food_lentilha_cozida: 'food-lentilha-marrom-cozido-sem-sal-com-caldo',
  food_lentilha_crua: 'food-lentilha-marrom-cru-seco',
  food_maca: 'food-maca-fuji-in-natura',
  food_mamao: 'food-mamao-papaia-in-natura',
  food_mandioca_cozida: 'food-mandioca-cozido-sem-sal',
  food_mandioquinha: 'food-mandioquinha-cru',
  food_melancia: 'food-melancia-in-natura',
  food_omelete_legumes: 'food-ovo-de-galinha-inteiro-omelete-com-queijo',
  food_ovo: 'food-ovo-de-galinha-inteiro-cru',
  food_ovo_cozido: 'food-ovo-de-galinha-inteiro-cozido',
  food_ovo_mexido: 'food-ovo-mexido-base-cozido',
  food_pao_integral: 'food-pao-de-forma-integral',
  food_patinho_desfiado: 'food-carne-bovina-patinho-cozido-sem-sal',
  food_patinho_moido: 'food-carne-bovina-patinho-cru-limpo',
  food_peixe_assado: 'food-peixe-tilapia-assado-com-azeite',
  food_peixe_fresco: 'food-peixe-tilapia-cru-limpo',
  food_peixe_grelhado: 'food-peixe-tilapia-grelhado-sem-oleo',
  food_queijo_branco: 'food-queijo-minas-frescal-fatia-tradicional',
  food_salada_folhas: 'food-alface-crespa-salada-temperada',
  food_sopa_legumes: 'food-sopa-de-legumes-caseiro',
  food_tapioca: 'food-beiju-de-tapioca-simples-porcao-simples',
  food_tempero_natural_sem_sal: 'food-cebolinha-fresca-cru',
  food_tomate: 'food-tomate-cru',
}

function resolveLegacyId(legacyId, catalog, beverages, byNormName, byNormAlias, beverageByName) {
  if (LEGACY_ID_MAP[legacyId]) return LEGACY_ID_MAP[legacyId]
  if (catalog.has(legacyId)) return legacyId
  if (beverages.has(legacyId)) return legacyId

  const kebab = legacyId.replace(/^(food_|bev_)/, '').replace(/_/g, '-')
  const foodCandidate = `food-${kebab}`
  if (catalog.has(foodCandidate)) return foodCandidate
  const bevCandidate = `bev_${legacyId.replace(/^bev_/, '')}`
  if (beverages.has(bevCandidate)) return bevCandidate

  const words = normalizeText(legacyId.replace(/^(food_|bev_)/, '').replace(/_/g, ' '))
  if (byNormName.has(words)) return byNormName.get(words)
  if (byNormAlias.has(words)) return byNormAlias.get(words)
  if (beverageByName.has(words)) return beverageByName.get(words)

  let bestId = null
  let bestScore = 0
  for (const id of catalog.keys()) {
    const slug = normalizeText(id.replace(/^food-/, '').replace(/-/g, ' '))
    if (slug.includes(words) || words.includes(slug)) {
      const score = Math.min(slug.length, words.length)
      if (score > bestScore) {
        bestScore = score
        bestId = id
      }
    }
  }
  return bestId
}

function fixArchetypes(catalog, beverages, byNormName, byNormAlias, beverageByName) {
  const filePath = path.join(FOODS_DIR, 'meal_plan_archetypes.json')
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  const unresolved = new Set()

  for (const archetype of data.archetypes ?? []) {
    archetype.food_ids = archetype.food_ids.map((legacyId) => {
      const resolved = resolveLegacyId(
        legacyId,
        catalog,
        beverages,
        byNormName,
        byNormAlias,
        beverageByName,
      )
      if (!resolved || (!catalog.has(resolved) && !beverages.has(resolved))) {
        unresolved.add(legacyId)
        return legacyId
      }
      return resolved
    })
  }

  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  return unresolved
}

function fixSynonyms(catalog, beverages, byNormName, byNormAlias, beverageByName) {
  const filePath = path.join(FOODS_DIR, 'food_search_synonyms.json')
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  let resolvedBySynonym = 0
  let resolvedByLegacy = 0
  let unresolved = 0
  const seen = new Map()

  for (const entry of data.entries ?? []) {
    const normSynonym = normalizeText(entry.synonym)
    let foodId = null

    if (byNormName.has(normSynonym)) {
      foodId = byNormName.get(normSynonym)
      resolvedBySynonym += 1
    } else if (byNormAlias.has(normSynonym)) {
      foodId = byNormAlias.get(normSynonym)
      resolvedBySynonym += 1
    } else if (beverageByName.has(normSynonym)) {
      foodId = beverageByName.get(normSynonym)
      resolvedBySynonym += 1
    } else {
      foodId = resolveLegacyId(
        entry.food_id,
        catalog,
        beverages,
        byNormName,
        byNormAlias,
        beverageByName,
      )
      if (foodId) resolvedByLegacy += 1
    }

    if (!foodId || (!catalog.has(foodId) && !beverages.has(foodId))) {
      unresolved += 1
      continue
    }

    entry.food_id = foodId
    const dedupeKey = `${normSynonym}::${foodId}`
    if (!seen.has(dedupeKey)) {
      seen.set(dedupeKey, entry)
    }
  }

  data.entries = [...seen.values()]

  for (const item of catalog.values()) {
    const normName = normalizeText(item.name)
    const dedupeKey = `${normName}::${item.id}`
    if (!seen.has(dedupeKey)) {
      seen.set(dedupeKey, { synonym: item.name, food_id: item.id, group: 'catalog.name' })
    }
    for (const alias of item.aliases ?? []) {
      const normAlias = normalizeText(alias)
      const aliasKey = `${normAlias}::${item.id}`
      if (!seen.has(aliasKey)) {
        seen.set(aliasKey, { synonym: alias, food_id: item.id, group: 'catalog.alias' })
      }
    }
  }

  for (const item of beverages.values()) {
    const normName = normalizeText(item.name)
    const dedupeKey = `${normName}::${item.id}`
    if (!seen.has(dedupeKey)) {
      seen.set(dedupeKey, { synonym: item.name, food_id: item.id, group: 'beverage.name' })
    }
  }

  data.entries = [...seen.values()]
  data.entry_count = data.entries.length
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  return { resolvedBySynonym, resolvedByLegacy, unresolved, total: data.entries.length }
}

function writeManifest() {
  const lots = fs
    .readdirSync(FOODS_DIR)
    .filter((name) => name.startsWith('food_database_lote_'))
    .sort()

  const chunks = lots.map((file) => {
    const data = JSON.parse(fs.readFileSync(path.join(FOODS_DIR, file), 'utf8'))
    return {
      file,
      lot: data.metadata?.lot ?? file,
      scope: data.metadata?.scope ?? '',
      total: data.items?.length ?? 0,
    }
  })

  const manifest = {
    version: '1.0.0',
    locale: 'pt-BR',
    total_items: chunks.reduce((sum, chunk) => sum + chunk.total, 0),
    chunks,
    engine_files: [
      'beverage_catalog.json',
      'dietary_constraints.json',
      'food_search_synonyms.json',
      'food_substitution_rules.json',
      'insight_templates.json',
      'meal_composition_templates.json',
      'meal_plan_archetypes.json',
      'menu_generation_rules.json',
      'nutrition_calculation_rules.json',
      'photo_label_mapping.json',
      'portion_units_registry.json',
      'meal_role_mapping.json',
    ],
    generated_at: new Date().toISOString().slice(0, 10),
  }

  fs.writeFileSync(
    path.join(FOODS_DIR, 'food_catalog_manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  )
}

function writeNutritionCalculationRules() {
  const filePath = path.join(FOODS_DIR, 'nutrition_calculation_rules.json')
  if (fs.existsSync(filePath)) return

  const rules = {
    version: '1.0.0',
    locale: 'pt-BR',
    file: 'nutrition_calculation_rules.json',
    engine_mode: 'deterministic',
    runtime_ai_generation: false,
    description:
      'Regras para calcular metas calóricas e de macronutrientes a partir do wizard de cardápio.',
    bmr: {
      formula: 'mifflin_st_jor',
      sex_fallback: 'average',
      male: '10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5',
      female: '10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161',
      average_offset: -78,
      default_age_years: 35,
    },
    activity_multipliers: {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      intense: 1.725,
      very_intense: 1.9,
    },
    objective_adjustments_pct: {
      weight_loss: -15,
      maintain_weight: 0,
      gain_weight: 10,
      hypertrophy: 12,
      metabolic_health: -8,
      diabetes: -10,
      hypertension: -5,
      other: 0,
    },
    macro_splits_pct: {
      weight_loss: { protein: 30, carbs: 40, fat: 30 },
      maintain_weight: { protein: 25, carbs: 45, fat: 30 },
      gain_weight: { protein: 25, carbs: 45, fat: 30 },
      hypertrophy: { protein: 30, carbs: 45, fat: 25 },
      metabolic_health: { protein: 28, carbs: 42, fat: 30 },
      diabetes: { protein: 28, carbs: 40, fat: 32 },
      hypertension: { protein: 25, carbs: 45, fat: 30 },
      other: { protein: 25, carbs: 45, fat: 30 },
    },
    limits: {
      fiber_g_per_1000kcal: 14,
      sugars_max_pct_of_calories: 10,
      saturated_fat_max_pct_of_calories: 10,
      water_ml_per_kg: 35,
      water_ml_minimum: 1800,
      water_ml_maximum: 3500,
    },
    modifiers: {
      hunger_level: { min: 1, max: 10, calorie_adjust_per_point: -15 },
      has_compulsion: { calorie_adjust_pct: -5 },
      sleep_quality_low_threshold: 4,
      sleep_quality_low_calorie_adjust_pct: -3,
      stress_level_high_threshold: 7,
      stress_level_high_calorie_adjust_pct: -2,
    },
  }

  fs.writeFileSync(filePath, `${JSON.stringify(rules, null, 2)}\n`, 'utf8')
}

function writeMealRoleMapping() {
  const filePath = path.join(FOODS_DIR, 'meal_role_mapping.json')
  if (fs.existsSync(filePath)) return

  const mapping = {
    version: '1.0.0',
    locale: 'pt-BR',
    description:
      'Mapeia papéis do meal_composition_templates para filtros do catálogo alimentar.',
    roles: {
      lean_protein: {
        meal_roles: ['protein_main'],
        tags_any: ['high_protein'],
        exclude_tags: ['processed_meat', 'high_saturated_fat'],
      },
      protein: { meal_roles: ['protein_main'], tags_any: ['high_protein', 'egg', 'fish', 'seafood'] },
      plant_protein: {
        meal_roles: ['protein_main'],
        tags_any: ['vegetarian', 'vegan'],
        categories: ['legumes'],
      },
      fruit: { meal_roles: ['fruit'], categories: ['fruits'] },
      low_glycemic_fruit: {
        meal_roles: ['fruit'],
        tags_any: ['low_glycemic'],
        categories: ['fruits'],
      },
      whole_grain: {
        meal_roles: ['carb_base'],
        name_keywords_any: ['integral', 'aveia', 'quinoa', 'centeio'],
      },
      complex_carbohydrate: { meal_roles: ['carb_base'], categories: ['cereals_grains', 'legumes'] },
      low_glycemic_carbohydrate: {
        meal_roles: ['carb_base'],
        tags_any: ['low_glycemic', 'high_fiber'],
      },
      legume: { meal_roles: ['carb_base', 'protein_main'], categories: ['legumes'] },
      vegetable: { meal_roles: ['vegetable'], categories: ['vegetables'] },
      non_starchy_vegetable: {
        meal_roles: ['vegetable'],
        categories: ['vegetables'],
        exclude_tags: ['high_glycemic'],
      },
      cooked_vegetable: { meal_roles: ['vegetable'], categories: ['vegetables'] },
      salad: { meal_roles: ['vegetable'], name_keywords_any: ['salada', 'alface', 'folhas'] },
      healthy_fat: {
        meal_roles: ['fat_source'],
        tags_any: ['tree_nut', 'seed', 'fat_source'],
        categories: ['oils_fats'],
      },
      fiber_booster: {
        tags_any: ['high_fiber'],
        categories: ['legumes', 'cereals_grains', 'fruits', 'vegetables'],
      },
      dairy_or_alternative: { meal_roles: ['dairy'], categories: ['dairy'] },
      lactose_free_dairy_or_alternative: {
        meal_roles: ['dairy'],
        tags_any: ['lactose_free', 'vegan'],
        categories: ['dairy'],
      },
      beverage_unsweetened: {
        meal_roles: ['beverage'],
        tags_any: ['zero_calorie', 'low_sugar'],
        categories: ['beverages'],
      },
      basket_base: { meal_roles: ['carb_base'], suitable_slots: ['basket'] },
      basket_protein: { meal_roles: ['protein_main'], suitable_slots: ['basket'] },
      basket_produce: { meal_roles: ['fruit', 'vegetable'], suitable_slots: ['basket'] },
      basket_snack: { meal_roles: ['snack'], suitable_slots: ['basket'] },
      hydration_item: { meal_roles: ['beverage'], tags_any: ['zero_calorie', 'beverage'] },
    },
  }

  fs.writeFileSync(filePath, `${JSON.stringify(mapping, null, 2)}\n`, 'utf8')
}

function writePhotoLabelMapping(catalog, beverages) {
  const filePath = path.join(FOODS_DIR, 'photo_label_mapping.json')
  if (fs.existsSync(filePath)) return

  const labels = []
  const addLabel = (label, foodId, weight = 1) => {
    labels.push({ label: normalizeText(label), candidates: [{ food_id: foodId, weight }] })
  }

  for (const item of catalog.values()) {
    addLabel(item.name, item.id, 1)
    for (const alias of (item.aliases ?? []).slice(0, 2)) {
      addLabel(alias, item.id, 0.85)
    }
  }

  for (const item of beverages.values()) {
    addLabel(item.name, item.id, 1)
  }

  const grouped = new Map()
  for (const entry of labels) {
    if (!grouped.has(entry.label)) grouped.set(entry.label, new Map())
    const bucket = grouped.get(entry.label)
    for (const candidate of entry.candidates) {
      bucket.set(
        candidate.food_id,
        Math.max(bucket.get(candidate.food_id) ?? 0, candidate.weight),
      )
    }
  }

  const mapping = {
    version: '1.0.0',
    locale: 'pt-BR',
    description: 'Mapeamento determinístico de labels de visão para food_ids do catálogo.',
    label_count: grouped.size,
    labels: [...grouped.entries()].slice(0, 3000).map(([label, candidatesMap]) => ({
      label,
      candidates: [...candidatesMap.entries()].map(([food_id, weight]) => ({ food_id, weight })),
    })),
  }

  fs.writeFileSync(filePath, `${JSON.stringify(mapping, null, 2)}\n`, 'utf8')
}

function main() {
  const { catalog, byNormName, byNormAlias } = loadCatalog()
  const { beverages, byNormName: beverageByName, byNormAlias: beverageByAlias } = loadBeverages()
  for (const [alias, id] of beverageByAlias) {
    if (!byNormAlias.has(alias)) byNormAlias.set(alias, id)
  }

  for (const [legacy, mapped] of Object.entries(LEGACY_ID_MAP)) {
    if (mapped.startsWith('bev_') && !beverages.has(mapped)) {
      console.warn('Manual beverage map missing:', legacy, '->', mapped)
    } else if (mapped.startsWith('food-') && !catalog.has(mapped)) {
      console.warn('Manual food map missing:', legacy, '->', mapped)
    }
  }

  const archetypeUnresolved = fixArchetypes(
    catalog,
    beverages,
    byNormName,
    byNormAlias,
    beverageByName,
  )
  const synonymStats = fixSynonyms(
    catalog,
    beverages,
    byNormName,
    byNormAlias,
    beverageByName,
  )

  writeManifest()
  writeNutritionCalculationRules()
  writeMealRoleMapping()
  writePhotoLabelMapping(catalog, beverages)

  console.log('Catalog items:', catalog.size)
  console.log('Beverages:', beverages.size)
  console.log('Archetype unresolved:', [...archetypeUnresolved])
  console.log('Synonyms:', synonymStats)
}

main()
