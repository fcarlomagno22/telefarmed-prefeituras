import type {
  RunningRouteSpot,
  RunningRouteSpotComment,
  RunningRouteSpotType,
} from '../types/nearbyRunningRoutes'
import { formatDistanceKm, GeoCoordinates, haversineDistanceKm } from './geo'

const MOCK_DELAY_MS = 360

type SpotTemplate = {
  id: string
  name: string
  type: RunningRouteSpotType
  description: string
  latOffset: number
  lngOffset: number
  recommendCount: number
  notRecommendCount: number
  comments: RunningRouteSpotComment[]
}

const SPOT_TEMPLATES: SpotTemplate[] = [
  {
    id: 'route-spot-1',
    name: 'Parque Linear',
    type: 'park',
    description: 'Trilha arborizada com pista de corrida e área para alongamento.',
    latOffset: 0.0078,
    lngOffset: -0.0042,
    recommendCount: 24,
    notRecommendCount: 3,
    comments: [
      {
        id: 'c1',
        authorName: 'Marina',
        text: 'Bom para corrida leve de manhã. Iluminação ok até umas 19h.',
        createdAt: '2026-06-10T08:12:00.000Z',
      },
      {
        id: 'c2',
        authorName: 'Rafael',
        text: 'Fim de semana fica cheio, mas o percurso é plano e seguro.',
        createdAt: '2026-06-08T18:40:00.000Z',
      },
    ],
  },
  {
    id: 'route-spot-2',
    name: 'Pista de Cooper',
    type: 'track',
    description: 'Pista oficial com marcação de distância, muito usada por corredores locais.',
    latOffset: -0.0055,
    lngOffset: 0.0061,
    recommendCount: 41,
    notRecommendCount: 2,
    comments: [
      {
        id: 'c3',
        authorName: 'Juliana',
        text: 'Ótima para treinos intervalados. À noite a iluminação é fraca no trecho leste.',
        createdAt: '2026-06-11T11:05:00.000Z',
      },
    ],
  },
  {
    id: 'route-spot-3',
    name: 'Orla / Margem',
    type: 'waterfront',
    description: 'Percurso à beira d’água com vista aberta, popular para caminhada e corrida.',
    latOffset: 0.0112,
    lngOffset: 0.0028,
    recommendCount: 18,
    notRecommendCount: 7,
    comments: [
      {
        id: 'c4',
        authorName: 'Carlos',
        text: 'Vento forte à tarde. De manhã cedo é o melhor horário.',
        createdAt: '2026-06-09T06:22:00.000Z',
      },
      {
        id: 'c5',
        authorName: 'Ana',
        text: 'Evite sozinha depois do escurecer — pouca iluminação no final do trecho.',
        createdAt: '2026-06-07T20:15:00.000Z',
      },
    ],
  },
  {
    id: 'route-spot-4',
    name: 'Trilha Urbana',
    type: 'trail',
    description: 'Caminho entre bairros com subidas leves, frequente para corrida contínua.',
    latOffset: -0.0089,
    lngOffset: -0.0056,
    recommendCount: 15,
    notRecommendCount: 5,
    comments: [
      {
        id: 'c6',
        authorName: 'Pedro',
        text: 'Bom para corrida moderada. Cuidado com ciclistas no trecho central.',
        createdAt: '2026-06-12T07:48:00.000Z',
      },
    ],
  },
  {
    id: 'route-spot-5',
    name: 'Praça dos Esportes',
    type: 'plaza',
    description: 'Área aberta com pista circular, muito usada para aquecimento e trote leve.',
    latOffset: 0.0034,
    lngOffset: 0.0087,
    recommendCount: 29,
    notRecommendCount: 4,
    comments: [
      {
        id: 'c7',
        authorName: 'Luiza',
        text: 'Seguro e movimentado até tarde. Ideal para iniciantes.',
        createdAt: '2026-06-13T17:30:00.000Z',
      },
    ],
  },
]

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

function estimateWalkMinutes(distanceKm: number) {
  return Math.max(1, Math.round((distanceKm / 5) * 60))
}

export function getRunningRouteSpotTypeLabel(type: RunningRouteSpotType) {
  if (type === 'park') return 'Parque'
  if (type === 'track') return 'Pista de cooper'
  if (type === 'waterfront') return 'Orla / margem'
  if (type === 'trail') return 'Trilha urbana'
  return 'Praça / área aberta'
}

export function formatRunningRouteSpotMeta(spot: RunningRouteSpot) {
  return `${formatDistanceKm(spot.distanceKm)} · ~${spot.walkMinutes} min a pé`
}

export function getSeedCommentsForSpot(spotId: string): RunningRouteSpotComment[] {
  return SPOT_TEMPLATES.find((spot) => spot.id === spotId)?.comments ?? []
}

export async function fetchNearbyRunningRoutes(origin: GeoCoordinates): Promise<RunningRouteSpot[]> {
  await delay(MOCK_DELAY_MS)

  return SPOT_TEMPLATES.map((template) => {
    const latitude = origin.latitude + template.latOffset
    const longitude = origin.longitude + template.lngOffset
    const distanceKm = haversineDistanceKm(origin, { latitude, longitude })

    return {
      id: template.id,
      name: template.name,
      type: template.type,
      description: template.description,
      latitude,
      longitude,
      distanceKm,
      walkMinutes: estimateWalkMinutes(distanceKm),
      recommendCount: template.recommendCount,
      notRecommendCount: template.notRecommendCount,
    }
  }).sort((a, b) => a.distanceKm - b.distanceKm)
}
