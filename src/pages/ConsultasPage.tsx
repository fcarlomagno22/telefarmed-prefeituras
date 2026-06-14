import { useCallback, useMemo, useState } from 'react'
import { ConsultasKpiStrip } from '../components/consultas/ConsultasKpiStrip'
import { ConsultasMainPanel } from '../components/consultas/ConsultasMainPanel'
import { ConsultasMainPanelSkeleton } from '../components/consultas/ConsultasMainPanelSkeleton'
import { ConsultasSidebarPanel } from '../components/consultas/ConsultasSidebarPanel'
import { ConsultasSidebarPanelSkeleton } from '../components/consultas/ConsultasSidebarPanelSkeleton'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import {
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../components/layout/dashboardPageLayout'
import { DashboardPageHeader } from '../components/users/DashboardPageHeader'
import { DashboardPageHeaderSkeleton } from '../components/users/DashboardPageHeaderSkeleton'
import { useBrandTheme } from '../hooks/useBrandTheme'
import { useConsultasOverview, useDefaultConsultasPeriod } from '../hooks/useConsultasPage'
import { useNetworkUserDrawer } from '../hooks/useNetworkUserDrawer'
import { useUbtAuth } from '../contexts/UbtAuthContext'
import {
  fetchUbtPacienteConsultas,
  fetchUbtPacienteDetail,
  fetchUbtPacienteRow,
} from '../lib/services/ubt/pacientes'
import { loadUbtPacienteDrawerData } from '../utils/ubtPacientesDetail'

export function ConsultasPage() {
  useBrandTheme()
  const { getAccessToken, isBootstrapping, isAuthenticated } = useUbtAuth()
  const defaultPeriod = useDefaultConsultasPeriod()
  const [period, setPeriod] = useState(defaultPeriod)
  const { overview, isLoading: overviewLoading, isRefreshing } = useConsultasOverview(
    period.start,
    period.end,
  )

  const loadPacienteDetail = useCallback(
    async (pacienteId: string) => {
      const token = getAccessToken()
      if (!token) {
        throw new Error('Sessão expirada.')
      }

      return loadUbtPacienteDrawerData(
        (id) => fetchUbtPacienteRow(token, id),
        (id) => fetchUbtPacienteDetail(token, id),
        pacienteId,
        (id) => fetchUbtPacienteConsultas(token, id),
      )
    },
    [getAccessToken],
  )

  const networkUserDrawer = useNetworkUserDrawer({ loadPacienteDetail, getAccessToken })

  const isInitialLoading = isBootstrapping || (isAuthenticated && overviewLoading)
  const periodKey = useMemo(() => `${period.start}-${period.end}`, [period.end, period.start])

  return (
    <DashboardLayout>
      <div className={dashboardPageShellClass}>
        <div className={dashboardPageHeaderWrapClass}>
          {isInitialLoading ? (
            <DashboardPageHeaderSkeleton />
          ) : (
            <DashboardPageHeader
              title="Consultas"
              subtitle="Histórico e gestão de atendimentos realizados"
            />
          )}
        </div>

        <div
          className={[
            dashboardPageScrollPaddingClass,
            'mt-4 flex min-h-0 flex-1 flex-col gap-4 pb-5',
          ].join(' ')}
        >
          <ConsultasKpiStrip
            summary={overview.summary}
            avgDurationMinutes={overview.avgDurationMinutes}
            periodKey={periodKey}
            isLoading={isInitialLoading}
          />

          <section
            className={[
              'grid min-h-0 flex-1 gap-4',
              'xl:grid xl:grid-cols-[minmax(0,1fr)_320px] xl:grid-rows-1 xl:items-stretch',
            ].join(' ')}
          >
            {isInitialLoading ? (
              <>
                <div className="flex h-full min-h-0 min-w-0 flex-col">
                  <ConsultasMainPanelSkeleton />
                </div>
                <div className="flex h-full min-h-0 min-w-0 flex-col">
                  <ConsultasSidebarPanelSkeleton />
                </div>
              </>
            ) : (
              <>
                <ConsultasMainPanel
                  networkUserDrawer={networkUserDrawer}
                  filterOptions={overview.filterOptions}
                  onAppliedPeriodChange={(start, end) => setPeriod({ start, end })}
                />
                <ConsultasSidebarPanel
                  summary={overview.summary}
                  statusDistribution={overview.statusDistribution}
                  specialtyDistribution={overview.specialtyDistribution}
                  genderDistribution={overview.genderDistribution}
                  isLoading={isRefreshing}
                />
              </>
            )}
          </section>
        </div>
      </div>
    </DashboardLayout>
  )
}
