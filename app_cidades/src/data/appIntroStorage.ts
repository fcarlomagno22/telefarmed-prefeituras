import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = '@telefarmed/app-intro-seen'

export async function hasAppIntroBeenSeen(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    return raw === '1'
  } catch {
    return false
  }
}

export async function markAppIntroSeen(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, '1')
}
