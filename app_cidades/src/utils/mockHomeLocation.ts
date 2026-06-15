import { RegistrationAddress } from '../types/auth'
import { GeoCoordinates } from './geo'

const CITY_COORDS: Record<string, GeoCoordinates> = {
  'são paulo': { latitude: -23.5505, longitude: -46.6333 },
  'sao paulo': { latitude: -23.5505, longitude: -46.6333 },
}

const NEIGHBORHOOD_COORDS: Record<string, GeoCoordinates> = {
  consolação: { latitude: -23.5558, longitude: -46.6626 },
  consolacao: { latitude: -23.5558, longitude: -46.6626 },
  higienópolia: { latitude: -23.5445, longitude: -46.6589 },
  higienopolia: { latitude: -23.5445, longitude: -46.6589 },
  'bela vista': { latitude: -23.5614, longitude: -46.6559 },
  pinheiros: { latitude: -23.5661, longitude: -46.6917 },
  tatuapé: { latitude: -23.5365, longitude: -46.5752 },
  tatuape: { latitude: -23.5365, longitude: -46.5752 },
  mooca: { latitude: -23.5553, longitude: -46.5951 },
  santana: { latitude: -23.5029, longitude: -46.6258 },
  'vila mariana': { latitude: -23.5893, longitude: -46.6344 },
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase()
}

export function getHomeCoordinatesFromAddress(address: RegistrationAddress): GeoCoordinates {
  const neighborhoodKey = normalizeKey(address.neighborhood)
  const neighborhoodMatch = NEIGHBORHOOD_COORDS[neighborhoodKey]
  if (neighborhoodMatch) return neighborhoodMatch

  const cityKey = normalizeKey(address.city)
  const cityMatch = CITY_COORDS[cityKey]
  if (cityMatch) return cityMatch

  return CITY_COORDS['são paulo']
}
