import { useCallback, useMemo, useState } from 'react'
import { AgendaMainPanel } from '../components/agenda/AgendaMainPanel'
import { AgendaMainPanelSkeleton } from '../components/agenda/AgendaMainPanelSkeleton'
import { AgendaSidebarPanel } from '../components/agenda/AgendaSidebarPanel'
import { AgendaSidebarPanelSkeleton } from '../components/agenda/AgendaSidebarPanelSkeleton'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import {
  agendaMainColumnClass,
  agendaPageBodyClass,
  agendaSidebarColumnClass,
  agendaTwoColumnLayoutClass,
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../components/layout/dashboardPageLayout'
import { DashboardPageHeader } from '../components/users/DashboardPageHeader'
import { DashboardPageHeaderSkeleton } from '../components/users/DashboardPageHeaderSkeleton'
import type { DayAppointment } from '../data/agendaMock'
import { unitStation } from '../data/unitDashboardMock'
import { useAgendaDateNavigation } from '../hooks/useAgendaDateNavigation'
import { useAgendaDayAppointments } from '../hooks/useAgendaDayAppointments'
import { useAgendaReceptionDrawer } from '../hooks/useAgendaReceptionDrawer'
import { useAgendaWalkInReceptionDrawer } from '../hooks/useAgendaWalkInReceptionDrawer'
import { useBrandTheme } from '../hooks/useBrandTheme'
import { useNetworkUserDrawer } from '../hooks/useNetworkUserDrawer'
import { usePageSkeletonLoading } from '../hooks/usePageSkeletonLoading'
import { useScheduleAppointmentDrawer } from '../hooks/useScheduleAppointmentDrawer'
import { getAgendaDoctorShifts } from '../data/agendaDoctorShiftMock'
import { openAgendaPrintView, openAgendaReportPrintView } from '../utils/agenda/agendaPrintHtml'
import { enqueueWalkInReception } from '../data/waitingQueueStore'
import { getLoggedOperatorName } from '../utils/sessionUser'

export function AgendaPage() {
  useBrandTheme()
  const isLoading = usePageSkeletonLoading(2000)
  const agendaDate = useAgendaDateNavigation()
  const agendaDay = useAgendaDayAppointments(agendaDate.selectedDate)
  const networkUserDrawer = useNetworkUserDrawer()
  const [isPreparingPrint, setIsPreparingPrint] = useState(false)
  const scheduleDrawer = useScheduleAppointmentDrawer({
    onRescheduled: (appointmentId, patch) => {
      agendaDay.patchAppointment(appointmentId, {
        time: patch.time,
        serviceType: patch.serviceType,
        status: 'agendado',
      })
    },
  })

  const receptionDrawer = useAgendaReceptionDrawer({
    onReceived: (appointment) => {
      agendaDay.confirmArrival(appointment)
    },
  })

  const walkInDrawer = useAgendaWalkInReceptionDrawer({
    selectedDate: agendaDate.selectedDate,
    existingAppointments: agendaDay.appointments,
    onCompleted: (appointment) => {
      agendaDay.addAppointment(appointment)
      enqueueWalkInReception(appointment)
    },
  })

  const unitLabel = unitStation.unitName.split('—')[0]?.trim() ?? unitStation.unitName

  const printOptions = useMemo(
    () => ({
      appointments: agendaDay.appointments,
      dayLabel: agendaDate.dayLabel,
      unitLabel,
      summary: agendaDay.summary,
      sensitiveDataUnlocked: networkUserDrawer.sensitiveDataUnlocked,
      operatorName: getLoggedOperatorName(),
      operationalClimate: agendaDay.operationalClimate,
      doctorShifts: getAgendaDoctorShifts(agendaDate.selectedDate),
    }),
    [
      agendaDay.appointments,
      agendaDay.operationalClimate,
      agendaDay.summary,
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

  const handleRescheduleAppointment = useCallback(
    (appointment: DayAppointment) => {
      scheduleDrawer.openRescheduleDrawer(appointment, agendaDate.selectedDate)
    },
    [agendaDate.selectedDate, scheduleDrawer],
  )

  return (
    <DashboardLayout>
      <div className={dashboardPageShellClass}>
        <div className={dashboardPageHeaderWrapClass}>
          {isLoading ? (
            <DashboardPageHeaderSkeleton />
          ) : (
            <DashboardPageHeader
              title="Agenda de atendimentos"
              subtitle={`${unitLabel} — Sala de Teleatendimento`}
            />
          )}
        </div>

        <div className={[dashboardPageScrollPaddingClass, agendaPageBodyClass].join(' ')}>
          <section className={agendaTwoColumnLayoutClass}>
            <div className={agendaMainColumnClass}>
              {isLoading ? (
                <AgendaMainPanelSkeleton />
              ) : (
                <AgendaMainPanel
                  agendaDate={agendaDate}
                  appointments={agendaDay.appointments}
                  networkUserDrawer={networkUserDrawer}
                  onRescheduleAppointment={handleRescheduleAppointment}
                  onCancelAppointment={agendaDay.cancelAppointment}
                  onMarkNoShowAppointment={agendaDay.markNoShowAppointment}
                  onOpenReception={receptionDrawer.openReception}
                />
              )}
            </div>

            <div className={agendaSidebarColumnClass}>
              {isLoading ? (
                <AgendaSidebarPanelSkeleton />
              ) : (
                <AgendaSidebarPanel
                  daySummary={agendaDay.summary}
                  operationalClimate={agendaDay.operationalClimate}
                  onScheduleAppointment={scheduleDrawer.openDrawer}
                  onWalkInReception={walkInDrawer.openWalkInReception}
                  walkInReceptionDisabled={!agendaDate.isToday}
                  onPrintAgenda={handlePrintAgenda}
                  onExportReport={handleExportReport}
                  isPreparingPrint={isPreparingPrint}
                />
              )}
            </div>
          </section>
        </div>
      </div>

      {scheduleDrawer.drawerElement}
      {receptionDrawer.modalElement}
      {walkInDrawer.drawerElement}
      {networkUserDrawer.drawerLayer}
    </DashboardLayout>
  )
}
