import { createContext, useContext, type ReactNode } from 'react'
import { ubtUserCanViewPage } from '../config/ubtPageAccess'
import { useUbtAuth } from './UbtAuthContext'
import { usePortalSuportePage } from '../hooks/usePortalSuportePage'

type UbtSuporteContextValue = ReturnType<typeof usePortalSuportePage>

const UbtSuporteContext = createContext<UbtSuporteContextValue | null>(null)

export function UbtSuporteProvider({ children }: { children: ReactNode }) {
  const { getAccessToken, user } = useUbtAuth()
  const canViewSuporte = ubtUserCanViewPage(user, 'suporte')
  const suporte = usePortalSuportePage({
    variant: 'ubt',
    getAccessToken,
    enabled: canViewSuporte,
  })

  return <UbtSuporteContext.Provider value={suporte}>{children}</UbtSuporteContext.Provider>
}

export function useUbtSuportePageStateOptional(): UbtSuporteContextValue | null {
  return useContext(UbtSuporteContext)
}

export function useUbtSuporteAwaitingCount(): number {
  return useUbtSuportePageStateOptional()?.awaitingOperatorReplyCount ?? 0
}
