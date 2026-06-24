import { appEnv } from './env'
import { env } from './env'

export const menuSupportConfig = {
  email: env('EXPO_PUBLIC_SUPPORT_EMAIL', 'suporte@telefarmed.com.br'),
  whatsApp: env('EXPO_PUBLIC_SUPPORT_WHATSAPP', ''),
  phone: env('EXPO_PUBLIC_SUPPORT_PHONE', '08007771234'),
  municipalityName: appEnv.municipalityName,
} as const

export function buildSupportMailto(subject: string, body: string) {
  const params = new URLSearchParams({
    subject,
    body,
  })

  return `mailto:${menuSupportConfig.email}?${params.toString()}`
}
