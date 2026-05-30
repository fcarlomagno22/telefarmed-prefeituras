import { createContext, useContext, type ReactNode } from 'react'
import { getAuditLogsDataset, type AuditLogsDataset } from '../../utils/auditLogs/getAuditLogsDataset'
import type { AuditLogScope } from '../../types/auditLogScope'

const AuditLogsScopeContext = createContext<{
  scope: AuditLogScope
  dataset: AuditLogsDataset
} | null>(null)

type AuditLogsScopeProviderProps = {
  scope: AuditLogScope
  children: ReactNode
}

export function AuditLogsScopeProvider({ scope, children }: AuditLogsScopeProviderProps) {
  const dataset = getAuditLogsDataset(scope)

  return (
    <AuditLogsScopeContext.Provider value={{ scope, dataset }}>
      {children}
    </AuditLogsScopeContext.Provider>
  )
}

export function useAuditLogsScopeContext() {
  const value = useContext(AuditLogsScopeContext)
  if (!value) {
    throw new Error('useAuditLogsScopeContext must be used within AuditLogsScopeProvider')
  }
  return value
}
