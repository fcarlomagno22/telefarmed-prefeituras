import AsyncStorage from '@react-native-async-storage/async-storage'
import { fetchMe, refresh } from '../api/vd/auth'
import type { VdLoginResult } from '../../types/vdApi'
import type { AuthUser } from '../../types/auth'
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

async function restoreFromAccessToken(token: string): Promise<AuthUser | null> {
  await setVdAccessToken(token)

  try {
    const vdUser = await fetchMe(token)
    const user = mapVdPacienteUserToAuthUser(vdUser)
    await persistAuthUser(user)
    return user
  } catch {
    await clearAuthSession()
    return null
  }
}

export async function restoreAuthSession(): Promise<AuthUser | null> {
  try {
    const refreshed = await refresh()
    return applyAuthSession(refreshed)
  } catch {
    // Refresh via cookie is expected on web; native may fall back to stored access token.
  }

  const token = await loadPersistedAccessToken()
  if (token) {
    return restoreFromAccessToken(token)
  }

  const storedUser = await AsyncStorage.getItem(SESSION_USER_KEY)
  if (storedUser) {
    await clearAuthSession()
  }

  return null
}

export async function restoreSessionAfterBiometric(): Promise<AuthUser | null> {
  try {
    const refreshed = await refresh()
    return applyAuthSession(refreshed)
  } catch {
    // Continue with stored access token when refresh cookie is unavailable.
  }

  const token = await loadPersistedAccessToken()
  if (!token) return null

  return restoreFromAccessToken(token)
}
