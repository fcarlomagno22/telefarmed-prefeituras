import { createContext, useContext, type ReactNode } from 'react'
import { useProfissionalAuth } from './ProfissionalAuthContext'
import { usePortalSuportePage } from '../hooks/usePortalSuportePage'

type ProfissionalSuporteContextValue = ReturnType<typeof usePortalSuportePage>

const ProfissionalSuporteContext = createContext<ProfissionalSuporteContextValue | null>(null)

export function ProfissionalSuporteProvider({ children }: { children: ReactNode }) {
  const { getAccessToken } = useProfissionalAuth()
  const suporte = usePortalSuportePage({
    variant: 'profissional',
    getAccessToken,
  })

  return (
    <ProfissionalSuporteContext.Provider value={suporte}>{children}</ProfissionalSuporteContext.Provider>
  )
}

export function useProfissionalSuportePageState(): ProfissionalSuporteContextValue {
  const context = useContext(ProfissionalSuporteContext)
  if (!context) {
    throw new Error('useProfissionalSuportePageState must be used within ProfissionalSuporteProvider')
  }
  return context
}

export function useProfissionalSuportePageStateOptional(): ProfissionalSuporteContextValue | null {
  return useContext(ProfissionalSuporteContext)
}

export function useProfissionalSuporteAwaitingCount(): number {
  return useProfissionalSuportePageStateOptional()?.awaitingOperatorReplyCount ?? 0
}

export function useProfissionalSuporteUnreadCount(): number {
  return useProfissionalSuportePageStateOptional()?.unreadSupportMessagesCount ?? 0
}
