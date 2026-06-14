import { createContext, useContext, type ReactNode } from 'react'
import type { AuditLogsDataset } from '../../utils/auditLogs/getAuditLogsDataset'
import type { AuditLogScope } from '../../types/auditLogScope'

const AuditLogsScopeContext = createContext<{
  scope: AuditLogScope
  dataset: AuditLogsDataset
  isLoading?: boolean
} | null>(null)

type AuditLogsScopeProviderProps = {
  scope: AuditLogScope
  dataset: AuditLogsDataset
  isLoading?: boolean
  children: ReactNode
}

export function AuditLogsScopeProvider({
  scope,
  dataset,
  isLoading,
  children,
}: AuditLogsScopeProviderProps) {
  return (
    <AuditLogsScopeContext.Provider value={{ scope, dataset, isLoading }}>
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
