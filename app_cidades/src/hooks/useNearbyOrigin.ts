import { useCallback, useEffect, useMemo, useState } from 'react'
import { RegistrationAddress } from '../types/auth'
import type { NearbyOriginMode } from '../types/nearbyUnits'
import { GeoCoordinates } from '../utils/geo'
import { buildNearbyOrigin, getMockGpsCoordinates } from '../utils/nearbyUnits'
import { getHomeCoordinatesFromAddress } from '../utils/mockHomeLocation'

type UseNearbyOriginOptions = {
  address: RegistrationAddress
}

export function useNearbyOrigin({ address }: UseNearbyOriginOptions) {
  const [mode, setMode] = useState<NearbyOriginMode>('home')
  const [gpsCoordinates, setGpsCoordinates] = useState<GeoCoordinates | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  const homeCoordinates = useMemo(
    () => getHomeCoordinatesFromAddress(address),
    [address],
  )

  const requestGps = useCallback(async () => {
    setIsLocating(true)
    setLocationError(null)

    try {
      // Simula GPS com leve deslocamento do endereço cadastrado.
      await new Promise((resolve) => setTimeout(resolve, 420))
      setGpsCoordinates(getMockGpsCoordinates(homeCoordinates))
      setMode('gps')
    } catch {
      setLocationError('Não foi possível obter sua localização.')
    } finally {
      setIsLocating(false)
    }
  }, [homeCoordinates])

  useEffect(() => {
    if (mode === 'gps' && !gpsCoordinates) {
      void requestGps()
    }
  }, [mode, gpsCoordinates, requestGps])

  const origin = useMemo(
    () => buildNearbyOrigin(mode, homeCoordinates, gpsCoordinates),
    [mode, homeCoordinates, gpsCoordinates],
  )

  function selectMode(nextMode: NearbyOriginMode) {
    setLocationError(null)
    setMode(nextMode)
    if (nextMode === 'gps' && !gpsCoordinates) {
      void requestGps()
    }
  }

  return {
    mode,
    origin,
    homeCoordinates,
    gpsCoordinates,
    isLocating,
    locationError,
    selectMode,
    refreshGps: requestGps,
  }
}
