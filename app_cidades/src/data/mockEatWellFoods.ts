import type { EatWellDailyRecord, FoodEntry, MacroNutrients } from '../types/eatWell'

/** Fotos demo de pratos (Unsplash) para a galeria do diário. */
export const EAT_WELL_DEMO_MEAL_PHOTOS = {
  lunch:
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=720&auto=format&fit=crop&q=80',
  dinner:
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=720&auto=format&fit=crop&q=80',
} as const

export type MockFoodItem = {
  id: string
  name: string
  portionLabel: string
  keywords: string[]
  macros: MacroNutrients
}

export const MOCK_FOOD_DATABASE: MockFoodItem[] = [
  {
    id: 'food-rice',
    name: 'Arroz branco',
    portionLabel: '1 concha',
    keywords: ['arroz', 'carbo'],
    macros: {
      calories: 205,
      proteinG: 4,
      carbsG: 45,
      fatG: 0.4,
      fiberG: 0.6,
      sugarsG: 0,
      saturatedFatG: 0.1,
    },
  },
  {
    id: 'food-beans',
    name: 'Feijão carioca',
    portionLabel: '1 concha',
    keywords: ['feijão', 'proteína'],
    macros: {
      calories: 128,
      proteinG: 9,
      carbsG: 23,
      fatG: 0.5,
      fiberG: 8,
      sugarsG: 0.4,
      saturatedFatG: 0.1,
    },
  },
  {
    id: 'food-chicken',
    name: 'Frango grelhado',
    portionLabel: '1 filé',
    keywords: ['frango', 'carne'],
    macros: {
      calories: 165,
      proteinG: 31,
      carbsG: 0,
      fatG: 3.6,
      fiberG: 0,
      sugarsG: 0,
      saturatedFatG: 1,
    },
  },
  {
    id: 'food-egg',
    name: 'Ovo mexido',
    portionLabel: '2 unidades',
    keywords: ['ovo', 'proteína'],
    macros: {
      calories: 180,
      proteinG: 12,
      carbsG: 2,
      fatG: 14,
      fiberG: 0,
      sugarsG: 1,
      saturatedFatG: 4.5,
    },
  },
  {
    id: 'food-bread',
    name: 'Pão francês',
    portionLabel: '1 unidade',
    keywords: ['pão', 'carbo'],
    macros: {
      calories: 140,
      proteinG: 4,
      carbsG: 28,
      fatG: 1.5,
      fiberG: 1.2,
      sugarsG: 1,
      saturatedFatG: 0.3,
    },
  },
  {
    id: 'food-banana',
    name: 'Banana prata',
    portionLabel: '1 unidade',
    keywords: ['fruta', 'banana'],
    macros: {
      calories: 98,
      proteinG: 1.2,
      carbsG: 26,
      fatG: 0.3,
      fiberG: 2.6,
      sugarsG: 14,
      saturatedFatG: 0.1,
    },
  },
  {
    id: 'food-salad',
    name: 'Salada verde',
    portionLabel: '1 prato',
    keywords: ['verdura', 'fibra', 'salada'],
    macros: {
      calories: 35,
      proteinG: 2,
      carbsG: 6,
      fatG: 0.5,
      fiberG: 3.5,
      sugarsG: 2,
      saturatedFatG: 0.1,
    },
  },
  {
    id: 'food-pasta',
    name: 'Macarrão ao molho',
    portionLabel: '1 prato',
    keywords: ['massa', 'macarrão'],
    macros: {
      calories: 320,
      proteinG: 11,
      carbsG: 52,
      fatG: 7,
      fiberG: 3,
      sugarsG: 4,
      saturatedFatG: 2.2,
    },
  },
  {
    id: 'food-cheese',
    name: 'Queijo minas',
    portionLabel: '2 fatias',
    keywords: ['queijo', 'laticínio'],
    macros: {
      calories: 160,
      proteinG: 10,
      carbsG: 2,
      fatG: 13,
      fiberG: 0,
      sugarsG: 0.5,
      saturatedFatG: 8,
    },
  },
  {
    id: 'food-soda',
    name: 'Refrigerante',
    portionLabel: '350 ml',
    keywords: ['bebida', 'açúcar'],
    macros: {
      calories: 148,
      proteinG: 0,
      carbsG: 37,
      fatG: 0,
      fiberG: 0,
      sugarsG: 37,
      saturatedFatG: 0,
    },
  },
  {
    id: 'food-oil',
    name: 'Azeite de oliva',
    portionLabel: '1 colher sopa',
    keywords: ['gordura', 'azeite'],
    macros: {
      calories: 119,
      proteinG: 0,
      carbsG: 0,
      fatG: 13.5,
      fiberG: 0,
      sugarsG: 0,
      saturatedFatG: 1.9,
    },
  },
  {
    id: 'food-potato',
    name: 'Batata cozida',
    portionLabel: '1 unidade média',
    keywords: ['batata', 'carbo'],
    macros: {
      calories: 116,
      proteinG: 2.5,
      carbsG: 27,
      fatG: 0.1,
      fiberG: 2.4,
      sugarsG: 1,
      saturatedFatG: 0,
    },
  },
]

