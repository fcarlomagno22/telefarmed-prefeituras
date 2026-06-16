import type { LiveShareSessionPublicResult } from '../types/runWalkLiveSharePublic'
import { NETWORK_USER_PHOTOS } from './networkUserPhotos'

export const LIVE_SHARE_DEMO_TOKEN = 'demo'

/** Rota fictícia perto da Av. Paulista para preview visual. */
function buildDemoPoints() {
  const coords: Array<[number, number]> = [
    [-23.561414, -46.655881],
    [-23.560912, -46.654821],
    [-23.560401, -46.653902],
    [-23.559887, -46.652984],
    [-23.559312, -46.652112],
    [-23.558701, -46.651241],
    [-23.558089, -46.650402],
    [-23.557478, -46.649531],
  ]

  const startedAt = Date.now() - 18 * 60 * 1000

  return coords.map(([latitude, longitude], index) => ({
    id: `demo-point-${index + 1}`,
    latitude,
    longitude,
    accuracyMeters: 12,
    recordedAt: new Date(startedAt + index * 2.5 * 60 * 1000).toISOString(),
  }))
}

export function buildLiveShareDemoSession(): LiveShareSessionPublicResult {
  const now = new Date()
  const startedAt = new Date(now.getTime() - 18 * 60 * 1000)

  return {
    session: {
      id: 'demo-session',
      shareToken: LIVE_SHARE_DEMO_TOKEN,
      participantName: 'Maria Silva',
      participantPhotoUrl: NETWORK_USER_PHOTOS['3'],
      activityName: 'Corrida matinal',
      isActive: true,
      startedAt: startedAt.toISOString(),
      expiresAt: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
      points: buildDemoPoints(),
    },
  }
}

export function isLiveShareDemoToken(token: string): boolean {
  return token.trim().toLowerCase() === LIVE_SHARE_DEMO_TOKEN
}
