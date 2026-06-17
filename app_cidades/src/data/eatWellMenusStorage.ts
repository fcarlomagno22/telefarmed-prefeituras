import AsyncStorage from '@react-native-async-storage/async-storage'
import type { EatWellSavedMenu } from '../types/eatWell'
import { DEFAULT_EAT_WELL_MENUS } from '../utils/eatWellMenuGeneration'

const STORAGE_KEY = '@telefarmed/eat-well-menus'

type MenusStore = Record<string, EatWellSavedMenu[]>

async function readStore(): Promise<MenusStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as MenusStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeStore(store: MenusStore) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export async function loadEatWellMenus(patientCpf: string): Promise<EatWellSavedMenu[]> {
  const store = await readStore()
  let menus = store[patientCpf]

  if (!menus?.length) {
    menus = JSON.parse(JSON.stringify(DEFAULT_EAT_WELL_MENUS)) as EatWellSavedMenu[]
    store[patientCpf] = menus
    await writeStore(store)
  }

  return [...menus].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  )
}

export async function saveEatWellMenus(patientCpf: string, menus: EatWellSavedMenu[]) {
  const store = await readStore()
  store[patientCpf] = menus
  await writeStore(store)
}

export async function addEatWellMenu(
  patientCpf: string,
  menu: EatWellSavedMenu,
): Promise<EatWellSavedMenu[]> {
  const current = await loadEatWellMenus(patientCpf)
  const next = [menu, ...current]
  await saveEatWellMenus(patientCpf, next)
  return next
}

export async function deleteEatWellMenu(
  patientCpf: string,
  menuId: string,
): Promise<EatWellSavedMenu[]> {
  const current = await loadEatWellMenus(patientCpf)
  const next = current.filter((menu) => menu.id !== menuId)
  await saveEatWellMenus(patientCpf, next)
  return next
}
