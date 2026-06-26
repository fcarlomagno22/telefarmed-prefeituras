import { eatWellContent } from '../content/loadEatWellContent'
import { computeNutritionGoalsFromWizard, computeMenuCalorieTarget } from '../computeNutritionGoals'
import {
  MENU_ACTIVITY_OPTIONS,
  MENU_BOWEL_OPTIONS,
  MENU_DISEASE_OPTIONS,
  MENU_DIETARY_PREFERENCE_OPTIONS,
  MENU_FREQUENCY_OPTIONS,
  MENU_INTOLERANCE_OPTIONS,
  MENU_OBJECTIVE_OPTIONS,
  MENU_PREVIOUS_DIET_OPTIONS,
  parseHeightMeters,
  parseWeightKg,
  type EatWellMenuObjective,
  type EatWellMenuWizardForm,
} from '../../utils/eatWellMenuWizard'

const SLOT_SPECS = [
  {
    slot: 'breakfast',
    label: 'Café da manhã',
    min_items: 3,
    max_items: 5,
    guidance:
      'Proteína (ovo, iogurte, queijo) + fruta + carboidrato (pão, tapioca, aveia) + bebida opcional. Nunca só pão.',
  },
  {
    slot: 'morning_snack',
    label: 'Lanche da manhã',
    min_items: 1,
    max_items: 3,
    guidance: 'Leve: fruta, iogurte, castanha, tapioca pequena, aveia. Sem arroz, feijão, macarrão ou salada.',
  },
  {
    slot: 'lunch',
    label: 'Almoço',
    min_items: 3,
    max_items: 5,
    guidance:
      'Prato brasileiro: proteína magra + 1 amido (arroz OU macarrão OU cuscuz OU mandioca) + leguminosa e/ou salada/legume. Máximo 1 amido.',
  },
  {
    slot: 'afternoon_snack',
    label: 'Lanche da tarde',
    min_items: 1,
    max_items: 3,
    guidance: 'Leve: fruta, iogurte, sanduíche simples, castanha. Sem refeição completa.',
  },
  {
    slot: 'dinner',
    label: 'Jantar',
    min_items: 3,
    max_items: 5,
    guidance:
      'Proteína DIFERENTE do almoço quando possível + carboidrato + legume/verdura. Máximo 1 amido. Mais leve que o almoço se objetivo for emagrecimento.',
  },
  {
    slot: 'basket',
    label: 'Cesta complementar',
    min_items: 1,
    max_items: 2,
    guidance: 'Hortifruti ou item leve para complementar o dia (fruta, iogurte, chá). Sem carne/arroz/feijão.',
  },
] as const

function labelForObjective(objective: EatWellMenuObjective | null) {
  return MENU_OBJECTIVE_OPTIONS.find((item) => item.id === objective)?.label ?? 'Outros'
}

function labelForActivity(level: EatWellMenuWizardForm['activityLevel']) {
  return MENU_ACTIVITY_OPTIONS.find((item) => item.id === level)?.label ?? 'Não informado'
}

function labelForFrequency(id: EatWellMenuWizardForm['compulsionFrequency']) {
  return MENU_FREQUENCY_OPTIONS.find((item) => item.id === id)?.label ?? null
}

function labelForBowel(id: EatWellMenuWizardForm['bowelFrequency']) {
  return MENU_BOWEL_OPTIONS.find((item) => item.id === id)?.label ?? null
}

function getSlotCalorieShare(objective: EatWellMenuObjective, slot: string) {
  const distribution =
    eatWellContent.menuGenerationRules.calorie_distribution_by_slot.by_objective?.[objective] ??
    eatWellContent.menuGenerationRules.calorie_distribution_by_slot.default
  return (distribution[slot as keyof typeof distribution] ?? 0) / 100
}

