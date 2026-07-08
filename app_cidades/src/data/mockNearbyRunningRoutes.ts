import type { RunningRouteSpotRecord } from '../types/nearbyRunningRoutes'
import type { GeoCoordinates } from '../utils/geo'

/** Locais fictícios para desenvolvimento quando a API retorna lista vazia. */
export function createMockNearbyRunningRoutes(
  origin: GeoCoordinates,
): RunningRouteSpotRecord[] {
  const createdAt = new Date().toISOString()

  return [
    {
      id: 'dev-mock-parque-central',
      name: 'Parque Central',
      type: 'park',
      description:
        'Pista asfaltada com iluminação e extensão ideal para caminhada leve ou corrida de recuperação.',
      latitude: origin.latitude + 0.0042,
      longitude: origin.longitude + 0.0031,
      addressLabel: 'Av. das Palmeiras, 1200',
      locationSource: 'gps',
      coverPhotoUri: null,
      submittedByName: 'Comunidade',
      recommendCount: 12,
      notRecommendCount: 1,
      createdAt,
    },
    {
      id: 'dev-mock-orla-norte',
      name: 'Orla Norte',
      type: 'waterfront',
      description:
        'Trecho plano à beira da água, com vento constante e boa visibilidade no amanhecer.',
      latitude: origin.latitude - 0.0065,
      longitude: origin.longitude + 0.0018,
      addressLabel: 'Marginal da Orla, km 3',
      locationSource: 'gps',
      coverPhotoUri: null,
      submittedByName: 'Comunidade',
      recommendCount: 8,
      notRecommendCount: 2,
      createdAt,
    },
    {
      id: 'dev-mock-pista-cooper',
      name: 'Pista de Cooper',
      type: 'track',
      description:
        'Percurso fechado de 800 m com piso regular, indicado para treinos intervalados.',
      latitude: origin.latitude + 0.0015,
      longitude: origin.longitude - 0.0054,
      addressLabel: 'Complexo Esportivo Municipal',
      locationSource: 'address',
      coverPhotoUri: null,
      submittedByName: 'Comunidade',
      recommendCount: 15,
      notRecommendCount: 0,
      createdAt,
    },
  ]
}

export function isDevMockRunningRouteSpotId(spotId: string) {
  return __DEV__ && spotId.startsWith('dev-mock-')
}
