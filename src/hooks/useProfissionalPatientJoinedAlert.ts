import { useEffect, useRef } from 'react'
import { playProfissionalPatientJoinedAlert } from '../utils/profissional/profissionalPatientJoinedAlertAudio'

type PatientJoinedItem = {
  codigoAtendimento: string
}

type UseProfissionalPatientJoinedAlertOptions = {
  enabled: boolean
}

/**
 * Toca áudio quando o paciente entra na sala de teleconsulta.
 * Ignora o snapshot inicial para não alertar consultas já em andamento.
 */
export function useProfissionalPatientJoinedAlert(
  items: PatientJoinedItem[],
  options: UseProfissionalPatientJoinedAlertOptions,
) {
  const seenKeysRef = useRef<Set<string> | null>(null)

  useEffect(() => {
    if (!options.enabled) {
      seenKeysRef.current = null
      return
    }

    const keys = new Set(items.map((item) => item.codigoAtendimento))

    if (seenKeysRef.current === null) {
      seenKeysRef.current = keys
      return
    }

    const hasNewPatient = [...keys].some((key) => !seenKeysRef.current!.has(key))
    seenKeysRef.current = keys

    if (!hasNewPatient) return

    playProfissionalPatientJoinedAlert()
  }, [items, options.enabled])
}
