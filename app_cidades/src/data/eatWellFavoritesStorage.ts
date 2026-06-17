import AsyncStorage from '@react-native-async-storage/async-storage'
import type { EatWellFavorite } from '../types/eatWell'

const STORAGE_KEY = '@telefarmed/eat-well-favorites'

export const DEFAULT_EAT_WELL_FAVORITES: EatWellFavorite[] = [
  {
    id: 'fav-lunch',
    label: 'Almoço padrão',
    slot: 'lunch',
    entries: [
      {
        id: 'fav-lunch-rice',
        name: 'Arroz branco',
        portionLabel: '1 concha',
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
        id: 'fav-lunch-beans',
        name: 'Feijão carioca',
        portionLabel: '1 concha',
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
        id: 'fav-lunch-chicken',
        name: 'Frango grelhado',
        portionLabel: '1 filé',
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
    ],
  },
  {
    id: 'fav-breakfast',
    label: 'Café da manhã',
    slot: 'breakfast',
    entries: [
      {
        id: 'fav-breakfast-coffee',
        name: 'Café com leite',
        portionLabel: '1 xícara',
        macros: {
          calories: 72,
          proteinG: 4,
          carbsG: 6,
          fatG: 3.5,
          fiberG: 0,
          sugarsG: 5,
          saturatedFatG: 2.2,
        },
      },
      {
        id: 'fav-breakfast-bread',
        name: 'Pão francês',
        portionLabel: '1 unidade',
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
        id: 'fav-breakfast-egg',
        name: 'Ovo mexido',
        portionLabel: '2 unidades',
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
    ],
  },
  {
    id: 'fav-snack',
    label: 'Lanche da tarde',
    slot: 'afternoon_snack',
    entries: [
      {
        id: 'fav-snack-banana',
        name: 'Banana prata',
        portionLabel: '1 unidade',
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
        id: 'fav-snack-yogurt',
        name: 'Iogurte natural',
        portionLabel: '1 pote',
        macros: {
          calories: 110,
          proteinG: 6,
          carbsG: 12,
          fatG: 4,
          fiberG: 0,
          sugarsG: 10,
          saturatedFatG: 2.5,
        },
      },
    ],
  },
]

type FavoritesStore = Record<string, EatWellFavorite[]>

async function readStore(): Promise<FavoritesStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as FavoritesStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeStore(store: FavoritesStore) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export async function loadEatWellFavorites(patientCpf: string): Promise<EatWellFavorite[]> {
  const store = await readStore()
  return store[patientCpf] ?? []
}

export async function saveEatWellFavorites(patientCpf: string, favorites: EatWellFavorite[]) {
  const store = await readStore()
  store[patientCpf] = favorites
  await writeStore(store)
}
