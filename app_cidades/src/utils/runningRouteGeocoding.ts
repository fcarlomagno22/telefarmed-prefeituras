import { geocodeAsync, reverseGeocodeAsync } from '../adapters/appLocation'
import {
  buildAddressLabelFromGeocoded,
  formatCoordinateFallbackLabel,
  isValidReverseGeocodeCoordinates,
} from '../adapters/reverseGeocodeShared'
import type { RegistrationAddress } from '../types/auth'
import { GeoCoordinates } from './geo'

export async function resolveAddressLabelFromCoordinates(
  latitude: number,
  longitude: number,
): Promise<string> {
  const fallback = formatCoordinateFallbackLabel(latitude, longitude)

  if (!isValidReverseGeocodeCoordinates(latitude, longitude)) {
    return fallback
  }

  try {
    const results = await reverseGeocodeAsync({ latitude, longitude })
    const place = results[0]
    if (!place) return fallback

    return buildAddressLabelFromGeocoded(place) ?? fallback
  } catch {
    return fallback
  }
}

export async function geocodeAddressLabel(address: RegistrationAddress): Promise<GeoCoordinates | null> {
  const query = [
    address.street,
    address.number,
    address.neighborhood,
    address.city,
    address.state,
    'Brasil',
  ]
    .filter(Boolean)
    .join(', ')

  if (!query.trim()) return null

  try {
    const results = await geocodeAsync(query)
    const place = results[0]
    if (!place) return null

    return {
      latitude: place.latitude,
      longitude: place.longitude,
    }
  } catch {
    return null
  }
}

export function formatRegistrationAddress(address: RegistrationAddress) {
  const line1 = [address.street, address.number].filter(Boolean).join(', ')
  const line2 = [address.neighborhood, address.city, address.state].filter(Boolean).join(' · ')
  return [line1, line2].filter(Boolean).join(' · ')
}
