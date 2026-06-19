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
import { useAgendaDateNavigation } from '../hooks/useAgendaDateNavigation'
import { useAgendaReceptionDrawer } from '../hooks/useAgendaReceptionDrawer'
import { useAgendaWalkInReceptionDrawer } from '../hooks/useAgendaWalkInReceptionDrawer'
import { useBrandTheme } from '../hooks/useBrandTheme'
import { useNetworkUserDrawer } from '../hooks/useNetworkUserDrawer'
import { useScheduleAppointmentDrawer } from '../hooks/useScheduleAppointmentDrawer'
import { useUbtAgendaMutations } from '../hooks/useUbtAgendaMutations'
import { useUbtAgendaPage } from '../hooks/useUbtAgendaPage'
import { useUbtAuth } from '../contexts/UbtAuthContext'
import {
  fetchUbtPacienteConsultas,
  fetchUbtPacienteDetail,
  fetchUbtPacienteRow,
} from '../lib/services/ubt/pacientes'
import { openAgendaPrintView, openAgendaReportPrintView } from '../utils/agenda/agendaPrintHtml'
import { loadUbtPacienteDrawerData } from '../utils/ubtPacientesDetail'
import { getLoggedOperatorName } from '../utils/sessionUser'
import { toDateKey } from '../utils/agendaDate'

export function AgendaPage() {
  useBrandTheme()
  const { getAccessToken } = useUbtAuth()
  const agendaDate = useAgendaDateNavigation()
  const agendaDay = useUbtAgendaPage(agendaDate.selectedDate)

  const {
    reload,
    reloadMonthIndicators,
    appointments,
    summary,
    operationalClimate,
    history,
    doctorShifts,
    unitLabel,
    isLoading,
    loadError,
    hasAppointmentsOnDate,
    cancelAppointment,
    markNoShowAppointment,
    changeAppointmentStatus,
    confirmArrival,
    updatingAppointmentId,
    addAppointment,
    checkInToFila,
  } = agendaDay

  const navigation = useMemo(
    () => ({ ...agendaDate, history }),
    [agendaDate, history],
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
  const mutations = useUbtAgendaMutations()
  const [isPreparingPrint, setIsPreparingPrint] = useState(false)

  const scheduleDrawer = useScheduleAppointmentDrawer({
    initialDate: agendaDate.selectedDate,
    onRescheduled: async (appointmentId, patch, sessionMeta) => {
      if (!sessionMeta.profissionalId || !sessionMeta.especialidadeId) return
      await mutations.rescheduleConsulta(appointmentId, {
        profissionalId: sessionMeta.profissionalId,
        especialidadeId: sessionMeta.especialidadeId,
        data: toDateKey(sessionMeta.selectedDate),
        hora: patch.time,
      })
      await reload({ silent: true })
    },
    onScheduled: async (payload) => {
      await mutations.scheduleConsulta(payload)
      await reload({ silent: true })
    },
  })

  const receptionDrawer = useAgendaReceptionDrawer({
    onReceived: (appointment) => {
      void confirmArrival(appointment)
    },
  })

  const walkInDrawer = useAgendaWalkInReceptionDrawer({
    selectedDate: agendaDate.selectedDate,
    existingAppointments: appointments,
    onCompleted: (appointment) => {
      addAppointment(appointment)
      void checkInToFila(appointment.id)
    },
    onRegisterWalkIn: mutations.registerWalkIn,
  })

  const printOptions = useMemo(
    () => ({
      appointments,
      dayLabel: agendaDate.dayLabel,
      unitLabel,
      summary,
      sensitiveDataUnlocked: networkUserDrawer.sensitiveDataUnlocked,
      operatorName: getLoggedOperatorName(),
      operationalClimate,
      doctorShifts,
    }),
    [
      appointments,
      doctorShifts,
      operationalClimate,
      summary,
      agendaDate.dayLabel,
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

  const handleMonthChange = useCallback(
    (year: number, month: number) => {
      void reloadMonthIndicators(year, month)
    },
    [reloadMonthIndicators],
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

        {loadError ? (
          <div className="mx-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        ) : null}

        <div className={[dashboardPageScrollPaddingClass, agendaPageBodyClass].join(' ')}>
          <section className={agendaTwoColumnLayoutClass}>
            <div className={agendaMainColumnClass}>
              {isLoading ? (
                <AgendaMainPanelSkeleton />
              ) : (
                <AgendaMainPanel
                  agendaDate={navigation}
                  appointments={appointments}
                  updatingAppointmentId={updatingAppointmentId}
                  networkUserDrawer={networkUserDrawer}
                  onRescheduleAppointment={handleRescheduleAppointment}
                  onCancelAppointment={(appointment) => void cancelAppointment(appointment)}
                  onMarkNoShowAppointment={(appointment) => void markNoShowAppointment(appointment)}
                  onChangeAppointmentStatus={(appointment, status) =>
                    void changeAppointmentStatus(appointment, status)
                  }
                  onOpenReception={receptionDrawer.openReception}
                  hasAppointmentsOnDate={hasAppointmentsOnDate}
                  onMonthChange={handleMonthChange}
                />
              )}
            </div>

            <div className={agendaSidebarColumnClass}>
              {isLoading ? (
                <AgendaSidebarPanelSkeleton />
              ) : (
                <AgendaSidebarPanel
                  daySummary={summary}
                  operationalClimate={operationalClimate}
                  history={history}
                  selectedDateKey={toDateKey(agendaDate.selectedDate)}
                  onSelectHistoryDay={agendaDate.goToDateKey}
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
    </DashboardLayout>
  )
}
