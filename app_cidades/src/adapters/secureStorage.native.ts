import * as SecureStore from 'expo-secure-store'

export async function getSecureItemAsync(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key)
}

export async function setSecureItemAsync(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value)
}

export async function removeSecureItemAsync(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key)
}
