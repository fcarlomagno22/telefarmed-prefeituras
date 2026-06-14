import { useMemo } from 'react'
import { useOptionalUbtAuth } from '../contexts/UbtAuthContext'

export type UbtUnitStation = {
  unitName: string
  stationLabel: string
}

export function useUbtUnitStation(override?: Partial<UbtUnitStation>): UbtUnitStation {
  const auth = useOptionalUbtAuth()
  const user = auth?.user

  return useMemo(
    () => ({
      unitName: override?.unitName ?? user?.unidadeUbtNome ?? 'Unidade UBT',
      stationLabel: override?.stationLabel ?? 'Estação de triagem',
    }),
    [override?.stationLabel, override?.unitName, user?.unidadeUbtNome],
  )
}
