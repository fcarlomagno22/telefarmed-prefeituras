import { useCallback, useState } from 'react'
import { AgendaReceptionModal } from '../components/agenda/reception/AgendaReceptionModal'
import type { DayAppointment } from '../data/agendaMock'
import type { PatientRegistration } from '../data/unitDashboardMock'

type UseAgendaReceptionDrawerOptions = {
  onReceived: (appointment: DayAppointment, registration: PatientRegistration) => void
}

export function useAgendaReceptionDrawer({
  onReceived,
}: UseAgendaReceptionDrawerOptions) {
  const [open, setOpen] = useState(false)
  const [appointment, setAppointment] = useState<DayAppointment | null>(null)

  const openReception = useCallback((target: DayAppointment) => {
    setAppointment(target)
    setOpen(true)
  }, [])

  const closeReception = useCallback(() => {
    setOpen(false)
    setAppointment(null)
  }, [])

  const modalElement = (
    <AgendaReceptionModal
      open={open}
      appointment={appointment}
      onClose={closeReception}
      onReceived={onReceived}
    />
  )

  return {
    openReception,
    modalElement,
  }
}
