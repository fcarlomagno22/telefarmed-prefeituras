import { useEffect, useMemo, useState } from 'react'
import { PROFISSIONAL_QUEUE_POLL_INTERVAL_MS } from '../config/profissionalConfig'
import {
  PROFISSIONAL_QUEUE_UPDATED_EVENT,
  readActiveShiftSession,
} from '../data/profissionalQueueStore'
import { useProfissionalAuth } from '../contexts/ProfissionalAuthContext'
import { fetchProfissionalAgendaPlantaoConsultas } from '../lib/services/profissional/agenda'
import { fetchProfissionalFilaAtiva } from '../lib/services/profissional/atendimentosQueue'
import { mapConsultaApiToQueuePatient } from '../utils/profissional/mapProfissionalAgendaApi'
import { mapProfissionalFilaAtivaItemToQueuePatient } from '../utils/profissional/mapProfissionalFilaAtivaItem'
import { mergeOperationalFilaWithAgendaQueue } from '../utils/profissional/mergeProfissionalQueueSources'
import { unlockProfissionalWaitingRoomAlertAudio } from '../utils/profissional/profissionalWaitingRoomAlertAudio'
import {
  unlockProfissionalPatientJoinedAlertAudio,
} from '../utils/profissional/profissionalPatientJoinedAlertAudio'
import { useProfissionalPatientJoinedAlert } from './useProfissionalPatientJoinedAlert'
import { useProfissionalWaitingRoomAlert } from './useProfissionalWaitingRoomAlert'

/**
 * Polling global da fila enquanto o médico está em plantão.
 * Roda em qualquer rota autenticada `/profissional/*` e dispara áudio de alerta.
 */
export function useProfissionalPlantaoQueueMonitor() {
  const { getAccessToken, user, isAuthenticated } = useProfissionalAuth()
  const [sessionRevision, setSessionRevision] = useState(0)
  const [waitingRoomPatients, setWaitingRoomPatients] = useState<
    ReturnType<typeof mapProfissionalFilaAtivaItemToQueuePatient>[]
  >([])
  const [patientJoinedItems, setPatientJoinedItems] = useState<
    Array<{ codigoAtendimento: string }>
  >([])

  useEffect(() => {
    function handleSessionUpdate() {
      setSessionRevision((value) => value + 1)
    }
    window.addEventListener(PROFISSIONAL_QUEUE_UPDATED_EVENT, handleSessionUpdate)
    return () => window.removeEventListener(PROFISSIONAL_QUEUE_UPDATED_EVENT, handleSessionUpdate)
  }, [])

  const activeSession = useMemo(() => readActiveShiftSession(), [sessionRevision])
  const plantaoActive = Boolean(activeSession && !activeSession.endedAt)
  const doctorSexo = user?.sexo ?? 'nao_informado'

  useEffect(() => {
    if (!isAuthenticated) return

    unlockProfissionalPatientJoinedAlertAudio()

    function unlockOnInteraction() {
      unlockProfissionalPatientJoinedAlertAudio()
      if (plantaoActive) {
        unlockProfissionalWaitingRoomAlertAudio(doctorSexo)
      }
    }

    document.addEventListener('pointerdown', unlockOnInteraction, { once: true })
    return () => document.removeEventListener('pointerdown', unlockOnInteraction)
  }, [doctorSexo, isAuthenticated, plantaoActive])

  useEffect(() => {
    if (!plantaoActive) return

    unlockProfissionalWaitingRoomAlertAudio(doctorSexo)
  }, [doctorSexo, plantaoActive])

  useEffect(() => {
    const token = getAccessToken()
    if (!isAuthenticated || !token) {
      setPatientJoinedItems([])
      return
    }

    let cancelled = false

    async function pollPatientJoined() {
      try {
        const fila = await fetchProfissionalFilaAtiva(token!)
        if (cancelled) return

        setPatientJoinedItems(
          fila
            .filter(
              (item) => item.status === 'em_andamento' && item.patientInConsultationRoom,
            )
            .map((item) => ({ codigoAtendimento: item.codigoAtendimento })),
        )
      } catch {
        // Ignora falhas de polling.
      }
    }

    void pollPatientJoined()

    const pollId = window.setInterval(() => {
      void pollPatientJoined()
    }, PROFISSIONAL_QUEUE_POLL_INTERVAL_MS)

    function refreshWhenVisible() {
      if (document.visibilityState !== 'visible') return
      void pollPatientJoined()
    }

    document.addEventListener('visibilitychange', refreshWhenVisible)
    window.addEventListener('focus', refreshWhenVisible)

    return () => {
      cancelled = true
      window.clearInterval(pollId)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
      window.removeEventListener('focus', refreshWhenVisible)
    }
  }, [getAccessToken, isAuthenticated])

  useEffect(() => {
    const token = getAccessToken()
    if (!isAuthenticated || !plantaoActive || !token || !activeSession) {
      setWaitingRoomPatients([])
      return
    }

    let cancelled = false
    const { shiftId, plantaoId } = activeSession

    async function pollWaitingRoom() {
      try {
        const [fila, plantaoConsultas] = await Promise.all([
          fetchProfissionalFilaAtiva(token!),
          plantaoId
            ? fetchProfissionalAgendaPlantaoConsultas(token!, plantaoId)
            : Promise.resolve([]),
        ])

        if (cancelled) return

        const operational = fila.map((item) =>
          mapProfissionalFilaAtivaItemToQueuePatient(item, shiftId),
        )
        const agenda = plantaoConsultas.map((consulta) => mapConsultaApiToQueuePatient(consulta))
        const merged = mergeOperationalFilaWithAgendaQueue(agenda, operational)

        setWaitingRoomPatients(merged.filter((patient) => patient.status === 'chamado'))
      } catch {
        // Falhas de polling são ignoradas — próxima tentativa segue o intervalo.
      }
    }

    void pollWaitingRoom()

    const pollId = window.setInterval(() => {
      void pollWaitingRoom()
    }, PROFISSIONAL_QUEUE_POLL_INTERVAL_MS)

    function refreshWhenVisible() {
      if (document.visibilityState !== 'visible') return
      void pollWaitingRoom()
    }

    document.addEventListener('visibilitychange', refreshWhenVisible)
    window.addEventListener('focus', refreshWhenVisible)

    return () => {
      cancelled = true
      window.clearInterval(pollId)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
      window.removeEventListener('focus', refreshWhenVisible)
    }
  }, [
    activeSession,
    getAccessToken,
    isAuthenticated,
    plantaoActive,
  ])

  useProfissionalWaitingRoomAlert(waitingRoomPatients, {
    enabled: plantaoActive && isAuthenticated,
    doctorSexo,
  })

  useProfissionalPatientJoinedAlert(patientJoinedItems, {
    enabled: isAuthenticated,
  })
}