function buildClinicalDirectives(form: EatWellMenuWizardForm) {
  const directives: string[] = []

  const diseaseSet = new Set(form.diseases.map((d) => d.toLowerCase()))
  const intoleranceSet = new Set(form.intolerances.map((d) => d.toLowerCase()))
  const prefSet = new Set(form.dietaryPreferences.map((d) => d.toLowerCase()))

  if (diseaseSet.has('diabetes') || form.objective === 'diabetes') {
    directives.push('DIABETES: proibir suco de caixa, refrigerante, doce, mel, sobremesa; priorizar fibras, proteína magra, carboidrato integral ou porção controlada; frutas inteiras ok, preferir baixo IG.')
  }
  if (diseaseSet.has('hipertensão') || form.objective === 'hypertension') {
    directives.push('HIPERTENSÃO: evitar embutidos, enlatados, caldos de cubo, conservas salgadas, queijo muito salgado; priorizar comida caseira com pouco sal, frutas e verduras.')
  }
  if (diseaseSet.has('colesterol alto')) {
    directives.push('COLESTEROL ALTO: evitar fritura, embutido, gordura visível, ultraprocessado; priorizar peixe, leguminosas, aveia, azeite, preparações grelhadas/cozidas.')
  }
  if (diseaseSet.has('tireoide')) {
    directives.push('TIREOIDE: refeições regulares com proteína; moderar soja em excesso; evitar ultraprocessado.')
  }
  if (diseaseSet.has('gastrite')) {
    directives.push('GASTRITE: evitar fritura, pimenta, café em excesso, refrigerante, bebida alcoólica; preferir preparações cozidas, sopas leves, comidas de sabor suave.')
  }
  if (diseaseSet.has('intestino irritável')) {
    directives.push('INTESTINO IRRITÁVEL: evitar feijão em porção grande, cebola, alho, leite (se mal tolerado), ultraprocessado; preferir preparações simples, frutas toleradas, proteína magra.')
  }
  if (diseaseSet.has('anemia')) {
    directives.push('ANEMIA: incluir fontes de ferro (feijão, lentilha, carne magra, fígado se aceito, espinafre) combinadas com vitamina C (laranja, limão, acerola).')
  }
  if (diseaseSet.has('osteoporose')) {
    directives.push('OSTEOPOROSE: incluir cálcio (leite, iogurte, queijo, brócolis); evitar excesso de sal e álcool.')
  }

  if (intoleranceSet.has('lactose') || prefSet.has('sem lactose')) {
    directives.push('LACTOSE: proibir leite, iogurte com lactose, queijo com lactose, requeijão, manteiga, creme de leite. Usar versões sem lactose ou vegetais.')
  }
  if (intoleranceSet.has('glúten') || prefSet.has('sem glúten')) {
    directives.push('GLÚTEN: proibir pão comum, macarrão comum, cuscuz de trigo, biscoito com glúten, torrada comum. Usar tapioca, arroz, pão sem glúten, batata.')
  }
  if (intoleranceSet.has('frutose')) {
    directives.push('FRUTOSE: evitar mel, suco de fruta, frutas muito doces em excesso, xarope.')
  }
  if (intoleranceSet.has('sacarose') || prefSet.has('sem açúcar')) {
    directives.push('AÇÚCAR/SACAROSE: proibir doces, sobremesa, refrigerante, achocolatado, mel, açúcar adicionado.')
  }
  if (intoleranceSet.has('ovos')) {
    directives.push('OVOS: proibir ovo, omelete, maionese, preparações com ovo.')
  }
  if (intoleranceSet.has('soja')) {
    directives.push('SOJA: proibir tofu, shoyu, leite de soja, proteína de soja.')
  }
  if (intoleranceSet.has('amendoim')) {
    directives.push('AMENDOIM: proibir amendoim, pasta de amendoim, paçoca.')
  }
  if (intoleranceSet.has('frutos do mar')) {
    directives.push('FRUTOS DO MAR: proibir camarão, lula, polvo, mariscos, caranguejo.')
  }

  if (prefSet.has('vegetariano')) {
    directives.push('VEGETARIANO: proibir carne, frango, peixe, presunto. Incluir ovos/laticínios se permitido + leguminosas.')
  }
  if (prefSet.has('vegano')) {
    directives.push('VEGANO: proibir qualquer produto animal (carne, ovo, leite, queijo, mel). Priorizar leguminosas, tofu (se permitido), grãos, sementes.')
  }
  if (prefSet.has('low carb')) {
    directives.push('LOW CARB: reduzir arroz, pão, macarrão, tubérculos; aumentar proteína, legumes, gorduras boas.')
  }

  if (form.isPregnant) {
    directives.push('GESTANTE: proibir álcool, peixe/ovo crus, leite não pasteurizado; priorizar ferro, folato (folhas, feijão, laranja), cálcio; peixe cozido ok; cafeína moderada.')
  }
  if (form.isLactating) {
    directives.push('LACTANTE: proibir álcool; priorizar hidratação, cálcio, proteína, calorias extras; refeições regulares.')
  }

  if (form.otherDiseases.trim()) {
    directives.push(`OUTRAS DOENÇAS (considerar): ${form.otherDiseases.trim()}`)
  }
  if (form.otherIntolerances.trim()) {
    directives.push(`OUTRAS INTOLERÂNCIAS (considerar): ${form.otherIntolerances.trim()}`)
  }
  if (form.likedFoods.trim()) {
    directives.push(`PRIORIZAR alimentos que o usuário gosta: ${form.likedFoods.trim()}`)
  }
  if (form.avoidedFoods.trim()) {
    directives.push(`NUNCA incluir (usuário evita): ${form.avoidedFoods.trim()}`)
  }
  if (form.medications.trim() && !form.noRegularMedications) {
    directives.push(`MEDICAMENTOS EM USO (adaptar cardápio): ${form.medications.trim()}`)
  }

  return directives
}

