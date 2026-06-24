import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = '@telefarmed/color-scheme'

export type AppColorScheme = 'light' | 'dark'

/** App runs in dark mode only until light theme is fully implemented. */
export async function loadAppColorScheme(): Promise<AppColorScheme> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (raw === 'light') {
      await AsyncStorage.setItem(STORAGE_KEY, 'dark')
    }
  } catch {
    // ignore migration errors
  }
  return 'dark'
}

export async function saveAppColorScheme(_scheme: AppColorScheme): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, 'dark')
}
