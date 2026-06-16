import type { LiveSharePoint } from '../types/runWalkLiveSharePublic'
import { haversineDistanceKm } from './geo/haversine'

export function getParticipantFirstName(fullName: string): string {
  const trimmed = fullName.trim()
  if (!trimmed) return 'Participante'
  return trimmed.split(/\s+/)[0] ?? 'Participante'
}

export function calculateLiveShareAverageSpeedKmh(points: LiveSharePoint[]): number | null {
  if (points.length < 2) return null

  let totalKm = 0
  for (let index = 1; index < points.length; index += 1) {
    totalKm += haversineDistanceKm(points[index - 1], points[index])
  }

  const startedAt = new Date(points[0].recordedAt).getTime()
  const endedAt = new Date(points[points.length - 1].recordedAt).getTime()
  const elapsedHours = (endedAt - startedAt) / (1000 * 60 * 60)

  if (!Number.isFinite(elapsedHours) || elapsedHours <= 0 || totalKm <= 0) return null

  return totalKm / elapsedHours
}

export function formatAverageSpeedKmh(speedKmh: number | null): string {
  if (speedKmh == null || !Number.isFinite(speedKmh) || speedKmh <= 0) {
    return 'Calculando...'
  }

  return `${speedKmh.toFixed(1).replace('.', ',')} km/h`
}
