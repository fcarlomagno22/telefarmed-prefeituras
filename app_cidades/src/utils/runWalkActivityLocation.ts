import { reverseGeocodeAsync } from '../adapters/appLocation'
import {
  extractActivityPlaceFromGeocoded,
  isValidReverseGeocodeCoordinates,
} from '../adapters/reverseGeocodeShared'

export type ActivityPlace = {
  city: string | null
  state: string | null
}

export async function resolveActivityPlace(
  latitude: number,
  longitude: number,
): Promise<ActivityPlace> {
  if (!isValidReverseGeocodeCoordinates(latitude, longitude)) {
    return { city: null, state: null }
  }

  try {
    const results = await reverseGeocodeAsync({ latitude, longitude })
    const place = results[0]
    if (!place) return { city: null, state: null }

    return extractActivityPlaceFromGeocoded(place)
  } catch {
    return { city: null, state: null }
  }
}

export function formatActivityLocationLabel(
  city?: string | null,
  state?: string | null,
): string {
  const normalizedCity = city?.trim()
  const normalizedState = state?.trim()

  if (normalizedCity && normalizedState) {
    return `${normalizedCity} / ${normalizedState}`
  }
  if (normalizedCity) return normalizedCity
  if (normalizedState) return normalizedState
  return 'Local não informado'
}

export function formatActivityShareTitle(
  city?: string | null,
  state?: string | null,
): string {
  return `Treino em ${formatActivityLocationLabel(city, state)}`
}

export function formatActivityDrawerMeta(
  completedAt: string,
  city?: string | null,
  state?: string | null,
): string {
  const location = formatActivityLocationLabel(city, state)
  const instant = new Date(completedAt)
  const date = instant.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const time = instant.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  return `${location} · ${date} · ${time}`
}