function buildBehaviorDirectives(form: EatWellMenuWizardForm) {
  const lines: string[] = []

  if (form.hungerLevel >= 8) {
    lines.push('Fome alta: porções um pouco maiores, mais proteína e fibra para saciedade.')
  } else if (form.hungerLevel <= 3) {
    lines.push('Fome baixa: porções moderadas, refeições leves e fáceis de comer.')
  }

  if (form.hasCompulsion) {
    const freq = labelForFrequency(form.compulsionFrequency)
    lines.push(
      `Compulsão alimentar${freq ? ` (${freq})` : ''}: evitar doces, biscoitos, ultraprocessados; nada de "cheat meal" no cardápio.`,
    )
  }

  if (form.consumesAlcohol) {
    lines.push(
      `Consome álcool${form.alcoholFrequency ? ` (${labelForFrequency(form.alcoholFrequency)})` : ''}: não incluir bebida alcoólica no cardápio; reforçar hidratação.`,
    )
  }

  const sleepHours = Number.parseFloat(form.sleepHours.replace(',', '.'))
  if (form.sleepQuality <= 4 || (Number.isFinite(sleepHours) && sleepHours < 6)) {
    lines.push('Sono ruim: evitar café no jantar; incluir alimentos leves à noite.')
  }

  if (form.stressLevel >= 7) {
    lines.push(`Estresse alto${form.stressCauses.trim() ? ` (${form.stressCauses.trim()})` : ''}: refeições simples, caseiras, fáceis de preparar.`)
  }

  const bowel = labelForBowel(form.bowelFrequency)
  if (form.bowelFrequency === 'irregular' || form.bowelFrequency === 'weekly') {
    lines.push(`Intestino ${bowel ?? 'irregular'}: incluir fibras (frutas, aveia, leguminosas, verduras).`)
  }

  if (form.previousDiets.length > 0 && !form.neverTriedDiets) {
    lines.push(`Dietas que já tentou (usar como referência, não copiar cegamente): ${form.previousDiets.join(', ')}`)
  }

  return lines
}

export function buildMenuAiSystemPrompt() {
  return `Você é nutricionista clínica brasileira. Crie cardápios de UM DIA, práticos, realistas e personalizados.

CONTEXTO DO APP: Telefarmed — saúde para população brasileira. Comida do dia a dia, não gastronomia fina.

## SUA TAREFA
Montar cardápio completo de 1 dia com 6 momentos: breakfast, morning_snack, lunch, afternoon_snack, dinner, basket.
Você INVENTA os alimentos, porções e estimativas nutricionais com base no perfil. NÃO existe catálogo externo.

## ESTILO DE COMIDA
- Brasileira, caseira, encontrada em mercado comum do Brasil.
- Nomes claros: "Arroz branco cozido", "Peito de frango grelhado", "Banana in natura", "Feijão carioca cozido".
- Preparações simples: cozido, grelhado, assado, in natura, refogado com pouco óleo.
- PROIBIDO: receitas exóticas, ingredientes importados raros, proteína crua, polpa de fruta exótica (cacau, cupuaçu), pratos de restaurante caro.

## REGRAS DE COMPOSIÇÃO
- Café da manhã: mínimo 3 itens (proteína + fruta + carboidrato). Nunca só pão.
- Almoço e jantar: mínimo 3 itens cada (proteína + 1 amido + legume/verdura/leguminosa). Máximo 1 amido por refeição.
- Lanches: leves, 1–3 itens. Sem arroz/feijão/macarrão/salada completa.
- Cesta: 1–2 itens leves (fruta, iogurte, chá).
- Proteína do almoço e jantar deve ser DIFERENTE quando possível (ex.: frango no almoço, peixe no jantar).
- ZERO repetição de família de alimento no dia: se comeu banana no café, não repete banana no lanche. Se comeu peixe no almoço, não repete peixe no jantar. Se comeu tapioca 1x, não repete. Água/chá pode repetir.
- Incluir pelo menos 2 alimentos da lista "gosta" do usuário, se informada.
- Respeitar TODAS exclusões clínicas e intolerâncias como bloqueio absoluto.

## MACROS
Estime macros de forma realista para cada item (TACO/rotulagem brasileira como referência mental).
O total do dia deve ficar entre 90% e 110% das metas calóricas e proteína informadas.
Fibra do dia >= meta mínima. Açúcar do dia <= meta máxima.

## FORMATO DE RESPOSTA (JSON estrito, sem markdown)
{
  "menu_name": "string",
  "rationale_short": "2-3 frases explicando o cardápio",
  "meals": [
    {
      "slot": "breakfast | morning_snack | lunch | afternoon_snack | dinner | basket",
      "entries": [
        {
          "name": "Nome do alimento em português",
          "portion_label": "Ex: 2 ovos, 4 colheres de sopa, 1 unidade média",
          "macros": {
            "calories": number,
            "proteinG": number,
            "carbsG": number,
            "fatG": number,
            "fiberG": number,
            "sugarsG": number,
            "saturatedFatG": number
          }
        }
      ]
    }
  ],
  "daily_totals": {
    "calories": number,
    "proteinG": number,
    "carbsG": number,
    "fatG": number,
    "fiberG": number,
    "sugarsG": number,
    "saturatedFatG": number
  },
  "water_recommendation_ml": number
}

Responda SOMENTE o JSON. Sem texto antes ou depois.`
}

