/**
 * Reverse geocoding web via Nominatim com timeout, cache, rate-limit e
 * validação de confiabilidade. Falhas retornam [] — nunca lançam erro.
 */
import type { AppLocationGeocodedAddress } from './appLocation.types'
import {
  isGeocodedAddressReliable,
  isValidReverseGeocodeCoordinates,
  roundCoordinatesForGeocodeCache,
} from './reverseGeocodeShared'

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'
const NOMINATIM_HEADERS = {
  Accept: 'application/json',
  'Accept-Language': 'pt-BR,pt;q=0.9',
}
const REQUEST_TIMEOUT_MS = 8000
const MIN_REQUEST_INTERVAL_MS = 1100
const CACHE_MAX_ENTRIES = 64

type CacheEntry = {
  results: AppLocationGeocodedAddress[]
  cachedAt: number
}

const reverseGeocodeCache = new Map<string, CacheEntry>()
let requestChain: Promise<void> = Promise.resolve()
let lastRequestAt = 0

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function trimCache() {
  while (reverseGeocodeCache.size > CACHE_MAX_ENTRIES) {
    const oldestKey = reverseGeocodeCache.keys().next().value
    if (oldestKey == null) break
    reverseGeocodeCache.delete(oldestKey)
  }
}

function mapNominatimAddress(payload: {
  address?: Record<string, string>
  display_name?: string
}): AppLocationGeocodedAddress {
  const address = payload.address ?? {}

  return {
    city:
      address.city ??
      address.town ??
      address.village ??
      address.municipality ??
      address.county ??
      null,
    district: address.suburb ?? address.neighbourhood ?? address.quarter ?? null,
    streetNumber: address.house_number ?? null,
    street: address.road ?? address.pedestrian ?? address.footway ?? null,
    region: address.state ?? address.region ?? null,
    subregion: address.county ?? address.state_district ?? null,
    country: address.country ?? null,
    postalCode: address.postcode ?? null,
    name: payload.display_name ?? null,
    isoCountryCode: address.country_code?.toUpperCase() ?? null,
  }
}

async function fetchNominatimReverse(
  latitude: number,
  longitude: number,
): Promise<AppLocationGeocodedAddress[]> {
  const params = new URLSearchParams({
    format: 'json',
    lat: String(latitude),
    lon: String(longitude),
    addressdetails: '1',
    zoom: '18',
  })

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    await requestChain
    const waitMs = Math.max(0, MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt))
    if (waitMs > 0) {
      await sleep(waitMs)
    }
    lastRequestAt = Date.now()

    const response = await fetch(`${NOMINATIM_BASE}/reverse?${params.toString()}`, {
      headers: NOMINATIM_HEADERS,
      signal: controller.signal,
    })

    if (!response.ok) return []

    const payload = (await response.json()) as {
      address?: Record<string, string>
      display_name?: string
      error?: string
    }

    if (payload.error || !payload.address) return []

    const mapped = mapNominatimAddress(payload)
    if (!isGeocodedAddressReliable(mapped)) return []

    return [mapped]
  } catch {
    return []
  } finally {
    window.clearTimeout(timeout)
  }
}

function queueReverseGeocodeFetch(
  latitude: number,
  longitude: number,
): Promise<AppLocationGeocodedAddress[]> {
  const task = fetchNominatimReverse(latitude, longitude)
  requestChain = requestChain.then(() => task).then(() => undefined, () => undefined)
  return task
}

export function isReverseGeocodeAvailable(): boolean {
  return typeof window !== 'undefined' && typeof fetch === 'function'
}

export async function reverseGeocodeOnWeb(location: {
  latitude: number
  longitude: number
}): Promise<AppLocationGeocodedAddress[]> {
  if (!isReverseGeocodeAvailable()) return []

  const { latitude, longitude } = location
  if (!isValidReverseGeocodeCoordinates(latitude, longitude)) return []

  const cacheKey = roundCoordinatesForGeocodeCache(latitude, longitude)
  const cached = reverseGeocodeCache.get(cacheKey)
  if (cached) {
    return cached.results
  }

  const results = await queueReverseGeocodeFetch(latitude, longitude)
  reverseGeocodeCache.set(cacheKey, { results, cachedAt: Date.now() })
  trimCache()

  return results
}