export function searchMockFoods(query: string, limit = 8): MockFoodItem[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return MOCK_FOOD_DATABASE.slice(0, limit)

  return MOCK_FOOD_DATABASE.filter(
    (food) =>
      food.name.toLowerCase().includes(normalized) ||
      food.keywords.some((keyword) => keyword.includes(normalized)),
  ).slice(0, limit)
}

export function mockFoodToEntry(food: MockFoodItem): FoodEntry {
  return {
    id: `${food.id}-${Date.now()}`,
    name: food.name,
    portionLabel: food.portionLabel,
    macros: { ...food.macros },
  }
}

export function createSeedDailyRecord(dateIso: string): EatWellDailyRecord {
  const breakfastEntries = [
    mockFoodToEntry(MOCK_FOOD_DATABASE.find((f) => f.id === 'food-bread')!),
    mockFoodToEntry(MOCK_FOOD_DATABASE.find((f) => f.id === 'food-egg')!),
  ]
  breakfastEntries[0]!.id = 'seed-breakfast-bread'
  breakfastEntries[1]!.id = 'seed-breakfast-egg'

  const morningSnackEntries = [mockFoodToEntry(MOCK_FOOD_DATABASE.find((f) => f.id === 'food-banana')!)]
  morningSnackEntries[0]!.id = 'seed-morning-snack-banana'

  const lunchEntries = [
    mockFoodToEntry(MOCK_FOOD_DATABASE.find((f) => f.id === 'food-rice')!),
    mockFoodToEntry(MOCK_FOOD_DATABASE.find((f) => f.id === 'food-beans')!),
    mockFoodToEntry(MOCK_FOOD_DATABASE.find((f) => f.id === 'food-chicken')!),
    mockFoodToEntry(MOCK_FOOD_DATABASE.find((f) => f.id === 'food-salad')!),
  ]
  lunchEntries.forEach((entry, index) => {
    entry.id = `seed-lunch-${index}`
  })
  lunchEntries.push({
    id: 'seed-lunch-beverage',
    name: 'Suco de laranja',
    portionLabel: '300 ml',
    macros: {
      calories: 126,
      proteinG: 2,
      carbsG: 30,
      fatG: 0,
      fiberG: 0,
      sugarsG: 28,
      saturatedFatG: 0,
    },
  })

  const dinnerEntries = [
    mockFoodToEntry(MOCK_FOOD_DATABASE.find((f) => f.id === 'food-potato')!),
    mockFoodToEntry(MOCK_FOOD_DATABASE.find((f) => f.id === 'food-salad')!),
  ]
  dinnerEntries[0]!.id = 'seed-dinner-potato'
  dinnerEntries[1]!.id = 'seed-dinner-salad'

  return {
    dateIso,
    meals: [
      {
        id: 'seed-meal-breakfast',
        slot: 'breakfast',
        loggedAt: `${dateIso}T07:35:00.000`,
        entries: breakfastEntries,
        portionSize: 'medium',
        feeling: 'ok',
      },
      {
        id: 'seed-meal-morning-snack',
        slot: 'morning_snack',
        loggedAt: `${dateIso}T10:15:00.000`,
        entries: morningSnackEntries,
        portionSize: 'small',
        feeling: 'light',
      },
      {
        id: 'seed-meal-lunch',
        slot: 'lunch',
        loggedAt: `${dateIso}T12:42:00.000`,
        entries: lunchEntries,
        photoUri: EAT_WELL_DEMO_MEAL_PHOTOS.lunch,
        portionSize: 'medium',
        feeling: 'ok',
        beverage: { name: 'Suco de laranja', ml: 300 },
      },
      {
        id: 'seed-meal-afternoon-snack',
        slot: 'afternoon_snack',
        loggedAt: `${dateIso}T15:20:00.000`,
        entries: [mockFoodToEntry(MOCK_FOOD_DATABASE.find((f) => f.id === 'food-cheese')!)].map(
          (entry) => ({ ...entry, id: 'seed-afternoon-snack-cheese' }),
        ),
        portionSize: 'small',
      },
      {
        id: 'seed-meal-dinner',
        slot: 'dinner',
        loggedAt: `${dateIso}T19:45:00.000`,
        entries: dinnerEntries,
        photoUri: EAT_WELL_DEMO_MEAL_PHOTOS.dinner,
        portionSize: 'medium',
        feeling: 'light',
        beverage: { name: 'Água', ml: 350 },
      },
    ],
    waterLogs: [
      { id: 'seed-water-1', ml: 250, loggedAt: `${dateIso}T08:10:00.000` },
      { id: 'seed-water-2', ml: 500, loggedAt: `${dateIso}T11:30:00.000` },
      { id: 'seed-water-3', ml: 250, loggedAt: `${dateIso}T14:05:00.000` },
      { id: 'seed-water-4', ml: 500, loggedAt: `${dateIso}T18:20:00.000` },
      { id: 'seed-water-5', ml: 500, loggedAt: `${dateIso}T20:40:00.000` },
    ],
  }
}
