import { env } from './env'
import { getRuntimeBranding } from './runtimeBranding'

export function getMenuSupportConfig() {
  return {
    email: env('EXPO_PUBLIC_SUPPORT_EMAIL', 'suporte@telefarmed.com.br'),
    whatsApp: env('EXPO_PUBLIC_SUPPORT_WHATSAPP', ''),
    phone: env('EXPO_PUBLIC_SUPPORT_PHONE', '08007771234'),
    municipalityName: getRuntimeBranding().municipalityName,
  } as const
}

export function buildSupportMailto(subject: string, body: string) {
  const config = getMenuSupportConfig()
  const params = new URLSearchParams({
    subject,
    body,
  })

  return `mailto:${config.email}?${params.toString()}`
}
