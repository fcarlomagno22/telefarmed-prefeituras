import { Linking } from 'react-native'
import {
  buildTelUrl,
  buildWhatsAppAppUrl,
  buildWhatsAppWebUrl,
  toWhatsAppPhone,
  type AppExternalLinkResult,
} from './appLinking.types'

export {
  APP_LINKING_WEB_LIMITATIONS,
  buildTelUrl,
  buildWhatsAppAppUrl,
  buildWhatsAppWebUrl,
  isHttpUrl,
  isWebSafeExternalUrl,
  normalizePhoneDigits,
  toWhatsAppPhone,
} from './appLinking.types'
export type { AppExternalLinkResult } from './appLinking.types'

export async function getInitialAppLinkUrl(): Promise<string | null> {
  return Linking.getInitialURL()
}

export async function openAppExternalUrl(url: string): Promise<AppExternalLinkResult> {
  if (!url.trim()) return { ok: false, reason: 'invalid' }

  try {
    const canOpen = await Linking.canOpenURL(url)
    if (!canOpen) return { ok: false, reason: 'unavailable' }
    await Linking.openURL(url)
    return { ok: true }
  } catch {
    return { ok: false, reason: 'unavailable' }
  }
}

export async function openFirstAvailableAppUrl(urls: string[]): Promise<AppExternalLinkResult> {
  for (const url of urls) {
    const result = await openAppExternalUrl(url)
    if (result.ok) return result
  }

  const fallback = urls[urls.length - 1]
  if (!fallback) return { ok: false, reason: 'invalid' }

  try {
    await Linking.openURL(fallback)
    return { ok: true }
  } catch {
    return { ok: false, reason: 'unavailable' }
  }
}

export async function openAppPhoneCall(phone: string): Promise<AppExternalLinkResult> {
  const telUrl = buildTelUrl(phone)
  if (!telUrl) return { ok: false, reason: 'invalid' }
  return openAppExternalUrl(telUrl)
}

export async function openAppMailtoUrl(mailtoUrl: string): Promise<AppExternalLinkResult> {
  if (!mailtoUrl.startsWith('mailto:')) return { ok: false, reason: 'invalid' }
  return openAppExternalUrl(mailtoUrl)
}

export async function openAppWhatsAppMessage(
  phone: string,
  message: string,
): Promise<AppExternalLinkResult> {
  const whatsAppAppUrl = buildWhatsAppAppUrl(phone, message)
  const whatsAppWebUrl = buildWhatsAppWebUrl(phone, message)

  if (!toWhatsAppPhone(phone)) return { ok: false, reason: 'invalid' }

  try {
    if (await Linking.canOpenURL(whatsAppAppUrl)) {
      await Linking.openURL(whatsAppAppUrl)
      return { ok: true }
    }
  } catch {
    // Tenta wa.me abaixo.
  }

  return openAppExternalUrl(whatsAppWebUrl)
}
