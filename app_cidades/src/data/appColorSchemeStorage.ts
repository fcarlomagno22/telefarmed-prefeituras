import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = '@telefarmed/color-scheme'

export type AppColorScheme = 'light' | 'dark'

/** App runs in light mode only. */
export async function loadAppColorScheme(): Promise<AppColorScheme> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (raw === 'dark') {
      await AsyncStorage.setItem(STORAGE_KEY, 'light')
    }
  } catch {
    // ignore migration errors
  }
  return 'light'
}

export async function saveAppColorScheme(_scheme: AppColorScheme): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, 'light')
}
