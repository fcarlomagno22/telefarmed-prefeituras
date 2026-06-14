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
import { emptyProfissionalPagePermissions } from '../config/profissionalCredenciaisConfig'
import { registerProfissionalAccessTokenRefresh } from '../lib/api/profissionalAuthRefresh'
import { isBackendApiEnabled } from '../lib/api/config'
import {
  clearAuthSessionRevoked,
  isAuthSessionRevoked,
  markAuthSessionRevoked,
  notifyUnauthorizedSession,
} from '../lib/auth/sessionRevocation'
import { bootstrapTabBoundAuthSession } from '../lib/auth/bootstrapTabBoundSession'
import {
  ProfissionalAuthApiError,
  profissionalFetchCurrentUser,
  profissionalLogin,
  profissionalLogout,
  profissionalRefreshSession,
  readProfissionalMockSession,
  writeProfissionalMockSession,
  type ProfissionalAuthUser,
} from '../lib/services/profissional/auth'
import { useAuthSessionGuard } from '../hooks/useAuthSessionGuard'
import { clearProfissionalPortalPageCaches } from '../utils/portal/portalPageCache'
import { setSessionUserDisplayName } from '../utils/sessionUser'

function normalizeProfissionalUser(user: ProfissionalAuthUser): ProfissionalAuthUser {
  return {
    ...user,
    sexo: user.sexo ?? 'nao_informado',
    pagePermissions: user.pagePermissions ?? emptyProfissionalPagePermissions(),
  }
}

type ProfissionalAuthContextValue = {
  user: ProfissionalAuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  login: (credentials: { cpf: string; password: string }) => Promise<ProfissionalAuthUser>
  logout: () => Promise<void>
  getAccessToken: () => string | null
}

const ProfissionalAuthContext = createContext<ProfissionalAuthContextValue | null>(null)

export function ProfissionalAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ProfissionalAuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const accessTokenRef = useRef<string | null>(null)
  const userIdRef = useRef<string | null>(null)

  const applySession = useCallback(
    (token: string, nextUser: ProfissionalAuthUser, options?: { silent?: boolean }) => {
      const normalized = normalizeProfissionalUser(nextUser)
      accessTokenRef.current = token
      userIdRef.current = normalized.id
      writeProfissionalMockSession(token, normalized)
      clearAuthSessionRevoked('profissional')
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
    clearProfissionalPortalPageCaches()
    setAccessToken(null)
    setUser(null)
    setSessionUserDisplayName(null)
    writeProfissionalMockSession(null, null)
  }, [])

  const forceLogout = useCallback(async () => {
    markAuthSessionRevoked('profissional')
    clearSession()
    if (
      typeof window !== 'undefined' &&
      !window.location.pathname.startsWith('/profissional/login')
    ) {
      window.location.replace('/profissional/login')
    }
  }, [clearSession])

  const revalidateSession = useCallback(async () => {
    if (!isBackendApiEnabled()) return

    if (isAuthSessionRevoked('profissional')) {
      notifyUnauthorizedSession('profissional')
      return
    }

    try {
      const result = await profissionalRefreshSession()
      const sameUser = userIdRef.current === result.user.id
      applySession(result.accessToken, result.user, { silent: sameUser })
    } catch (error) {
      if (error instanceof ProfissionalAuthApiError) {
        notifyUnauthorizedSession('profissional')
        return
      }
      throw error
    }
  }, [applySession])

  const refreshAccessToken = useCallback(async () => {
    const result = await profissionalRefreshSession()
    const sameUser = userIdRef.current === result.user.id
    applySession(result.accessToken, result.user, { silent: sameUser })
    return result.accessToken
  }, [applySession])

  const getAccessToken = useCallback(() => accessTokenRef.current, [])

  useEffect(() => {
    registerProfissionalAccessTokenRefresh(async () => {
      if (isAuthSessionRevoked('profissional')) return null
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
      if (isAuthSessionRevoked('profissional')) {
        if (!cancelled) {
          clearSession()
          setIsBootstrapping(false)
        }
        return
      }

      await bootstrapTabBoundAuthSession({
        readSession: readProfissionalMockSession,
        fetchMe: profissionalFetchCurrentUser,
        refresh: profissionalRefreshSession,
        onRestore: (token, nextUser) => {
          if (!cancelled) applySession(token, normalizeProfissionalUser(nextUser))
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
    scope: 'profissional',
    isAuthenticated: Boolean(user && accessToken),
    accessToken,
    onForceLogout: forceLogout,
    revalidateSession,
    refreshAccessToken: isBackendApiEnabled() ? refreshAccessToken : undefined,
  })

  const login = useCallback(
    async (credentials: { cpf: string; password: string }) => {
      try {
        clearAuthSessionRevoked('profissional')
        const result = await profissionalLogin(credentials)
        applySession(result.accessToken, result.user)
        return result.user
      } catch (error) {
        if (error instanceof ProfissionalAuthApiError) {
          throw error
        }
        throw new ProfissionalAuthApiError('Não foi possível concluir o login.', 0)
      }
    },
    [applySession],
  )

  const logout = useCallback(async () => {
    markAuthSessionRevoked('profissional')
    await profissionalLogout()
    clearSession()
  }, [clearSession])

  const value = useMemo<ProfissionalAuthContextValue>(
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
    <ProfissionalAuthContext.Provider value={value}>{children}</ProfissionalAuthContext.Provider>
  )
}

export function useProfissionalAuth(): ProfissionalAuthContextValue {
  const context = useContext(ProfissionalAuthContext)
  if (!context) {
    throw new Error('useProfissionalAuth deve ser usado dentro de ProfissionalAuthProvider')
  }
  return context
}

export function useOptionalProfissionalAuth(): ProfissionalAuthContextValue | null {
  return useContext(ProfissionalAuthContext)
}

export type { ProfissionalAuthUser } from '../lib/services/profissional/auth'
