import AsyncStorage from '@react-native-async-storage/async-storage'
import { fetchMe, refresh } from '../api/vd/auth'
import type { VdLoginResult } from '../../types/vdApi'
import type { AuthUser } from '../../types/auth'
import { shouldRefreshAccessToken } from '../../utils/jwtExpiry'
import { mapVdPacienteUserToAuthUser } from '../../utils/vdAuthMapper'
import { loadPersistedAccessToken, setVdAccessToken } from './vdAccessToken'
import { loadPersistedRefreshToken, setVdRefreshToken, getVdRefreshToken } from './vdRefreshToken'

export const SESSION_USER_KEY = '@telefarmed/session'

export type VdAuthSessionResult = VdLoginResult

export async function persistAuthUser(user: AuthUser): Promise<void> {
  await AsyncStorage.setItem(SESSION_USER_KEY, JSON.stringify(user))
}

export async function applyAuthSession(result: VdAuthSessionResult): Promise<AuthUser> {
  await setVdAccessToken(result.accessToken)
  if (result.refreshToken) {
    await setVdRefreshToken(result.refreshToken)
  }
  const user = mapVdPacienteUserToAuthUser(result.user)
  await persistAuthUser(user)
  return user
}

export async function clearAuthSession(): Promise<void> {
  await setVdAccessToken(null)
  await setVdRefreshToken(null)
  await AsyncStorage.removeItem(SESSION_USER_KEY)
}

async function restoreFromAccessToken(token: string): Promise<AuthUser | null> {
  await setVdAccessToken(token)

  if (!shouldRefreshAccessToken(token)) {
    try {
      const vdUser = await fetchMe(token)
      const user = mapVdPacienteUserToAuthUser(vdUser)
      await persistAuthUser(user)
      return user
    } catch {
      // Token inválido — tenta refresh abaixo.
    }
  }

  try {
    return await applyAuthSession(await refresh())
  } catch {
    return null
  }
}

async function tryRefreshSession(): Promise<AuthUser | null> {
  const refreshToken = getVdRefreshToken()
  if (!refreshToken) return null

  try {
    return await applyAuthSession(await refresh())
  } catch {
    return null
  }
}

export async function restoreAuthSession(): Promise<AuthUser | null> {
  await loadPersistedRefreshToken()

  const refreshed = await tryRefreshSession()
  if (refreshed) return refreshed

  const token = await loadPersistedAccessToken()
  if (token) {
    const restored = await restoreFromAccessToken(token)
    if (restored) return restored
  }

  await clearAuthSession()
  return null
}

export async function restoreSessionAfterBiometric(): Promise<AuthUser | null> {
  await loadPersistedRefreshToken()

  const refreshed = await tryRefreshSession()
  if (refreshed) return refreshed

  const token = await loadPersistedAccessToken()
  if (!token) return null

  return restoreFromAccessToken(token)
}

export async function refreshVdAuthSession(): Promise<AuthUser> {
  return applyAuthSession(await refresh())
}
