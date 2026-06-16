import { useCallback, useEffect, useMemo, useState } from 'react'
import type { RegistrationAddress } from '../types/auth'
import type { RunningRoutesOrigin } from '../types/nearbyRunningRoutes'
import { GeoCoordinates } from '../utils/geo'
import { getMockGpsCoordinates } from '../utils/nearbyUnits'
import { getHomeCoordinatesFromAddress } from '../utils/mockHomeLocation'

type UseRunningRoutesOriginOptions = {
  address: RegistrationAddress
}

export function useRunningRoutesOrigin({ address }: UseRunningRoutesOriginOptions) {
  const [coordinates, setCoordinates] = useState<GeoCoordinates | null>(null)
  const [isLocating, setIsLocating] = useState(true)
  const [locationError, setLocationError] = useState<string | null>(null)

  const homeCoordinates = useMemo(
    () => getHomeCoordinatesFromAddress(address),
    [address],
  )

  const requestLocation = useCallback(async () => {
    setIsLocating(true)
    setLocationError(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 520))
      setCoordinates(getMockGpsCoordinates(homeCoordinates))
    } catch {
      setLocationError('Não foi possível obter sua localização.')
      setCoordinates(homeCoordinates)
    } finally {
      setIsLocating(false)
    }
  }, [homeCoordinates])

  useEffect(() => {
    void requestLocation()
  }, [requestLocation])

  const origin = useMemo<RunningRoutesOrigin | null>(() => {
    if (!coordinates) return null

    return {
      ...coordinates,
      label: 'Sua localização',
    }
  }, [coordinates])

  return {
    origin,
    isLocating,
    locationError,
    refreshLocation: requestLocation,
  }
}
