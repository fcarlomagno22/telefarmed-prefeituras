import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { emptyPagePermissions } from '../config/accessCredentials'
import { registerUbtAccessTokenRefresh } from '../lib/api/ubtAuthRefresh'
import { isBackendApiEnabled } from '../lib/api/config'
import {
  clearAuthSessionRevoked,
  isAuthSessionRevoked,
  markAuthSessionRevoked,
  notifyUnauthorizedSession,
} from '../lib/auth/sessionRevocation'
import { bootstrapTabBoundAuthSession } from '../lib/auth/bootstrapTabBoundSession'
import {
  UbtAuthApiError,
  ubtLogin,
  ubtLogout,
  ubtRefreshSession,
  ubtFetchCurrentUser,
  readUbtMockSession,
  writeUbtMockSession,
  clearLgpdSession,
  type UbtAuthUser,
  type UbtSystemPermissions,
} from '../lib/services/ubt/auth'
import { useAuthSessionGuard } from '../hooks/useAuthSessionGuard'
import { setSessionUserDisplayName } from '../utils/sessionUser'

function emptyUbtSystemPermissions(): UbtAuthUser['systemPermissions'] {
  return emptyPagePermissions() as UbtSystemPermissions
}

function normalizeUbtUser(user: UbtAuthUser): UbtAuthUser {
  return {
    ...user,
    systemPermissions: user.systemPermissions ?? emptyUbtSystemPermissions(),
  }
}

type UbtAuthContextValue = {
  user: UbtAuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  login: (credentials: { cpf: string; password: string }) => Promise<UbtAuthUser>
  logout: () => Promise<void>
  getAccessToken: () => string | null
}

const UbtAuthContext = createContext<UbtAuthContextValue | null>(null)

export function UbtAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UbtAuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const accessTokenRef = useRef<string | null>(null)
  const userIdRef = useRef<string | null>(null)

  const applySession = useCallback(
    (token: string, nextUser: UbtAuthUser, options?: { silent?: boolean }) => {
      const normalized = normalizeUbtUser(nextUser)
      accessTokenRef.current = token
      userIdRef.current = normalized.id
      writeUbtMockSession(token, normalized)
      clearAuthSessionRevoked('ubt')
      setSessionUserDisplayName(normalized.nome)

      if (options?.silent) {
        return
      }

      setAccessToken(token)
      setUser(normalized)
    },
    [],
  )

  const clearSession = useCallback(() => {
    accessTokenRef.current = null
    userIdRef.current = null
    setAccessToken(null)
    setUser(null)
    setSessionUserDisplayName(null)
    writeUbtMockSession(null, null)
  }, [])

  const forceLogout = useCallback(async () => {
    markAuthSessionRevoked('ubt')
    clearSession()
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/ubt/login')) {
      window.location.replace('/ubt/login')
    }
  }, [clearSession])

  const revalidateSession = useCallback(async () => {
    if (!isBackendApiEnabled()) return

    if (isAuthSessionRevoked('ubt')) {
      notifyUnauthorizedSession('ubt')
      return
    }

    try {
      const result = await ubtRefreshSession()
      const sameUser = userIdRef.current === result.user.id
      applySession(result.accessToken, result.user, { silent: sameUser })
    } catch (error) {
      if (error instanceof UbtAuthApiError) {
        notifyUnauthorizedSession('ubt')
        return
      }
      throw error
    }
  }, [applySession])

  const refreshAccessToken = useCallback(async () => {
    const result = await ubtRefreshSession()
    const sameUser = userIdRef.current === result.user.id
    applySession(result.accessToken, result.user, { silent: sameUser })
    return result.accessToken
  }, [applySession])

  const getAccessToken = useCallback(() => accessTokenRef.current, [])

  useEffect(() => {
    registerUbtAccessTokenRefresh(async () => {
      if (isAuthSessionRevoked('ubt')) return null
      try {
        return await refreshAccessToken()
      } catch {
        return null
      }
    })
  }, [refreshAccessToken])

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      if (isAuthSessionRevoked('ubt')) {
        if (!cancelled) {
          clearSession()
          setIsBootstrapping(false)
        }
        return
      }

      await bootstrapTabBoundAuthSession({
        readSession: readUbtMockSession,
        fetchMe: ubtFetchCurrentUser,
        refresh: ubtRefreshSession,
        onRestore: (token, nextUser) => {
          if (!cancelled) applySession(token, normalizeUbtUser(nextUser))
        },
        onClear: () => {
          if (!cancelled) clearSession()
        },
      })

      if (!cancelled) setIsBootstrapping(false)
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [applySession, clearSession])

  useAuthSessionGuard({
    scope: 'ubt',
    isAuthenticated: Boolean(user && accessToken),
    accessToken,
    onForceLogout: forceLogout,
    revalidateSession,
    refreshAccessToken: isBackendApiEnabled() ? refreshAccessToken : undefined,
  })

  const login = useCallback(
    async (credentials: { cpf: string; password: string }) => {
      try {
        clearAuthSessionRevoked('ubt')
        const result = await ubtLogin(credentials)
        applySession(result.accessToken, result.user)
        return result.user
      } catch (error) {
        if (error instanceof UbtAuthApiError) {
          throw error
        }
        throw new UbtAuthApiError('Não foi possível concluir o login.', 0)
      }
    },
    [applySession],
  )

  const logout = useCallback(async () => {
    markAuthSessionRevoked('ubt')
    clearLgpdSession()
    await ubtLogout()
    clearSession()
  }, [clearSession])

  const value = useMemo<UbtAuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(user && accessToken),
      isBootstrapping,
      login,
      logout,
      getAccessToken,
    }),
    [user, accessToken, isBootstrapping, login, logout, getAccessToken],
  )

  return <UbtAuthContext.Provider value={value}>{children}</UbtAuthContext.Provider>
}

export function useUbtAuth(): UbtAuthContextValue {
  const context = useContext(UbtAuthContext)
  if (!context) {
    throw new Error('useUbtAuth deve ser usado dentro de UbtAuthProvider')
  }
  return context
}

export function useOptionalUbtAuth(): UbtAuthContextValue | null {
  return useContext(UbtAuthContext)
}

export type { UbtAuthUser } from '../lib/services/ubt/auth'
