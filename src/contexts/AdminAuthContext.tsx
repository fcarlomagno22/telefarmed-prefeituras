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
import { emptyAdminPagePermissions } from '../config/adminCredenciaisConfig'
import { registerAdminAccessTokenRefresh } from '../lib/api/adminAuthRefresh'
import { isBackendApiEnabled } from '../lib/api/config'
import {
  clearAuthSessionRevoked,
  isAuthSessionRevoked,
  markAuthSessionRevoked,
  notifyUnauthorizedSession,
} from '../lib/auth/sessionRevocation'
import { bootstrapTabBoundAuthSession } from '../lib/auth/bootstrapTabBoundSession'
import type { AdminAuthUser } from '../lib/mockAuth/adminAuthMock'
import {
  AdminAuthApiError,
  adminLogin,
  adminLogout,
  adminRefreshSession,
  adminFetchCurrentUser,
  readAdminMockSession,
  writeAdminMockSession,
} from '../lib/services/admin/auth'
import { useAuthSessionGuard } from '../hooks/useAuthSessionGuard'

function normalizeAdminUser(user: AdminAuthUser): AdminAuthUser {
  return {
    ...user,
    pagePermissions: user.pagePermissions ?? emptyAdminPagePermissions(),
  }
}

type AdminAuthContextValue = {
  user: AdminAuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  login: (credentials: { cpf: string; password: string }) => Promise<AdminAuthUser>
  logout: () => Promise<void>
  getAccessToken: () => string | null
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminAuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const accessTokenRef = useRef<string | null>(null)
  const userIdRef = useRef<string | null>(null)

  const applySession = useCallback(
    (token: string, nextUser: AdminAuthUser, options?: { silent?: boolean }) => {
      const normalized = normalizeAdminUser(nextUser)
      accessTokenRef.current = token
      userIdRef.current = normalized.id
      writeAdminMockSession(token, normalized)
      clearAuthSessionRevoked('admin')

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
    writeAdminMockSession(null, null)
  }, [])

  const forceLogout = useCallback(async () => {
    markAuthSessionRevoked('admin')
    clearSession()
    if (
      typeof window !== 'undefined' &&
      !window.location.pathname.startsWith('/admin/login')
    ) {
      window.location.replace('/admin/login')
    }
  }, [clearSession])

  const revalidateSession = useCallback(async () => {
    if (!isBackendApiEnabled()) return

    if (isAuthSessionRevoked('admin')) {
      notifyUnauthorizedSession('admin')
      return
    }

    try {
      const result = await adminRefreshSession()
      const sameUser = userIdRef.current === result.user.id
      applySession(result.accessToken, result.user, { silent: sameUser })
    } catch (error) {
      if (error instanceof AdminAuthApiError) {
        notifyUnauthorizedSession('admin')
        return
      }
      throw error
    }
  }, [applySession])

  const refreshAccessToken = useCallback(async () => {
    const result = await adminRefreshSession()
    const sameUser = userIdRef.current === result.user.id
    applySession(result.accessToken, result.user, { silent: sameUser })
    return result.accessToken
  }, [applySession])

  const getAccessToken = useCallback(() => accessTokenRef.current, [])

  useEffect(() => {
    registerAdminAccessTokenRefresh(async () => {
      if (isAuthSessionRevoked('admin')) return null
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
      if (isAuthSessionRevoked('admin')) {
        if (!cancelled) {
          clearSession()
          setIsBootstrapping(false)
        }
        return
      }

      await bootstrapTabBoundAuthSession({
        readSession: readAdminMockSession,
        fetchMe: adminFetchCurrentUser,
        refresh: adminRefreshSession,
        onRestore: (token, nextUser) => {
          if (!cancelled) applySession(token, nextUser)
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
    scope: 'admin',
    isAuthenticated: Boolean(user && accessToken),
    accessToken,
    onForceLogout: forceLogout,
    revalidateSession,
    refreshAccessToken: isBackendApiEnabled() ? refreshAccessToken : undefined,
  })

  const login = useCallback(
    async (credentials: { cpf: string; password: string }) => {
      try {
        clearAuthSessionRevoked('admin')
        const result = await adminLogin(credentials)
        applySession(result.accessToken, result.user)
        return result.user
      } catch (error) {
        if (error instanceof AdminAuthApiError) {
          throw error
        }
        throw new AdminAuthApiError('Não foi possível concluir o login.', 0)
      }
    },
    [applySession],
  )

  const logout = useCallback(async () => {
    markAuthSessionRevoked('admin')
    await adminLogout()
    clearSession()
  }, [clearSession])

  const value = useMemo<AdminAuthContextValue>(
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

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth deve ser usado dentro de AdminAuthProvider')
  }
  return context
}

export function useOptionalAdminAuth(): AdminAuthContextValue | null {
  return useContext(AdminAuthContext)
}

export type { AdminAuthUser } from '../lib/mockAuth/adminAuthMock'
