import { env } from '../../config/env.js'

export type Rh3Config = {
  baseUrl: string
  clientId: string
  clientSecret: string
}

export function getRh3Config(): Rh3Config | null {
  const baseUrl = env.RH3_API_BASE_URL?.replace(/\/$/, '')
  const clientId = env.RH3_CLIENT_ID?.trim()
  const clientSecret = env.RH3_CLIENT_SECRET?.trim()

  if (!baseUrl || !clientId || !clientSecret) return null

  return { baseUrl, clientId, clientSecret }
}

export function isRh3Configured(): boolean {
  return getRh3Config() !== null
}

export function requireRh3Config(): Rh3Config {
  const config = getRh3Config()
  if (!config) {
    throw new Error(
      'Integração RH3 não configurada. Defina RH3_API_BASE_URL, RH3_CLIENT_ID e RH3_CLIENT_SECRET.',
    )
  }
  return config
}
