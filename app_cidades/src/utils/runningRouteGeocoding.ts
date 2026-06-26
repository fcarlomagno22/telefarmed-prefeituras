import * as Location from 'expo-location'
import type { RegistrationAddress } from '../types/auth'
import { GeoCoordinates } from './geo'

export async function resolveAddressLabelFromCoordinates(
  latitude: number,
  longitude: number,
): Promise<string> {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude })
    const place = results[0]
    if (!place) return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`

    const parts = [
      place.street,
      place.streetNumber,
      place.district ?? place.subregion,
      place.city,
      place.region,
    ].filter(Boolean)

    return parts.join(', ') || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
  } catch {
    return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
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
    const results = await Location.geocodeAsync(query)
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
