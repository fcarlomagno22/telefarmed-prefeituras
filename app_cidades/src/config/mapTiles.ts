import { env } from './env'

/** Fallback sem API key (OpenStreetMap). Prefira EXPO_PUBLIC_MAP_TILE_URL em produção. */
const DEFAULT_MAP_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

export const MAP_TILE_URL = env('EXPO_PUBLIC_MAP_TILE_URL', DEFAULT_MAP_TILE_URL)

export const MAP_TILE_PREFETCH_SUBDOMAINS = ['a', 'b', 'c', 'd'] as const

export const MAP_TILE_LAYER_OPTIONS = {
  maxZoom: 20,
  subdomains: 'abcd',
  updateWhenIdle: true,
  keepBuffer: 2,
} as const
