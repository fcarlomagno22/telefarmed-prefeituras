import type { RegistrationAddress } from '../types/auth'
import { normalizeBrazilianStateUf } from '../utils/brazilianStateUf'
import type { AppLocationGeocodedAddress } from './appLocation.types'

export function isValidReverseGeocodeCoordinates(
  latitude: number,
  longitude: number,
): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    !(latitude === 0 && longitude === 0)
  )
}

export function formatCoordinateFallbackLabel(latitude: number, longitude: number): string {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
}

export function isGeocodedAddressReliable(place: AppLocationGeocodedAddress): boolean {
  return Boolean(
    place.city?.trim() ||
      place.district?.trim() ||
      place.street?.trim() ||
      place.region?.trim() ||
      place.subregion?.trim(),
  )
}

export function mapGeocodedToRegistrationAddress(
  place: AppLocationGeocodedAddress,
): RegistrationAddress {
  return {
    cep: place.postalCode ?? '',
    street: place.street ?? '',
    number: place.streetNumber ?? '',
    neighborhood: place.district ?? place.subregion ?? '',
    city: place.city ?? place.subregion ?? '',
    state: normalizeBrazilianStateUf(place.region),
    complement: '',
  }
}

export function buildAddressLabelFromGeocoded(place: AppLocationGeocodedAddress): string | null {
  const parts = [
    place.street,
    place.streetNumber,
    place.district ?? place.subregion,
    place.city,
    place.region,
  ].filter(Boolean)

  return parts.length > 0 ? parts.join(', ') : null
}

export function extractCityLabelFromGeocoded(place: AppLocationGeocodedAddress): string | null {
  return place.city ?? place.subregion ?? place.region ?? place.district ?? null
}

export function extractActivityPlaceFromGeocoded(place: AppLocationGeocodedAddress): {
  city: string | null
  state: string | null
} {
  return {
    city: place.city ?? place.subregion ?? place.district ?? null,
    state: place.region ?? null,
  }
}

export function roundCoordinatesForGeocodeCache(latitude: number, longitude: number): string {
  return `${latitude.toFixed(3)},${longitude.toFixed(3)}`
}
