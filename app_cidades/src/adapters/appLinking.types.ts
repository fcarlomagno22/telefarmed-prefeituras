export type AppExternalLinkResult =
  | { ok: true }
  | { ok: false; reason: 'invalid' | 'blocked' | 'unavailable' }

export const APP_LINKING_WEB_LIMITATIONS = {
  phone:
    'Ligações usam o app de telefone do dispositivo. Em desktop, o navegador pode não iniciar chamadas.',
  mailto:
    'E-mails abrem o cliente padrão do dispositivo ou navegador. Se nada abrir, copie o endereço de suporte.',
  whatsApp:
    'WhatsApp abre em nova aba (wa.me). É necessário estar logado no WhatsApp Web ou ter o app instalado.',
  maps:
    'Rotas abrem Google Maps ou Waze na web quando apps nativos não estão disponíveis.',
} as const

export function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, '')
}

export function toWhatsAppPhone(phone: string): string {
  const digits = normalizePhoneDigits(phone)
  if (!digits) return ''
  if (digits.startsWith('55') && digits.length >= 12) return digits
  return `55${digits}`
}

export function buildWhatsAppWebUrl(phone: string, message: string): string {
  const normalizedPhone = toWhatsAppPhone(phone)
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`
}

export function buildWhatsAppAppUrl(phone: string, message: string): string {
  const normalizedPhone = toWhatsAppPhone(phone)
  return `whatsapp://send?phone=${normalizedPhone}&text=${encodeURIComponent(message)}`
}

export function buildTelUrl(phone: string): string | null {
  const digits = normalizePhoneDigits(phone)
  if (!digits) return null
  return `tel:${digits}`
}

export function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url)
}

export function isWebSafeExternalUrl(url: string): boolean {
  return isHttpUrl(url) || url.startsWith('mailto:') || url.startsWith('tel:')
}
