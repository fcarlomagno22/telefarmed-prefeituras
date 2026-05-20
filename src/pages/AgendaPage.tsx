import { useCallback, useMemo, useState } from 'react'
import { AgendaMainPanel } from '../components/agenda/AgendaMainPanel'
import { AgendaMainPanelSkeleton } from '../components/agenda/AgendaMainPanelSkeleton'
import { AgendaSidebarPanel } from '../components/agenda/AgendaSidebarPanel'
import { AgendaSidebarPanelSkeleton } from '../components/agenda/AgendaSidebarPanelSkeleton'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { DashboardPageHeader } from '../components/users/DashboardPageHeader'
import { DashboardPageHeaderSkeleton } from '../components/users/DashboardPageHeaderSkeleton'
import { unitStation } from '../data/unitDashboardMock'
import { useAgendaDateNavigation } from '../hooks/useAgendaDateNavigation'
import { useBrandTheme } from '../hooks/useBrandTheme'
import { useNetworkUserDrawer } from '../hooks/useNetworkUserDrawer'
import { usePageSkeletonLoading } from '../hooks/usePageSkeletonLoading'
import { getAgendaDoctorShifts } from '../data/agendaDoctorShiftMock'
import { openAgendaPrintView, openAgendaReportPrintView } from '../utils/agenda/agendaPrintHtml'
import { getLoggedOperatorName } from '../utils/sessionUser'

export function AgendaPage() {
  useBrandTheme()
  const isLoading = usePageSkeletonLoading(2000)
  const agendaDate = useAgendaDateNavigation()
  const networkUserDrawer = useNetworkUserDrawer()
  const [isPreparingPrint, setIsPreparingPrint] = useState(false)

  const unitLabel = unitStation.unitName.split('—')[0]?.trim() ?? unitStation.unitName

  const printOptions = useMemo(
    () => ({
      appointments: agendaDate.dayData.appointments,
      dayLabel: agendaDate.dayLabel,
      unitLabel,
      summary: agendaDate.dayData.summary,
      sensitiveDataUnlocked: networkUserDrawer.sensitiveDataUnlocked,
      operatorName: getLoggedOperatorName(),
      operationalClimate: agendaDate.dayData.operationalClimate,
      doctorShifts: getAgendaDoctorShifts(agendaDate.selectedDate),
    }),
    [
      agendaDate.dayData.appointments,
      agendaDate.dayData.operationalClimate,
      agendaDate.dayData.summary,
      agendaDate.dayLabel,
      agendaDate.selectedDate,
      networkUserDrawer.sensitiveDataUnlocked,
      unitLabel,
    ],
  )

  const handlePrintAgenda = useCallback(() => {
    if (isPreparingPrint) return
    setIsPreparingPrint(true)
    try {
      openAgendaPrintView(printOptions)
    } finally {
      window.setTimeout(() => setIsPreparingPrint(false), 400)
    }
  }, [isPreparingPrint, printOptions])

  const handleExportReport = useCallback(() => {
    if (isPreparingPrint) return
    setIsPreparingPrint(true)
    void openAgendaReportPrintView(printOptions)
      .catch(() => {
        window.alert('Não foi possível exportar o relatório em PDF. Verifique se os pop-ups estão liberados.')
      })
      .finally(() => {
        setIsPreparingPrint(false)
      })
  }, [isPreparingPrint, printOptions])

  return (
    <DashboardLayout>
      <div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 px-5 pt-5 sm:px-8 sm:pt-6 lg:px-10">
          {isLoading ? (
            <DashboardPageHeaderSkeleton />
          ) : (
            <DashboardPageHeader
              title="Agenda de atendimentos"
              subtitle={`${unitLabel} — Sala de Teleatendimento`}
            />
          )}
        </div>

        <section className="mt-4 grid min-h-0 flex-1 grid-cols-1 gap-4 pb-5 sm:mt-6 sm:pb-6 xl:grid-cols-[1fr_320px] xl:grid-rows-1">
          {isLoading ? (
            <>
              <AgendaMainPanelSkeleton />
              <AgendaSidebarPanelSkeleton />
            </>
          ) : (
            <>
              <AgendaMainPanel agendaDate={agendaDate} networkUserDrawer={networkUserDrawer} />
              <AgendaSidebarPanel
                daySummary={agendaDate.dayData.summary}
                operationalClimate={agendaDate.dayData.operationalClimate}
                onPrintAgenda={handlePrintAgenda}
                onExportReport={handleExportReport}
                isPreparingPrint={isPreparingPrint}
              />
            </>
          )}
        </section>
      </div>
    </DashboardLayout>
  )
}
