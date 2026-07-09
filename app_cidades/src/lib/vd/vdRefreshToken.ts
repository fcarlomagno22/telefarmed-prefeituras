import { Platform } from 'react-native'
import { getSecureItemAsync, removeSecureItemAsync, setSecureItemAsync } from '../../adapters/secureStorage'

const REFRESH_TOKEN_SECURE_KEY = 'vd-refresh-token'
const WEB_REFRESH_TOKEN_KEY = 'vd-refresh-token'

let memoryRefreshToken: string | null = null

function readWebRefreshToken(): string | null {
  if (typeof localStorage === 'undefined') return null

  const stored = localStorage.getItem(WEB_REFRESH_TOKEN_KEY)
  if (stored) return stored

  // Migra tokens legados do sessionStorage (perdidos ao fechar o PWA).
  if (typeof sessionStorage !== 'undefined') {
    const legacy = sessionStorage.getItem(WEB_REFRESH_TOKEN_KEY)
    if (legacy) {
      localStorage.setItem(WEB_REFRESH_TOKEN_KEY, legacy)
      sessionStorage.removeItem(WEB_REFRESH_TOKEN_KEY)
      return legacy
    }
  }

  return null
}

function writeWebRefreshToken(token: string | null): void {
  if (typeof localStorage === 'undefined') return
  if (token) {
    localStorage.setItem(WEB_REFRESH_TOKEN_KEY, token)
  } else {
    localStorage.removeItem(WEB_REFRESH_TOKEN_KEY)
  }

  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(WEB_REFRESH_TOKEN_KEY)
  }
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
