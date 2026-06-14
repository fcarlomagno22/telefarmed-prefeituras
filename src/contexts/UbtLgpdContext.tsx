import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useUbtAuth } from './UbtAuthContext'
import {
  checkUbtLgpdUnlockStatus,
  revokeUbtLgpd,
  unlockUbtLgpd,
  UbtAuthApiError,
} from '../lib/services/ubt/auth'
import {
  clearLgpdSession,
  readLgpdSession,
  writeLgpdSession,
} from '../utils/lgpdSession'

type UbtLgpdContextValue = {
  sensitiveDataUnlocked: boolean
  setSensitiveDataUnlocked: (value: boolean) => void
  verifyAndUnlock: (pin: string) => Promise<boolean>
  lockSensitiveData: () => Promise<void>
  unlockError: string | null
  clearUnlockError: () => void
}

const UbtLgpdContext = createContext<UbtLgpdContextValue | null>(null)

export function UbtLgpdProvider({ children }: { children: ReactNode }) {
  const { getAccessToken, user } = useUbtAuth()
  const [sensitiveDataUnlocked, setSensitiveDataUnlocked] = useState(false)
  const [unlockError, setUnlockError] = useState<string | null>(null)

  const validateSession = useCallback(async () => {
    if (!user?.id) {
      setSensitiveDataUnlocked(false)
      return
    }

    const session = readLgpdSession(user.id)
    if (!session) {
      setSensitiveDataUnlocked(false)
      return
    }

    const token = getAccessToken()
    if (!token) {
      setSensitiveDataUnlocked(false)
      return
    }

    try {
      const active = await checkUbtLgpdUnlockStatus(token, session.token, user.id)
      if (!active) {
        clearLgpdSession()
        setSensitiveDataUnlocked(false)
        return
      }
      setSensitiveDataUnlocked(true)
    } catch {
      clearLgpdSession()
      setSensitiveDataUnlocked(false)
    }
  }, [getAccessToken, user?.id])

  useEffect(() => {
    void validateSession()
  }, [validateSession])

  useEffect(() => {
    if (!user?.id || !sensitiveDataUnlocked) return

    const interval = window.setInterval(() => {
      void validateSession()
    }, 60_000)

    return () => window.clearInterval(interval)
  }, [sensitiveDataUnlocked, user?.id, validateSession])

  const verifyAndUnlock = useCallback(
    async (pin: string) => {
      const token = getAccessToken()
      if (!token || !user?.id) {
        setUnlockError('Sessão expirada. Faça login novamente.')
        return false
      }

      setUnlockError(null)

      try {
        const result = await unlockUbtLgpd(token, pin)
        writeLgpdSession({
          token: result.lgpdUnlockToken,
          expiresAt: result.expiresAt,
          operatorId: user.id,
        })
        setSensitiveDataUnlocked(true)
        return true
      } catch (error) {
        const message =
          error instanceof UbtAuthApiError
            ? error.message
            : 'Não foi possível validar a senha de autorização.'
        setUnlockError(message)
        return false
      }
    },
    [getAccessToken, user?.id],
  )

  const lockSensitiveData = useCallback(async () => {
    const token = getAccessToken()
    const session = user?.id ? readLgpdSession(user.id) : null

    clearLgpdSession()
    setSensitiveDataUnlocked(false)
    setUnlockError(null)

    if (token && session?.token) {
      try {
        await revokeUbtLgpd(token, session.token)
      } catch {
        // revogação idempotente no cliente
      }
    }
  }, [getAccessToken, user?.id])

  const value = useMemo<UbtLgpdContextValue>(
    () => ({
      sensitiveDataUnlocked,
      setSensitiveDataUnlocked,
      verifyAndUnlock,
      lockSensitiveData,
      unlockError,
      clearUnlockError: () => setUnlockError(null),
    }),
    [lockSensitiveData, sensitiveDataUnlocked, unlockError, verifyAndUnlock],
  )

  return <UbtLgpdContext.Provider value={value}>{children}</UbtLgpdContext.Provider>
}

export function useUbtLgpd(): UbtLgpdContextValue {
  const context = useContext(UbtLgpdContext)
  if (!context) {
    throw new Error('useUbtLgpd deve ser usado dentro de UbtLgpdProvider')
  }
  return context
}

export function useOptionalUbtLgpd(): UbtLgpdContextValue | null {
  return useContext(UbtLgpdContext)
}

/** Compatível com hooks legados fora do provider UBT. */
export function useUbtLgpdUnlock() {
  const context = useOptionalUbtLgpd()
  if (context) return context
  throw new Error('useUbtLgpdUnlock requer UbtLgpdProvider nas rotas UBT autenticadas.')
}
