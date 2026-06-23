import { env } from '../../config/env.js'

export type ConsultarCrmConfig = {
  baseUrl: string
  token: string
}

export function getConsultarCrmConfig(): ConsultarCrmConfig | null {
  const baseUrl = env.MT_CRM_API_BASE_URL?.replace(/\/$/, '')
  const token = env.MT_CRM_API_TOKEN?.trim()

  if (!baseUrl || !token) return null

  return { baseUrl, token }
}

export function isConsultarCrmConfigured(): boolean {
  return getConsultarCrmConfig() !== null
}
