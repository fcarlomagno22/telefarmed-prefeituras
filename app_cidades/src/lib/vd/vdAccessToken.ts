import { Platform } from 'react-native'
import { getSecureItemAsync, removeSecureItemAsync, setSecureItemAsync } from '../../adapters/secureStorage'

const ACCESS_TOKEN_SECURE_KEY = 'vd-access-token'

let memoryAccessToken: string | null = null

export function getVdAccessToken(): string | null {
  return memoryAccessToken
}

export async function setVdAccessToken(token: string | null): Promise<void> {
  memoryAccessToken = token

  if (Platform.OS === 'web') return

  if (token) {
    await setSecureItemAsync(ACCESS_TOKEN_SECURE_KEY, token)
    return
  }

  await removeSecureItemAsync(ACCESS_TOKEN_SECURE_KEY)
}

export async function loadPersistedAccessToken(): Promise<string | null> {
  if (memoryAccessToken) return memoryAccessToken

  if (Platform.OS === 'web') return null

  const stored = await getSecureItemAsync(ACCESS_TOKEN_SECURE_KEY)
  memoryAccessToken = stored
  return stored
}
