import { useCallback, useState } from 'react'
import { AgendaWalkInReceptionDrawer } from '../components/agenda/reception/AgendaWalkInReceptionDrawer'
import type { DayAppointment } from '../data/agendaMock'
import type { PatientRegistration } from '../types/attendance'

type UseAgendaWalkInReceptionDrawerOptions = {
  selectedDate: Date
  existingAppointments: DayAppointment[]
  onCompleted: (
    appointment: DayAppointment,
    registration: PatientRegistration,
    options?: { skipFilaCheckIn?: boolean },
  ) => void
  onMtSessionEnded?: () => void
  onRegisterWalkIn: (payload: {
    pacienteId: string
    especialidadeId: string
    profissionalId: string
    hora: string
    telefoneContato?: string
  }) => Promise<DayAppointment>
}

export function useAgendaWalkInReceptionDrawer({
  selectedDate,
  existingAppointments,
  onCompleted,
  onMtSessionEnded,
  onRegisterWalkIn,
}: UseAgendaWalkInReceptionDrawerOptions) {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)

  const openWalkInReception = useCallback(() => {
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
    }
  }, [closing])

  const drawerElement = (
    <AgendaWalkInReceptionDrawer
      open={open}
      closing={closing}
      selectedDate={selectedDate}
      existingAppointments={existingAppointments}
      onClose={requestClose}
      onTransitionEnd={handleTransitionEnd}
      onCompleted={onCompleted}
      onMtSessionEnded={onMtSessionEnded}
      onRegisterWalkIn={onRegisterWalkIn}
    />
  )

  return {
    openWalkInReception,
    drawerElement,
  }
}
