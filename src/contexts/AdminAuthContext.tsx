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
import {
  adminFetchMe,
  adminLogin,
  adminLogout,
  adminRefreshSession,
  type AdminAuthUser,
  AdminAuthApiError,
} from '../lib/api/adminAuthApi'

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

const ACCESS_TOKEN_STORAGE_KEY = 'telefarmed.admin.accessToken'
const BOOTSTRAP_RETRY_DELAYS_MS = [0, 400, 900] as const

function isTransientBootstrapError(error: unknown): boolean {
  if (error instanceof AdminAuthApiError) {
    return error.status === 0 || error.status === 502 || error.status === 503
  }
  return false
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

async function bootstrapAdminSession(accessToken: string | null) {
  let lastError: unknown

  for (const delayMs of BOOTSTRAP_RETRY_DELAYS_MS) {
    if (delayMs > 0) {
      await sleep(delayMs)
    }

    try {
      if (accessToken) {
        try {
          const me = await adminFetchMe(accessToken)
          return { kind: 'session' as const, accessToken, user: me.user }
        } catch (error) {
          if (!isTransientBootstrapError(error)) {
            // access token expirado ou inválido — tenta renovar via cookie httpOnly
            break
          }
          lastError = error
          continue
        }
      }

      const refreshed = await adminRefreshSession()
      return {
        kind: 'session' as const,
        accessToken: refreshed.accessToken,
        user: refreshed.user,
      }
    } catch (error) {
      lastError = error
      if (!isTransientBootstrapError(error)) {
        throw error
      }
    }
  }

  throw lastError ?? new AdminAuthApiError('Falha de conexão com o servidor.', 0)
}

function readStoredAccessToken(): string | null {
  try {
    return sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

function writeStoredAccessToken(token: string | null): void {
  try {
    if (!token) {
      sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
      return
    }
    sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token)
  } catch {
    // sessionStorage indisponível (modo privado, etc.)
  }
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminAuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(() => readStoredAccessToken())
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const bootstrapStarted = useRef(false)

  const applySession = useCallback((token: string, nextUser: AdminAuthUser) => {
    setAccessToken(token)
    setUser(normalizeAdminUser(nextUser))
    writeStoredAccessToken(token)
  }, [])

  const clearSession = useCallback(() => {
    setAccessToken(null)
    setUser(null)
    writeStoredAccessToken(null)
  }, [])

  useEffect(() => {
    if (bootstrapStarted.current) return
    bootstrapStarted.current = true

    async function bootstrap() {
      try {
        const session = await bootstrapAdminSession(accessToken)
        applySession(session.accessToken, session.user)
      } catch {
        clearSession()
      } finally {
        setIsBootstrapping(false)
      }
    }

    void bootstrap()
  }, [accessToken, applySession, clearSession])

  const login = useCallback(
    async (credentials: { cpf: string; password: string }) => {
      try {
        const result = await adminLogin(credentials)
        applySession(result.accessToken, result.user)
        return result.user
      } catch (error) {
        if (error instanceof AdminAuthApiError) {
          throw error
        }
        throw new AdminAuthApiError('Falha de conexão com o servidor.', 0)
      }
    },
    [applySession],
  )

  const logout = useCallback(async () => {
    try {
      await adminLogout()
    } finally {
      clearSession()
    }
  }, [clearSession])

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(user && accessToken),
      isBootstrapping,
      login,
      logout,
      getAccessToken: () => accessToken,
    }),
    [user, accessToken, isBootstrapping, login, logout],
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
