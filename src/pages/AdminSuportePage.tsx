import { useCallback, useEffect, useRef, useState } from 'react'
import { AdminPageHeader } from '../components/admin/AdminPageHeader'
import { AdminSuporteMainPanel } from '../components/admin/suporte/AdminSuporteMainPanel'
import { SuporteMainPanelSkeleton } from '../components/suporte/SuporteMainPanelSkeleton'
import { SuporteSidebarPanel } from '../components/suporte/SuporteSidebarPanel'
import { SuporteSidebarPanelSkeleton } from '../components/suporte/SuporteSidebarPanelSkeleton'
import {
  suporteColumnFillClass,
  suporteColumnScrollClass,
  suporteColumnsGridClass,
} from '../components/suporte/suportePageLayout'
import {
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../components/layout/dashboardPageLayout'
import { Toast, type ToastVariant } from '../components/ui/Toast'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import {
  fetchSupportKpis,
  isAdminSuporteApiError,
  type SupportKpisResponse,
} from '../lib/services/admin/suporte'
import { mapSupportKpisForSidebar } from '../components/admin/suporte/adminSuporteUi'
import { useAdminSuporteBadgeActions } from '../contexts/AdminSuporteBadgeContext'

export function AdminSuportePage() {
  const { getAccessToken } = useAdminAuth()
  const suporteBadge = useAdminSuporteBadgeActions()
  const [kpis, setKpis] = useState<SupportKpisResponse | null>(null)
  const [isLoadingKpis, setIsLoadingKpis] = useState(true)
  const [kpisLoadError, setKpisLoadError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null)
  const hasLoadedKpisRef = useRef(false)

  const loadKpis = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setIsLoadingKpis(false)
      return
    }

    setKpisLoadError(null)
    if (!hasLoadedKpisRef.current) {
      setIsLoadingKpis(true)
    }

    try {
      const next = await fetchSupportKpis(token)
      setKpis(next)
      hasLoadedKpisRef.current = true
      await suporteBadge?.refresh()
    } catch (error) {
      const message = isAdminSuporteApiError(error)
        ? error.message
        : 'Não foi possível carregar os indicadores de suporte.'
      setKpisLoadError(message)
    } finally {
      setIsLoadingKpis(false)
    }
  }, [getAccessToken, suporteBadge])

  useEffect(() => {
    void loadKpis()
  }, [loadKpis])

  const sidebarData = kpis ? mapSupportKpisForSidebar(kpis) : null
  const showSkeleton = isLoadingKpis && kpis === null

  return (
    <div className={dashboardPageShellClass} aria-label="Suporte" aria-busy={showSkeleton}>
      <Toast
        message={toast?.message ?? ''}
        variant={toast?.variant ?? 'error'}
        visible={toast !== null}
        onClose={() => setToast(null)}
      />

      <div className={dashboardPageHeaderWrapClass}>
        <AdminPageHeader
          sectionLabel="Plataforma"
          title="Suporte"
          description="Central de chamados das prefeituras e UBTs com a equipe Telefarmed. Responda solicitações abertas em /ubt/suporte e /prefeitura/suporte."
        />
      </div>

      <div
        className={[
          suporteColumnsGridClass,
          dashboardPageScrollPaddingClass,
          'mt-4 pb-5',
        ].join(' ')}
      >
        <div className={suporteColumnScrollClass}>
          <div className={suporteColumnFillClass}>
            {kpisLoadError ? (
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <p>{kpisLoadError}</p>
                <button
                  type="button"
                  onClick={() => void loadKpis()}
                  className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                >
                  Tentar novamente
                </button>
              </div>
            ) : null}
            {showSkeleton ? (
              <SuporteMainPanelSkeleton showUbtColumn />
            ) : (
              <AdminSuporteMainPanel
                awaitingCount={sidebarData?.awaitingCount ?? kpis?.awaitingCount ?? 0}
                onNotify={(message, variant = 'error') => setToast({ message, variant })}
                onRefreshKpis={loadKpis}
              />
            )}
          </div>
        </div>

        <div className={suporteColumnScrollClass}>
          <div className={suporteColumnFillClass}>
            {showSkeleton ? (
              <SuporteSidebarPanelSkeleton />
            ) : sidebarData ? (
              <SuporteSidebarPanel
                statusSummary={sidebarData.statusSummary}
                priorityDistribution={sidebarData.priorityDistribution}
                monthlyTrend={sidebarData.monthlyTrend}
                monthlyTotal={sidebarData.monthlyTotal}
                summaryTitle="Chamados da plataforma"
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
