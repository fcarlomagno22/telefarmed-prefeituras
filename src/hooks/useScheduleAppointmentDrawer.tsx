import { useCallback, useState } from 'react'
import { ScheduleAppointmentDrawer } from '../components/agenda/schedule/ScheduleAppointmentDrawer'
import type { ScheduleAppointmentInitialState } from '../components/agenda/schedule/scheduleAppointmentTypes'
import { Toast } from '../components/ui/Toast'
import type { DayAppointment } from '../data/agendaMock'
import type { PatientRegistration } from '../types/attendance'
import { buildRescheduleDraftFromAppointment } from '../utils/agenda/buildRescheduleDraftFromAppointment'
import { toDateKey } from '../utils/agendaDate'

type ReschedulePatch = {
  time: string
  serviceType: string
}

type RescheduleSessionMeta = {
  profissionalId: string
  especialidadeId: string
  selectedDate: Date
}

type SchedulePayload = {
  pacienteId: string
  profissionalId: string
  especialidadeId: string
  data: string
  hora: string
  telefoneContato?: string
}

type UseScheduleAppointmentDrawerOptions = {
  initialDate: Date
  onRescheduled?: (
    appointmentId: string,
    patch: ReschedulePatch,
    sessionMeta: RescheduleSessionMeta,
  ) => Promise<void>
  onScheduled?: (payload: SchedulePayload) => Promise<void>
}

export function useScheduleAppointmentDrawer(options: UseScheduleAppointmentDrawerOptions) {
  const { initialDate, onRescheduled, onScheduled } = options
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [initialFlow, setInitialFlow] = useState<ScheduleAppointmentInitialState | null>(null)
  const [toast, setToast] = useState<{ message: string; variant?: 'success' | 'error' } | null>(
    null,
  )

  const openDrawer = useCallback(() => {
    setInitialFlow(null)
    setClosing(false)
    setOpen(true)
  }, [])

  const openRescheduleDrawer = useCallback((appointment: DayAppointment, selectedDay: Date) => {
    setInitialFlow(buildRescheduleDraftFromAppointment(appointment, selectedDay))
    setClosing(false)
    setOpen(true)
  }, [])

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
    async (
      registration: PatientRegistration,
      summary: string,
      meta: {
        pacienteId: string
        profissionalId: string
        especialidadeId: string
        selectedDate: Date
        selectedTime: string
      },
    ) => {
      try {
        await onScheduled?.({
          pacienteId: meta.pacienteId,
          profissionalId: meta.profissionalId,
          especialidadeId: meta.especialidadeId,
          data: toDateKey(meta.selectedDate),
          hora: meta.selectedTime,
          telefoneContato: registration.phone,
        })
        setToast({ message: summary })
      } catch {
        setToast({ message: 'Não foi possível agendar a consulta.', variant: 'error' })
      }
    },
    [onScheduled],
  )

  const handleRescheduled = useCallback(
    async (
      appointmentId: string,
      patch: ReschedulePatch,
      summary: string,
      meta: RescheduleSessionMeta,
    ) => {
      try {
        await onRescheduled?.(appointmentId, patch, meta)
        setToast({ message: summary })
      } catch {
        setToast({ message: 'Não foi possível reagendar a consulta.', variant: 'error' })
      }
    },
    [onRescheduled],
  )

  const drawerElement = (
    <>
      <ScheduleAppointmentDrawer
        open={open}
        closing={closing}
        initialDate={initialDate}
        initialFlow={initialFlow}
        onClose={requestClose}
        onTransitionEnd={handleTransitionEnd}
        onScheduled={handleScheduled}
        onRescheduled={handleRescheduled}
      />
      <Toast
        message={toast?.message ?? ''}
        visible={toast !== null}
        variant={toast?.variant ?? 'success'}
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
