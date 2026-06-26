import * as Location from 'expo-location'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { RegistrationAddress } from '../types/auth'
import type { RunningRoutesOrigin } from '../types/nearbyRunningRoutes'
import { GeoCoordinates } from '../utils/geo'
import { getHomeCoordinatesFromAddress } from '../utils/mockHomeLocation'
import { resolveAddressLabelFromCoordinates } from '../utils/runningRouteGeocoding'

type UseRunningRoutesOriginOptions = {
  address: RegistrationAddress
}

export function useRunningRoutesOrigin({ address }: UseRunningRoutesOriginOptions) {
  const [coordinates, setCoordinates] = useState<GeoCoordinates | null>(null)
  const [originLabel, setOriginLabel] = useState('Sua localização')
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
      const permission = await Location.requestForegroundPermissionsAsync()
      if (!permission.granted) {
        setLocationError('Permita o acesso à localização para ver locais perto de você.')
        setCoordinates(homeCoordinates)
        setOriginLabel('Endereço cadastrado')
        return
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      const nextCoordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }

      setCoordinates(nextCoordinates)
      const label = await resolveAddressLabelFromCoordinates(
        nextCoordinates.latitude,
        nextCoordinates.longitude,
      )
      setOriginLabel(label)
    } catch {
      setLocationError('Não foi possível obter sua localização.')
      setCoordinates(homeCoordinates)
      setOriginLabel('Endereço cadastrado')
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
      label: originLabel,
    }
  }, [coordinates, originLabel])

  return {
    origin,
    isLocating,
    locationError,
    refreshLocation: requestLocation,
  }
}
