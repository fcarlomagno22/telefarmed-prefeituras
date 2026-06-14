import { useCallback, useState } from 'react'
import { useUbtAuth } from '../contexts/UbtAuthContext'
import { checkInUbtFila, isUbtTriagemApiError } from '../lib/services/ubt/triagem'
import type { UbtDashboardConsultaHoje } from '../types/ubtDashboard'
import type { WaitingQueueEntry } from '../types/waitingQueue'
import { consultaHojeToQueueEntry } from '../utils/triage/consultaHojeToQueueEntry'
import { ensureCalledQueueEntry, callNextQueueEntry } from '../utils/triage/ensureCalledQueueEntry'

type UseCallPatientFromQueueOptions = {
  onCalled: (entry: WaitingQueueEntry) => void
  callDisabled?: boolean
}

function notifyCalled(
  entry: WaitingQueueEntry,
  onCalled: (entry: WaitingQueueEntry) => void,
  setCalledName: (name: string | null) => void,
) {
  onCalled(entry)
  setCalledName(entry.patientName)
  window.setTimeout(() => setCalledName(null), 4000)
}

export function useCallPatientFromQueue({
  onCalled,
  callDisabled = false,
}: UseCallPatientFromQueueOptions) {
  const { getAccessToken } = useUbtAuth()
  const [isCalling, setIsCalling] = useState(false)
  const [callError, setCallError] = useState<string | null>(null)
  const [calledName, setCalledName] = useState<string | null>(null)

  const callPatient = useCallback(
    async (entry: WaitingQueueEntry) => {
      if (callDisabled || isCalling) return false
      if (entry.status !== 'aguardando' && entry.status !== 'chamado' && entry.status !== 'em_atendimento') {
        return false
      }

      const token = getAccessToken()
      if (!token) return false

      setIsCalling(true)
      setCallError(null)

      try {
        const called = await ensureCalledQueueEntry(token, entry)
        notifyCalled(called, onCalled, setCalledName)
        return true
      } catch (error) {
        const message = isUbtTriagemApiError(error)
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Não foi possível chamar o paciente.'
        setCallError(message)
        return false
      } finally {
        setIsCalling(false)
      }
    },
    [callDisabled, getAccessToken, isCalling, onCalled],
  )

  const callFromConsultation = useCallback(
    async (consultation: UbtDashboardConsultaHoje) => {
      if (callDisabled || isCalling || consultation.status !== 'waiting') return false

      const token = getAccessToken()
      if (!token) return false

      setIsCalling(true)
      setCallError(null)

      try {
        let queueEntry = consultaHojeToQueueEntry(consultation)

        if (!queueEntry) {
          const checkedIn = await checkInUbtFila(token, consultation.id)
          queueEntry = consultaHojeToQueueEntry(
            {
              ...consultation,
              filaEsperaId: checkedIn.id,
              filaStatus: checkedIn.status,
            },
            checkedIn,
          )
        }

        if (!queueEntry) {
          setCallError('Não foi possível localizar o paciente na fila.')
          return false
        }

        const called = await ensureCalledQueueEntry(token, queueEntry)
        notifyCalled(called, onCalled, setCalledName)
        return true
      } catch (error) {
        const message = isUbtTriagemApiError(error)
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Não foi possível chamar o paciente.'
        setCallError(message)
        return false
      } finally {
        setIsCalling(false)
      }
    },
    [callDisabled, getAccessToken, isCalling, onCalled],
  )

  const callNextPatient = useCallback(async () => {
    if (callDisabled || isCalling) return false

    const token = getAccessToken()
    if (!token) return false

    setIsCalling(true)
    setCallError(null)

    try {
      const called = await callNextQueueEntry(token)
      notifyCalled(called, onCalled, setCalledName)
      return true
    } catch (error) {
      const message = isUbtTriagemApiError(error)
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Não foi possível chamar o próximo paciente.'
      setCallError(message)
      return false
    } finally {
      setIsCalling(false)
    }
  }, [callDisabled, getAccessToken, isCalling, onCalled])

  return {
    callPatient,
    callNextPatient,
    callFromConsultation,
    isCalling,
    callError,
    calledName,
    clearCallError: () => setCallError(null),
  }
}
