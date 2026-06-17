import AsyncStorage from '@react-native-async-storage/async-storage'
import type { NutritionGoals } from '../types/eatWell'

const STORAGE_KEY = '@telefarmed/eat-well-nutrition-goals'

export const DEFAULT_NUTRITION_GOALS: NutritionGoals = {
  baseCalories: 2200,
  proteinG: 120,
  carbsG: 260,
  fatG: 70,
  fiberG: 25,
  sugarsMaxG: 50,
  saturatedFatMaxG: 22,
  waterMl: 2000,
}

type GoalsStore = Record<string, NutritionGoals>

async function readStore(): Promise<GoalsStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as GoalsStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeStore(store: GoalsStore) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export async function loadNutritionGoals(patientCpf: string): Promise<NutritionGoals> {
  const store = await readStore()
  return store[patientCpf] ?? DEFAULT_NUTRITION_GOALS
}

export async function saveNutritionGoals(patientCpf: string, goals: NutritionGoals) {
  const store = await readStore()
  store[patientCpf] = goals
  await writeStore(store)
}
