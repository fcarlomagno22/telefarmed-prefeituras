import { createContext, useContext, type ReactNode } from 'react'
import { usePrefeituraAuth } from './PrefeituraAuthContext'
import { usePortalSuportePage } from '../hooks/usePortalSuportePage'

type PrefeituraSuporteContextValue = ReturnType<typeof usePortalSuportePage>

const PrefeituraSuporteContext = createContext<PrefeituraSuporteContextValue | null>(null)

export function PrefeituraSuporteProvider({ children }: { children: ReactNode }) {
  const { getAccessToken } = usePrefeituraAuth()
  const suporte = usePortalSuportePage({
    variant: 'prefeitura',
    getAccessToken,
  })

  return (
    <PrefeituraSuporteContext.Provider value={suporte}>{children}</PrefeituraSuporteContext.Provider>
  )
}

export function usePrefeituraSuportePageStateOptional(): PrefeituraSuporteContextValue | null {
  return useContext(PrefeituraSuporteContext)
}

export function usePrefeituraSuporteAwaitingCount(): number {
  return usePrefeituraSuportePageStateOptional()?.awaitingOperatorReplyCount ?? 0
}
