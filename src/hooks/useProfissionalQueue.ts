import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getProfissionalQueue,
  PROFISSIONAL_QUEUE_UPDATED_EVENT,
  readActiveAttendanceId,
} from '../data/profissionalQueueStore'
import type { ProfissionalQueuePatient } from '../types/profissionalAgenda'
import { sortProfissionalQueue } from '../utils/profissional/sortProfissionalQueue'

export function useProfissionalQueue(shiftId: string | undefined) {
  const [revision, setRevision] = useState(0)
  const [now, setNow] = useState(() => new Date())

  const refresh = useCallback(() => setRevision((value) => value + 1), [])

  useEffect(() => {
    function handleUpdate() {
      refresh()
    }
    window.addEventListener(PROFISSIONAL_QUEUE_UPDATED_EVENT, handleUpdate)
    const tick = window.setInterval(() => setNow(new Date()), 30_000)
    return () => {
      window.removeEventListener(PROFISSIONAL_QUEUE_UPDATED_EVENT, handleUpdate)
      window.clearInterval(tick)
    }
  }, [refresh])

  const patients = useMemo(() => {
    if (!shiftId) return []
    return sortProfissionalQueue(getProfissionalQueue(shiftId), now)
  }, [shiftId, now, revision])

  const waitingPatients = useMemo(
    () => patients.filter((patient) => patient.status === 'aguardando'),
    [patients],
  )

  const callablePatientId = waitingPatients[0]?.id ?? null
  const activeAttendanceId = useMemo(() => readActiveAttendanceId(), [revision])
  const callDisabled = Boolean(activeAttendanceId)

  const inProgressPatient = useMemo(
    () =>
      patients.find(
        (patient) =>
          patient.status === 'em_atendimento' ||
          (patient.attendanceId && patient.attendanceId === activeAttendanceId),
      ),
    [patients, activeAttendanceId],
  )

  return {
    patients,
    now,
    callablePatientId,
    callDisabled,
    activeAttendanceId,
    inProgressPatient,
    refresh,
  }
}

export function formatQueueWaitMinutes(arrivedAt: string, now: Date): number {
  return Math.max(0, Math.round((now.getTime() - new Date(arrivedAt).getTime()) / 60_000))
}

export function patientStatusLabel(status: ProfissionalQueuePatient['status']): string {
  const labels: Record<ProfissionalQueuePatient['status'], string> = {
    aguardando: 'Aguardando',
    chamado: 'Na sala de espera',
    em_atendimento: 'Em atendimento',
    finalizado: 'Atendido',
    nao_compareceu: 'Não compareceu',
    desistiu: 'Desistiu',
  }
  return labels[status]
}
