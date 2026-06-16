import { useCallback, useEffect, useState } from 'react'
import { fetchWeatherAtCoordinates, type WeatherSnapshot } from '../utils/runWalkWeather'

export function useRunWalkWeather(latitude: number | null, longitude: number | null) {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (latitude == null || longitude == null) return

    setIsLoading(true)
    setError(null)

    try {
      const snapshot = await fetchWeatherAtCoordinates(latitude, longitude)
      setWeather(snapshot)
    } catch {
      setError('Clima indisponível no momento.')
      setWeather(null)
    } finally {
      setIsLoading(false)
    }
  }, [latitude, longitude])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { weather, isLoading, error, refresh }
}
