export const PLANO_ALIMENTAR_MEAL_TYPES = [
  { id: 'cafe_manha', label: 'Café da manhã' },
  { id: 'lanche_manha', label: 'Lanche da manhã' },
  { id: 'almoco', label: 'Almoço' },
  { id: 'lanche_tarde', label: 'Lanche da tarde' },
  { id: 'jantar', label: 'Jantar' },
  { id: 'ceia', label: 'Ceia' },
] as const

export type PlanoAlimentarMealTypeId = (typeof PLANO_ALIMENTAR_MEAL_TYPES)[number]['id']

export type PlanoAlimentarFoodItem = {
  alimento: string
  quantidade: string
}

export type PlanoAlimentarMeal = {
  tipo: PlanoAlimentarMealTypeId
  label: string
  itens: PlanoAlimentarFoodItem[]
}

export function getPlanoAlimentarMealLabel(tipo: PlanoAlimentarMealTypeId): string {
  return PLANO_ALIMENTAR_MEAL_TYPES.find((meal) => meal.id === tipo)?.label ?? tipo
}

export function formatPlanoAlimentarRefeicoesText(refeicoes: PlanoAlimentarMeal[]): string {
  return refeicoes
    .filter((meal) => meal.itens.length > 0)
    .map((meal) => {
      const itemLines = meal.itens.map(
        (item) => `• ${item.alimento.trim()} — ${item.quantidade.trim()}`,
      )
      return [meal.label, ...itemLines].join('\n')
    })
    .join('\n\n')
}

export function buildPlanoAlimentarMealLines(refeicoes: PlanoAlimentarMeal[]): string[] {
  const lines: string[] = []

  for (const meal of refeicoes) {
    if (meal.itens.length === 0) continue
    lines.push(meal.label)
    for (const item of meal.itens) {
      lines.push(`• ${item.alimento.trim()} — ${item.quantidade.trim()}`)
    }
    lines.push('')
  }

  if (lines.at(-1) === '') lines.pop()
  return lines
}
