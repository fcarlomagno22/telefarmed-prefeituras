import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = '@telefarmed/menu-notification-preferences'

export type MenuNotificationPreferences = {
  enabled: boolean
  appointments: boolean
  healthReminders: boolean
  serviceUpdates: boolean
}

export const defaultMenuNotificationPreferences = (): MenuNotificationPreferences => ({
  enabled: true,
  appointments: true,
  healthReminders: true,
  serviceUpdates: false,
})

export async function loadMenuNotificationPreferences(): Promise<MenuNotificationPreferences> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultMenuNotificationPreferences()

    const parsed = JSON.parse(raw) as Partial<MenuNotificationPreferences>
    return {
      ...defaultMenuNotificationPreferences(),
      ...parsed,
    }
  } catch {
    return defaultMenuNotificationPreferences()
  }
}

export async function saveMenuNotificationPreferences(
  preferences: MenuNotificationPreferences,
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
}
