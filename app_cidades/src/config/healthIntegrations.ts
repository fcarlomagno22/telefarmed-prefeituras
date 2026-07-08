import { HealthIntegrationConfig, HealthPermissionConfig } from '../types/healthIntegrations'

export const HEALTH_INTEGRATIONS: HealthIntegrationConfig[] = [
  {
    id: 'apple-health',
    title: 'Apple Health',
    description: 'Passos, distância e frequência cardíaca do iPhone e Apple Watch',
    iconFamily: 'ionicons',
    icon: 'logo-apple',
    gradient: ['#ff8fab', '#ff2d55', '#c9184a'],
    accentColor: '#ff2d55',
    platform: 'ios',
  },
  {
    id: 'health-connect',
    title: 'Health Connect',
    description: 'Sincronize métricas do Android com relógios e apps parceiros',
    iconFamily: 'material',
    icon: 'heart-pulse',
    gradient: ['#6ee7b7', '#10b981', '#047857'],
    accentColor: '#10b981',
    platform: 'android',
  },
  {
    id: 'devices',
    title: 'Outros dispositivos',
    description: 'Pulseiras, smartwatches e balanças compatíveis via Bluetooth',
    iconFamily: 'material',
    icon: 'watch-variant',
    gradient: ['#93c5fd', '#3b82f6', '#1d4ed8'],
    accentColor: '#3b82f6',
    platform: 'all',
  },
]

export const HEALTH_PERMISSIONS: HealthPermissionConfig[] = [
  { id: 'steps', label: 'Passos', icon: 'walk' },
  { id: 'distance', label: 'Distância', icon: 'map-marker-distance' },
  { id: 'heart-rate', label: 'Freq. cardíaca', icon: 'heart-pulse' },
  { id: 'body', label: 'Peso e altura', icon: 'human' },
]

export const DEFAULT_ENABLED_PERMISSIONS = HEALTH_PERMISSIONS.map((item) => item.id)
