import AsyncStorage from '@react-native-async-storage/async-storage'
import { fetchMe, refresh } from '../api/vd/auth'
import type { VdLoginResult } from '../../types/vdApi'
import type { AuthUser } from '../../types/auth'
import { shouldRefreshAccessToken } from '../../utils/jwtExpiry'
import { mapVdPacienteUserToAuthUser } from '../../utils/vdAuthMapper'
import { loadPersistedAccessToken, setVdAccessToken } from './vdAccessToken'

export const SESSION_USER_KEY = '@telefarmed/session'

export async function persistAuthUser(user: AuthUser): Promise<void> {
  await AsyncStorage.setItem(SESSION_USER_KEY, JSON.stringify(user))
}

export async function applyAuthSession(result: VdLoginResult): Promise<AuthUser> {
  await setVdAccessToken(result.accessToken)
  const user = mapVdPacienteUserToAuthUser(result.user)
  await persistAuthUser(user)
  return user
}

export async function clearAuthSession(): Promise<void> {
  await setVdAccessToken(null)
  await AsyncStorage.removeItem(SESSION_USER_KEY)
}

async function restoreStoredUser(): Promise<AuthUser | null> {
  const storedUser = await AsyncStorage.getItem(SESSION_USER_KEY)
  if (!storedUser) return null

  try {
    return JSON.parse(storedUser) as AuthUser
  } catch {
    return null
  }
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
    const cachedUser = await restoreStoredUser()
    if (cachedUser) return cachedUser
    return null
  }
}

async function tryRefreshSession(): Promise<AuthUser | null> {
  try {
    return await applyAuthSession(await refresh())
  } catch {
    return null
  }
}

export async function restoreAuthSession(): Promise<AuthUser | null> {
  const refreshed = await tryRefreshSession()
  if (refreshed) return refreshed

  const token = await loadPersistedAccessToken()
  if (token) {
    const restored = await restoreFromAccessToken(token)
    if (restored) return restored
  }

  return restoreStoredUser()
}

export async function restoreSessionAfterBiometric(): Promise<AuthUser | null> {
  const refreshed = await tryRefreshSession()
  if (refreshed) return refreshed

  const token = await loadPersistedAccessToken()
  if (!token) return null

  return restoreFromAccessToken(token)
}

export async function refreshVdAuthSession(): Promise<AuthUser> {
  return applyAuthSession(await refresh())
}
