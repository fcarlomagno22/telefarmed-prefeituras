import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchWeatherAtCoordinates, type WeatherSnapshot } from '../utils/runWalkWeather'

type UseRunWalkWeatherOptions = {
  fetchOnce?: boolean
}

export function useRunWalkWeather(
  latitude: number | null,
  longitude: number | null,
  options?: UseRunWalkWeatherOptions,
) {
  const fetchOnce = options?.fetchOnce ?? false
  const hasFetchedRef = useRef(false)
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (latitude == null || longitude == null) return
    if (fetchOnce && hasFetchedRef.current) return

    setIsLoading(true)
    setError(null)

    try {
      const snapshot = await fetchWeatherAtCoordinates(latitude, longitude)
      setWeather(snapshot)
      if (fetchOnce) {
        hasFetchedRef.current = true
      }
    } catch {
      setError('Clima indisponível no momento.')
      setWeather(null)
      if (fetchOnce) {
        hasFetchedRef.current = true
      }
    } finally {
      setIsLoading(false)
    }
  }, [fetchOnce, latitude, longitude])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { weather, isLoading, error, refresh }
}