export function buildMenuAiUserPrompt(form: EatWellMenuWizardForm) {
  const objective = form.objective ?? 'other'
  const goals = computeNutritionGoalsFromWizard(form)
  const dailyCalories = computeMenuCalorieTarget(form)

  const mealTargets = SLOT_SPECS.map((spec) => ({
    slot: spec.slot,
    label: spec.label,
    min_items: spec.min_items,
    max_items: spec.max_items,
    guidance: spec.guidance,
    target_kcal: Math.round(dailyCalories * getSlotCalorieShare(objective, spec.slot)),
  }))

  const payload = {
    instrucao: 'Gere o cardápio de 1 dia completo para este perfil. Siga todas as regras clínicas e de composição.',
    perfil: {
      nome_cardapio: form.menuName.trim() || 'Meu cardápio',
      altura_m: parseHeightMeters(form.heightMeters),
      peso_kg: parseWeightKg(form.weightKg),
      objetivo: labelForObjective(form.objective),
      objetivo_id: objective,
      atividade_fisica: labelForActivity(form.activityLevel),
      atividade_id: form.activityLevel,
      doencas: form.noKnownDiseases ? [] : form.diseases,
      outras_doencas: form.otherDiseases.trim() || null,
      intolerancias: form.noKnownIntolerances ? [] : form.intolerances,
      outras_intolerancias: form.otherIntolerances.trim() || null,
      preferencias_alimentares: form.dietaryPreferences,
      alimentos_que_gosta: form.likedFoods.trim() || null,
      alimentos_que_evita: form.avoidedFoods.trim() || null,
      gestante: form.isPregnant === true,
      lactante: form.isLactating === true,
      nivel_fome_1_a_10: form.hungerLevel,
      compulsao_alimentar: form.hasCompulsion,
      frequencia_compulsao: form.hasCompulsion ? labelForFrequency(form.compulsionFrequency) : null,
      consome_alcool: form.consumesAlcohol,
      frequencia_alcool: form.consumesAlcohol ? labelForFrequency(form.alcoholFrequency) : null,
      quantidade_alcool: form.consumesAlcohol ? form.alcoholQuantity.trim() || null : null,
      horas_sono: form.sleepHours.trim() || null,
      qualidade_sono_1_a_10: form.sleepQuality,
      estresse_1_a_10: form.stressLevel,
      causas_estresse: form.stressCauses.trim() || null,
      frequencia_intestinal: labelForBowel(form.bowelFrequency),
      dietas_anteriores: form.neverTriedDiets ? [] : form.previousDiets,
    },
    metas_nutricionais: {
      calorias_dia_kcal: goals.baseCalories,
      proteina_g: goals.proteinG,
      carboidrato_g: goals.carbsG,
      gordura_g: goals.fatG,
      fibra_min_g: goals.fiberG,
      acucar_max_g: goals.sugarsMaxG,
      gordura_saturada_max_g: goals.saturatedFatMaxG,
      agua_ml: goals.waterMl,
    },
    calorias_por_refeicao: mealTargets,
    diretrizes_clinicas: buildClinicalDirectives(form),
    diretrizes_comportamentais: buildBehaviorDirectives(form),
    opcoes_disponiveis_no_wizard: {
      doencas: MENU_DISEASE_OPTIONS,
      intolerancias: MENU_INTOLERANCE_OPTIONS,
      preferencias: MENU_DIETARY_PREFERENCE_OPTIONS,
      dietas_anteriores: MENU_PREVIOUS_DIET_OPTIONS,
    },
  }

  return JSON.stringify(payload, null, 2)
}

export function buildMenuAiRetryPrompt(errors: string[]) {
  return `A resposta anterior foi rejeitada. Regere o JSON COMPLETO corrigindo TODOS os erros abaixo.
Mantenha o mesmo perfil. Não omita nenhum slot.

ERROS:
${errors.map((error, index) => `${index + 1}. ${error}`).join('\n')}`
}

export { SLOT_SPECS }
