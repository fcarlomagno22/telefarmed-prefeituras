import AsyncStorage from '@react-native-async-storage/async-storage'
import type { EatWellMenuDayLog, EatWellMenuFoodStatus, EatWellSavedMenu, FoodEntry, MealSlot } from '../types/eatWell'
import type { EatWellCalendarDay } from '../utils/eatWellCalendarDays'
import { buildMenuEntryStatusKey, computeMenuDayCompletionStatus, type MenuDayCompletionStatus } from '../utils/eatWellMenuDetail'

const STORAGE_KEY = '@telefarmed/eat-well-menu-days'

type MenuDayStore = Record<string, EatWellMenuDayLog>

function buildDayKey(menuId: string, dateIso: string) {
  return `${menuId}::${dateIso}`
}

async function readStore(): Promise<MenuDayStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as MenuDayStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeStore(store: MenuDayStore) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export async function loadEatWellMenuDayLog(
  menuId: string,
  dateIso: string,
): Promise<EatWellMenuDayLog> {
  const store = await readStore()
  const key = buildDayKey(menuId, dateIso)
  const stored = store[key]

  if (!stored) {
    return {
      menuId,
      dateIso,
      entryStatuses: {},
      entryOverrides: {},
    }
  }

  return {
    ...stored,
    entryStatuses: stored.entryStatuses ?? {},
    entryOverrides: stored.entryOverrides ?? {},
  }
}

export async function saveEatWellMenuDayLog(dayLog: EatWellMenuDayLog): Promise<EatWellMenuDayLog> {
  const store = await readStore()
  store[buildDayKey(dayLog.menuId, dayLog.dateIso)] = dayLog
  await writeStore(store)
  return dayLog
}

export async function setEatWellMenuEntryStatus(
  menuId: string,
  dateIso: string,
  slot: MealSlot,
  entryId: string,
  status: EatWellMenuFoodStatus | null,
): Promise<EatWellMenuDayLog> {
  const current = await loadEatWellMenuDayLog(menuId, dateIso)
  const key = buildMenuEntryStatusKey(slot, entryId)
  const nextStatuses = { ...current.entryStatuses }

  if (status == null) {
    delete nextStatuses[key]
  } else {
    nextStatuses[key] = status
  }

  return saveEatWellMenuDayLog({
    ...current,
    entryStatuses: nextStatuses,
  })
}

export async function setEatWellMenuEntryOverride(
  menuId: string,
  dateIso: string,
  slot: MealSlot,
  entryId: string,
  replacement: FoodEntry,
): Promise<EatWellMenuDayLog> {
  const current = await loadEatWellMenuDayLog(menuId, dateIso)
  const key = buildMenuEntryStatusKey(slot, entryId)

  return saveEatWellMenuDayLog({
    ...current,
    entryOverrides: {
      ...current.entryOverrides,
      [key]: {
        ...replacement,
        id: entryId,
      },
    },
  })
}

export async function loadEatWellMenuCalendarDayStatuses(
  menuId: string,
  menu: EatWellSavedMenu,
  days: EatWellCalendarDay[],
): Promise<Record<string, MenuDayCompletionStatus>> {
  const store = await readStore()
  const statuses: Record<string, MenuDayCompletionStatus> = {}

  for (const day of days) {
    if (day.isFuture) continue

    const key = buildDayKey(menuId, day.dateIso)
    const stored = store[key]
    const dayLog: EatWellMenuDayLog = stored
      ? {
          ...stored,
          entryStatuses: stored.entryStatuses ?? {},
          entryOverrides: stored.entryOverrides ?? {},
        }
      : {
          menuId,
          dateIso: day.dateIso,
          entryStatuses: {},
          entryOverrides: {},
        }

    statuses[day.dateIso] = computeMenuDayCompletionStatus(menu, dayLog)
  }

  return statuses
}
