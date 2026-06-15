import { env } from './env'

export const rpmConfig = {
  subdomain: env('EXPO_PUBLIC_RPM_SUBDOMAIN', 'demo'),
} as const

export function buildRpmCreatorUrl(subdomain = rpmConfig.subdomain) {
  return `https://${subdomain}.readyplayer.me/avatar?frameApi`
}
