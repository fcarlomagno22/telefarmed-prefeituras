import { useCallback, useEffect, useMemo, useState } from 'react'
import { PROFISSIONAL_QUEUE_POLL_INTERVAL_MS } from '../config/profissionalConfig'
import {
  clearActiveAttendanceId,
  getProfissionalQueue,
  persistProfissionalQueue,
  purgeDemoQueuePatients,
  PROFISSIONAL_QUEUE_UPDATED_EVENT,
  readActiveAttendanceId,
  stripDemoQueuePatients,
  writeActiveAttendanceId,
} from '../data/profissionalQueueStore'
import { writeConsultationLockToStorage } from './useConsultationSessionGuard'
import { fetchProfissionalAgendaPlantaoConsultas } from '../lib/services/profissional/agenda'
import { fetchProfissionalFilaAtiva } from '../lib/services/profissional/atendimentosQueue'
import type { ProfissionalQueuePatient } from '../types/profissionalAgenda'
import { mapConsultaApiToQueuePatient } from '../utils/profissional/mapProfissionalAgendaApi'
import { mapProfissionalFilaAtivaItemToQueuePatient } from '../utils/profissional/mapProfissionalFilaAtivaItem'
import { mergeOperationalFilaWithAgendaQueue } from '../utils/profissional/mergeProfissionalQueueSources'
import { sortProfissionalQueue } from '../utils/profissional/sortProfissionalQueue'

export function useProfissionalQueue(
  shiftId: string | undefined,
  accessToken?: string | null,
  options?: {
    tourUseLocalQueue?: boolean
    plantaoId?: string
    plantaoSessionActive?: boolean
  },
) {
  const tourUseLocalQueue = options?.tourUseLocalQueue ?? false
  const plantaoId = options?.plantaoId
  const plantaoSessionActive = options?.plantaoSessionActive ?? true
  const [revision, setRevision] = useState(0)
  const [now, setNow] = useState(() => new Date())
  const [agendaPatients, setAgendaPatients] = useState<ProfissionalQueuePatient[]>([])
  const [apiPatients, setApiPatients] = useState<ProfissionalQueuePatient[]>([])
  const [apiLoaded, setApiLoaded] = useState(false)

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

  useEffect(() => {
    if (!accessToken || !shiftId || tourUseLocalQueue || !plantaoSessionActive) {
      setAgendaPatients([])
      setApiPatients([])
      setApiLoaded(false)
      return
    }

    let cancelled = false

    async function loadFila() {
      try {
        purgeDemoQueuePatients(shiftId!)

        const [fila, plantaoConsultas] = await Promise.all([
          fetchProfissionalFilaAtiva(accessToken!),
          plantaoId
            ? fetchProfissionalAgendaPlantaoConsultas(accessToken!, plantaoId)
            : Promise.resolve([]),
        ])

        if (cancelled) return

        const operational = fila.map((item) =>
          mapProfissionalFilaAtivaItemToQueuePatient(item, shiftId!),
        )
        const agenda = plantaoConsultas.map((consulta) => mapConsultaApiToQueuePatient(consulta))
        const merged = mergeOperationalFilaWithAgendaQueue(agenda, operational)

        persistProfissionalQueue(shiftId!, merged)
        setAgendaPatients(agenda)
        setApiPatients(operational)
        setApiLoaded(true)
        refresh()
      } catch {
        if (!cancelled) {
          const fallback = stripDemoQueuePatients(getProfissionalQueue(shiftId!))
          setAgendaPatients(fallback)
          setApiPatients([])
          setApiLoaded(true)
        }
      }
    }

    void loadFila()

    const pollId = window.setInterval(() => {
      void loadFila()
    }, PROFISSIONAL_QUEUE_POLL_INTERVAL_MS)

    function refreshWhenVisible() {
      if (document.visibilityState !== 'visible') return
      void loadFila()
    }

    document.addEventListener('visibilitychange', refreshWhenVisible)
    window.addEventListener('focus', refreshWhenVisible)

    return () => {
      cancelled = true
      window.clearInterval(pollId)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
      window.removeEventListener('focus', refreshWhenVisible)
    }
  }, [accessToken, plantaoId, plantaoSessionActive, shiftId, tourUseLocalQueue, refresh])

  const patients = useMemo(() => {
    if (!shiftId) return []
    if (tourUseLocalQueue) {
      return sortProfissionalQueue(getProfissionalQueue(shiftId, { includeDemo: true }), now)
    }

    if (accessToken && apiLoaded) {
      return sortProfissionalQueue(
        mergeOperationalFilaWithAgendaQueue(agendaPatients, apiPatients),
        now,
      )
    }

    return sortProfissionalQueue(stripDemoQueuePatients(getProfissionalQueue(shiftId)), now)
  }, [accessToken, agendaPatients, apiLoaded, apiPatients, shiftId, now, revision, tourUseLocalQueue])

  const waitingPatients = useMemo(
    () => patients.filter((patient) => patient.status === 'aguardando'),
    [patients],
  )

  const inProgressPatient = useMemo(
    () => patients.find((patient) => patient.status === 'em_atendimento'),
    [patients],
  )

  const usesApiQueue = Boolean(accessToken && apiLoaded && !tourUseLocalQueue)

  useEffect(() => {
    if (!usesApiQueue) return

    if (inProgressPatient?.attendanceId) {
      if (readActiveAttendanceId() !== inProgressPatient.attendanceId) {
        writeActiveAttendanceId(inProgressPatient.attendanceId)
      }
      return
    }

    if (readActiveAttendanceId()) {
      clearActiveAttendanceId()
      writeConsultationLockToStorage(false)
      refresh()
    }
  }, [inProgressPatient?.attendanceId, refresh, usesApiQueue])

  const activeAttendanceId = useMemo(() => {
    if (usesApiQueue) {
      return inProgressPatient?.attendanceId ?? null
    }
    return readActiveAttendanceId()
  }, [inProgressPatient?.attendanceId, revision, usesApiQueue])

  const callablePatientId = waitingPatients[0]?.id ?? null
  const callDisabled = Boolean(activeAttendanceId)

  const waitingCount = useMemo(
    () =>
      patients.filter(
        (patient) =>
          patient.status === 'aguardando' ||
          patient.status === 'chamado' ||
          patient.status === 'em_atendimento',
      ).length,
    [patients],
  )

  return {
    patients,
    waitingCount,
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
