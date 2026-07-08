import { Platform } from 'react-native'
import { getSecureItemAsync, removeSecureItemAsync, setSecureItemAsync } from '../../adapters/secureStorage'

const REFRESH_TOKEN_SECURE_KEY = 'vd-refresh-token'
const WEB_REFRESH_TOKEN_KEY = 'vd-refresh-token'

let memoryRefreshToken: string | null = null

function readWebRefreshToken(): string | null {
  if (typeof sessionStorage === 'undefined') return null
  return sessionStorage.getItem(WEB_REFRESH_TOKEN_KEY)
}

function writeWebRefreshToken(token: string | null): void {
  if (typeof sessionStorage === 'undefined') return
  if (token) {
    sessionStorage.setItem(WEB_REFRESH_TOKEN_KEY, token)
    return
  }
  sessionStorage.removeItem(WEB_REFRESH_TOKEN_KEY)
}

export function getVdRefreshToken(): string | null {
  return memoryRefreshToken
}

export async function setVdRefreshToken(token: string | null): Promise<void> {
  memoryRefreshToken = token

  if (Platform.OS === 'web') {
    writeWebRefreshToken(token)
    return
  }

  if (token) {
    await setSecureItemAsync(REFRESH_TOKEN_SECURE_KEY, token)
    return
  }

  await removeSecureItemAsync(REFRESH_TOKEN_SECURE_KEY)
}

export async function loadPersistedRefreshToken(): Promise<string | null> {
  if (memoryRefreshToken) return memoryRefreshToken

  if (Platform.OS === 'web') {
    const stored = readWebRefreshToken()
    memoryRefreshToken = stored
    return stored
  }

  const stored = await getSecureItemAsync(REFRESH_TOKEN_SECURE_KEY)
  memoryRefreshToken = stored
  return stored
}
