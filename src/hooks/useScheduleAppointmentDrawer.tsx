import { useCallback, useState } from 'react'
import { ScheduleAppointmentDrawer } from '../components/agenda/schedule/ScheduleAppointmentDrawer'
import type { ScheduleAppointmentInitialState } from '../components/agenda/schedule/scheduleAppointmentTypes'
import { Toast } from '../components/ui/Toast'
import type { DayAppointment } from '../data/agendaMock'
import { agendaToday } from '../data/agendaMock'
import type { PatientRegistration } from '../data/unitDashboardMock'
import { buildRescheduleDraftFromAppointment } from '../utils/agenda/buildRescheduleDraftFromAppointment'

type ReschedulePatch = {
  time: string
  serviceType: string
}

type UseScheduleAppointmentDrawerOptions = {
  onRescheduled?: (appointmentId: string, patch: ReschedulePatch) => void
}

export function useScheduleAppointmentDrawer(options: UseScheduleAppointmentDrawerOptions = {}) {
  const { onRescheduled } = options
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [initialFlow, setInitialFlow] = useState<ScheduleAppointmentInitialState | null>(null)
  const [toast, setToast] = useState<{ message: string } | null>(null)

  const openDrawer = useCallback(() => {
    setInitialFlow(null)
    setClosing(false)
    setOpen(true)
  }, [])

  const openRescheduleDrawer = useCallback(
    (appointment: DayAppointment, selectedDay: Date) => {
      setInitialFlow(buildRescheduleDraftFromAppointment(appointment, selectedDay))
      setClosing(false)
      setOpen(true)
    },
    [],
  )

  const requestClose = useCallback(() => {
    setClosing(true)
  }, [])

  const handleTransitionEnd = useCallback(() => {
    if (closing) {
      setOpen(false)
      setClosing(false)
      setInitialFlow(null)
    }
  }, [closing])

  const dismissToast = useCallback(() => setToast(null), [])

  const handleScheduled = useCallback(
    (_registration: PatientRegistration, summary: string) => {
      setToast({ message: summary })
    },
    [],
  )

  const handleRescheduled = useCallback(
    (appointmentId: string, patch: ReschedulePatch, summary: string) => {
      onRescheduled?.(appointmentId, patch)
      setToast({ message: summary })
    },
    [onRescheduled],
  )

  const drawerElement = (
    <>
      <ScheduleAppointmentDrawer
        open={open}
        closing={closing}
        initialDate={agendaToday}
        initialFlow={initialFlow}
        onClose={requestClose}
        onTransitionEnd={handleTransitionEnd}
        onScheduled={handleScheduled}
        onRescheduled={handleRescheduled}
      />
      <Toast
        message={toast?.message ?? ''}
        visible={toast !== null}
        onClose={dismissToast}
      />
    </>
  )

  return {
    openDrawer,
    openRescheduleDrawer,
    drawerElement,
  }
}
