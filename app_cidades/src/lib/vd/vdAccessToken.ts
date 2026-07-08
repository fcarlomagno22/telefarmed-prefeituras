import { Platform } from 'react-native'
import { getSecureItemAsync, removeSecureItemAsync, setSecureItemAsync } from '../../adapters/secureStorage'

const ACCESS_TOKEN_SECURE_KEY = 'vd-access-token'
const WEB_ACCESS_TOKEN_KEY = 'vd-access-token'

let memoryAccessToken: string | null = null

function readWebAccessToken(): string | null {
  if (typeof sessionStorage === 'undefined') return null
  return sessionStorage.getItem(WEB_ACCESS_TOKEN_KEY)
}

function writeWebAccessToken(token: string | null): void {
  if (typeof sessionStorage === 'undefined') return
  if (token) {
    sessionStorage.setItem(WEB_ACCESS_TOKEN_KEY, token)
    return
  }
  sessionStorage.removeItem(WEB_ACCESS_TOKEN_KEY)
}

export function getVdAccessToken(): string | null {
  return memoryAccessToken
}

export async function setVdAccessToken(token: string | null): Promise<void> {
  memoryAccessToken = token

  if (Platform.OS === 'web') {
    writeWebAccessToken(token)
    return
  }

  if (token) {
    await setSecureItemAsync(ACCESS_TOKEN_SECURE_KEY, token)
    return
  }

  await removeSecureItemAsync(ACCESS_TOKEN_SECURE_KEY)
}

export async function loadPersistedAccessToken(): Promise<string | null> {
  if (memoryAccessToken) return memoryAccessToken

  if (Platform.OS === 'web') {
    const stored = readWebAccessToken()
    memoryAccessToken = stored
    return stored
  }

  const stored = await getSecureItemAsync(ACCESS_TOKEN_SECURE_KEY)
  memoryAccessToken = stored
  return stored
}
