import { useEffect, useRef } from 'react'
import type { ProfissionalQueuePatient } from '../types/profissionalAgenda'
import {
  playProfissionalWaitingRoomAlert,
  type ProfissionalSexo,
} from '../utils/profissional/profissionalWaitingRoomAlertAudio'

function waitingRoomPatientKey(patient: ProfissionalQueuePatient): string {
  return patient.attendanceId ?? patient.id
}

type UseProfissionalWaitingRoomAlertOptions = {
  enabled: boolean
  doctorSexo?: ProfissionalSexo | null
}

/**
 * Toca áudio quando um paciente novo entra na sala de espera virtual (`chamado`).
 * Ignora o snapshot inicial após habilitar (evita tocar ao abrir a fila).
 */
export function useProfissionalWaitingRoomAlert(
  patients: ProfissionalQueuePatient[],
  options: UseProfissionalWaitingRoomAlertOptions,
) {
  const seenChamadoKeysRef = useRef<Set<string> | null>(null)

  useEffect(() => {
    if (!options.enabled) {
      seenChamadoKeysRef.current = null
      return
    }

    const chamadoKeys = new Set(
      patients.filter((patient) => patient.status === 'chamado').map(waitingRoomPatientKey),
    )

    if (seenChamadoKeysRef.current === null) {
      seenChamadoKeysRef.current = chamadoKeys
      return
    }

    const hasNewPatient = [...chamadoKeys].some(
      (key) => !seenChamadoKeysRef.current!.has(key),
    )

    seenChamadoKeysRef.current = chamadoKeys

    if (!hasNewPatient) return

    playProfissionalWaitingRoomAlert(options.doctorSexo)
  }, [options.doctorSexo, options.enabled, patients])
}
