import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { isValidCpf } from '../utils/cpf'

const SESSION_STORAGE_KEY = 'crm-partners-auth-session'

export type CrmPartnersAuthUser = {
  nome: string
  cpf: string
}

type CrmPartnersAuthContextValue = {
  user: CrmPartnersAuthUser | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  login: (credentials: { cpf: string; password: string }) => Promise<CrmPartnersAuthUser>
  logout: () => Promise<void>
}

const CrmPartnersAuthContext = createContext<CrmPartnersAuthContextValue | null>(null)

function readStoredSession(): CrmPartnersAuthUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CrmPartnersAuthUser
    if (!parsed?.nome || !parsed?.cpf) return null
    return parsed
  } catch {
    return null
  }
}

export function CrmPartnersAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CrmPartnersAuthUser | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  useEffect(() => {
    setUser(readStoredSession())
    setIsBootstrapping(false)
  }, [])

  const login = useCallback(async (credentials: { cpf: string; password: string }) => {
    if (!isValidCpf(credentials.cpf)) {
      throw new Error('Informe um CPF válido.')
    }
    if (!credentials.password.trim()) {
      throw new Error('Informe sua senha.')
    }

    const nextUser: CrmPartnersAuthUser = {
      nome: 'Parceiro Comercial',
      cpf: credentials.cpf,
    }

    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
    return nextUser
  }, [])

  const logout = useCallback(async () => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isBootstrapping,
      login,
      logout,
    }),
    [user, isBootstrapping, login, logout],
  )

  return <CrmPartnersAuthContext.Provider value={value}>{children}</CrmPartnersAuthContext.Provider>
}

export function useCrmPartnersAuth() {
  const context = useContext(CrmPartnersAuthContext)
  if (!context) {
    throw new Error('useCrmPartnersAuth must be used within CrmPartnersAuthProvider')
  }
  return context
}
