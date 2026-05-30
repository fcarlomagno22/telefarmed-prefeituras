import { useCallback, useRef, useState } from 'react'
import { AdminPageHeader } from '../admin/AdminPageHeader'
import { AuditLogsMainPanel } from './AuditLogsMainPanel'
import { AuditLogsMainPanelSkeleton } from './AuditLogsMainPanelSkeleton'
import { AuditLogsOverviewRow } from './AuditLogsOverviewRow'
import { AuditLogsOverviewRowSkeleton } from './AuditLogsOverviewRowSkeleton'
import { AuditLogsScopeProvider } from './AuditLogsScopeContext'
import {
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../layout/dashboardPageLayout'
import { DashboardPageHeader } from '../users/DashboardPageHeader'
import { DashboardPageHeaderSkeleton } from '../users/DashboardPageHeaderSkeleton'
import { usePageSkeletonLoading } from '../../hooks/usePageSkeletonLoading'
import {
  defaultAuditLogsAdvancedFilters,
  type AuditLogsAdvancedFilters,
} from '../../utils/auditLogsAdvancedFilters'
import type { AuditLogScope } from '../../types/auditLogScope'

const scopeHeaderCopy: Record<
  AuditLogScope,
  { title: string; subtitle: string; adminSection?: string; adminDescription?: string }
> = {
  ubt: {
    title: 'Logs de auditoria',
    subtitle: 'Rastreabilidade e registro de ações realizadas na unidade UBT.',
  },
  prefeitura: {
    title: 'Logs de auditoria',
    subtitle:
      'Rastreabilidade na rede municipal e nas UBTs vinculadas — ações de gestores, operadores e unidades.',
  },
  admin: {
    title: 'Auditoria global',
    subtitle: '',
    adminSection: 'Governança',
    adminDescription:
      'Visão unificada de todos os eventos em Admin Telefarmed, prefeituras, UBTs e fluxos de atendimento — tudo o que acontece na plataforma.',
  },
}

type AuditLogsPageContentProps = {
  scope: AuditLogScope
}

export function AuditLogsPageContent({ scope }: AuditLogsPageContentProps) {
  const isLoading = usePageSkeletonLoading(1200)
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState<AuditLogsAdvancedFilters>(
    () => defaultAuditLogsAdvancedFilters(),
  )
  const mainPanelRef = useRef<HTMLDivElement>(null)
  const headerCopy = scopeHeaderCopy[scope]

  const handleViewAllCritical = useCallback(() => {
    setAdvancedFilters((prev) => ({ ...prev, criticality: 'critical' }))
    setAdvancedFiltersOpen(false)
    requestAnimationFrame(() => {
      mainPanelRef.current
        ?.querySelector('[data-audit-logs-table-scroll]')
        ?.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }, [])

  return (
    <AuditLogsScopeProvider scope={scope}>
      {advancedFiltersOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-gray-900/30 backdrop-blur-sm transition-[backdrop-filter,background-color] duration-300"
          aria-label="Fechar filtros avançados"
          onClick={() => setAdvancedFiltersOpen(false)}
        />
      ) : null}

      <div className={dashboardPageShellClass} aria-busy={isLoading}>
        <div className={dashboardPageHeaderWrapClass}>
          {isLoading ? (
            <DashboardPageHeaderSkeleton />
          ) : scope === 'admin' ? (
            <AdminPageHeader
              sectionLabel={headerCopy.adminSection ?? 'Governança'}
              title={headerCopy.title}
              description={headerCopy.adminDescription ?? ''}
            />
          ) : (
            <DashboardPageHeader title={headerCopy.title} subtitle={headerCopy.subtitle} />
          )}
        </div>

        <div
          className={[
            dashboardPageScrollPaddingClass,
            'relative z-0 mt-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-5 lg:overflow-hidden',
          ].join(' ')}
        >
          {isLoading ? (
            <>
              <AuditLogsOverviewRowSkeleton />
              <div className="flex min-h-0 flex-1 flex-col">
                <AuditLogsMainPanelSkeleton />
              </div>
            </>
          ) : (
            <>
              <AuditLogsOverviewRow onViewAllCritical={handleViewAllCritical} />

              <div ref={mainPanelRef} className="flex min-h-0 flex-1 flex-col">
                <AuditLogsMainPanel
                  advancedOpen={advancedFiltersOpen}
                  onAdvancedOpenChange={setAdvancedFiltersOpen}
                  advancedFilters={advancedFilters}
                  onAdvancedFiltersChange={setAdvancedFilters}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </AuditLogsScopeProvider>
  )
}
