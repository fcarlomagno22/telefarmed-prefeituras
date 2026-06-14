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
import { emptyPrefeituraPagePermissions } from '../config/prefeituraCredenciaisConfig'
import { registerPrefeituraAccessTokenRefresh } from '../lib/api/prefeituraAuthRefresh'
import { isBackendApiEnabled } from '../lib/api/config'
import {
  clearAuthSessionRevoked,
  isAuthSessionRevoked,
  markAuthSessionRevoked,
  notifyUnauthorizedSession,
} from '../lib/auth/sessionRevocation'
import { bootstrapTabBoundAuthSession } from '../lib/auth/bootstrapTabBoundSession'
import {
  PrefeituraAuthApiError,
  prefeituraLogin,
  prefeituraLogout,
  prefeituraRefreshSession,
  prefeituraFetchCurrentUser,
  readPrefeituraMockSession,
  writePrefeituraMockSession,
  type PrefeituraAuthUser,
} from '../lib/services/prefeitura/auth'
import { useAuthSessionGuard } from '../hooks/useAuthSessionGuard'
import { setSessionUserDisplayName } from '../utils/sessionUser'

function normalizePrefeituraUser(user: PrefeituraAuthUser): PrefeituraAuthUser {
  return {
    ...user,
    pagePermissions: user.pagePermissions ?? emptyPrefeituraPagePermissions(),
  }
}

type PrefeituraAuthContextValue = {
  user: PrefeituraAuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  login: (credentials: { cpf: string; password: string }) => Promise<PrefeituraAuthUser>
  logout: () => Promise<void>
  getAccessToken: () => string | null
}

const PrefeituraAuthContext = createContext<PrefeituraAuthContextValue | null>(null)

export function PrefeituraAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PrefeituraAuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const accessTokenRef = useRef<string | null>(null)
  const userIdRef = useRef<string | null>(null)

  const applySession = useCallback(
    (token: string, nextUser: PrefeituraAuthUser, options?: { silent?: boolean }) => {
      const normalized = normalizePrefeituraUser(nextUser)
      accessTokenRef.current = token
      userIdRef.current = normalized.id
      writePrefeituraMockSession(token, normalized)
      clearAuthSessionRevoked('prefeitura')
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
    writePrefeituraMockSession(null, null)
  }, [])

  const forceLogout = useCallback(async () => {
    markAuthSessionRevoked('prefeitura')
    clearSession()
    if (
      typeof window !== 'undefined' &&
      !window.location.pathname.startsWith('/prefeitura/login')
    ) {
      window.location.replace('/prefeitura/login')
    }
  }, [clearSession])

  const revalidateSession = useCallback(async () => {
    if (!isBackendApiEnabled()) return

    if (isAuthSessionRevoked('prefeitura')) {
      notifyUnauthorizedSession('prefeitura')
      return
    }

    try {
      const result = await prefeituraRefreshSession()
      const sameUser = userIdRef.current === result.user.id
      applySession(result.accessToken, result.user, { silent: sameUser })
    } catch (error) {
      if (error instanceof PrefeituraAuthApiError) {
        notifyUnauthorizedSession('prefeitura')
        return
      }
      throw error
    }
  }, [applySession])

  const refreshAccessToken = useCallback(async () => {
    const result = await prefeituraRefreshSession()
    const sameUser = userIdRef.current === result.user.id
    applySession(result.accessToken, result.user, { silent: sameUser })
    return result.accessToken
  }, [applySession])

  const getAccessToken = useCallback(() => accessTokenRef.current, [])

  useEffect(() => {
    registerPrefeituraAccessTokenRefresh(async () => {
      if (isAuthSessionRevoked('prefeitura')) return null
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
      if (isAuthSessionRevoked('prefeitura')) {
        if (!cancelled) {
          clearSession()
          setIsBootstrapping(false)
        }
        return
      }

      await bootstrapTabBoundAuthSession({
        readSession: readPrefeituraMockSession,
        fetchMe: prefeituraFetchCurrentUser,
        refresh: prefeituraRefreshSession,
        onRestore: (token, nextUser) => {
          if (!cancelled) applySession(token, normalizePrefeituraUser(nextUser))
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
    scope: 'prefeitura',
    isAuthenticated: Boolean(user && accessToken),
    accessToken,
    onForceLogout: forceLogout,
    revalidateSession,
    refreshAccessToken: isBackendApiEnabled() ? refreshAccessToken : undefined,
  })

  const login = useCallback(
    async (credentials: { cpf: string; password: string }) => {
      try {
        clearAuthSessionRevoked('prefeitura')
        const result = await prefeituraLogin(credentials)
        applySession(result.accessToken, result.user)
        return result.user
      } catch (error) {
        if (error instanceof PrefeituraAuthApiError) {
          throw error
        }
        throw new PrefeituraAuthApiError('Não foi possível concluir o login.', 0)
      }
    },
    [applySession],
  )

  const logout = useCallback(async () => {
    markAuthSessionRevoked('prefeitura')
    await prefeituraLogout()
    clearSession()
  }, [clearSession])

  const value = useMemo<PrefeituraAuthContextValue>(
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

  return (
    <PrefeituraAuthContext.Provider value={value}>{children}</PrefeituraAuthContext.Provider>
  )
}

export function usePrefeituraAuth(): PrefeituraAuthContextValue {
  const context = useContext(PrefeituraAuthContext)
  if (!context) {
    throw new Error('usePrefeituraAuth deve ser usado dentro de PrefeituraAuthProvider')
  }
  return context
}

export function useOptionalPrefeituraAuth(): PrefeituraAuthContextValue | null {
  return useContext(PrefeituraAuthContext)
}

export type { PrefeituraAuthUser } from '../lib/services/prefeitura/auth'
