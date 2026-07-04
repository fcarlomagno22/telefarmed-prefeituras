/**
 * Web: abre links http(s), mailto e tel de forma previsível; ignora esquemas nativos.
 */
import { Linking } from 'react-native'
import {
  APP_LINKING_WEB_LIMITATIONS,
  buildTelUrl,
  buildWhatsAppWebUrl,
  isHttpUrl,
  isWebSafeExternalUrl,
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
  const linkingUrl = await Linking.getInitialURL()
  if (linkingUrl) return linkingUrl

  if (typeof window !== 'undefined') {
    return window.location.href
  }

  return null
}

function openInBrowser(url: string): AppExternalLinkResult {
  if (typeof window === 'undefined') return { ok: false, reason: 'unavailable' }

  try {
    if (isHttpUrl(url)) {
      const opened = window.open(url, '_blank', 'noopener,noreferrer')
      if (opened) return { ok: true }
      window.location.assign(url)
      return { ok: true }
    }

    if (url.startsWith('mailto:') || url.startsWith('tel:')) {
      window.location.assign(url)
      return { ok: true }
    }

    return { ok: false, reason: 'blocked' }
  } catch {
    return { ok: false, reason: 'unavailable' }
  }
}

export async function openAppExternalUrl(url: string): Promise<AppExternalLinkResult> {
  if (!url.trim()) return { ok: false, reason: 'invalid' }
  if (!isWebSafeExternalUrl(url)) return { ok: false, reason: 'unavailable' }
  return openInBrowser(url)
}

export async function openFirstAvailableAppUrl(urls: string[]): Promise<AppExternalLinkResult> {
  const webUrls = urls.filter(isWebSafeExternalUrl)
  if (webUrls.length === 0) return { ok: false, reason: 'unavailable' }

  for (const url of webUrls) {
    const result = await openAppExternalUrl(url)
    if (result.ok) return result
  }

  return openAppExternalUrl(webUrls[webUrls.length - 1])
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
  if (!toWhatsAppPhone(phone)) return { ok: false, reason: 'invalid' }
  return openAppExternalUrl(buildWhatsAppWebUrl(phone, message))
}
