import { Alert, Platform, Share } from 'react-native'
import { openAppWhatsAppMessage } from '../adapters/appLinking'
import { buildLiveShareViewerLink } from './runWalkLiveShareLink'
import { isValidPhone } from './phone'

type ShareLiveLocationOptions = {
  shareToken: string
  recipientName?: string
  recipientPhone?: string
}

export function buildLiveShareShareMessage(
  trackingLink: string,
  recipientName?: string,
): string {
  const greeting = recipientName?.trim()
    ? `Olá, ${recipientName.trim()},`
    : 'Olá,'

  return (
    `${greeting} vou começar meu treino agora e por segurança estou compartilhando minha localização com você: ${trackingLink}\n\n` +
    'Toque no link para acompanhar minha localização ao vivo.'
  )
}

export async function openWhatsAppMessage(phone: string, message: string): Promise<boolean> {
  const result = await openAppWhatsAppMessage(phone, message)
  return result.ok
}

export function waitForShareSheet(ms = 320): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function shareLiveLocationLink({
  shareToken,
  recipientName,
  recipientPhone,
}: ShareLiveLocationOptions): Promise<boolean> {
  const trackingLink = buildLiveShareViewerLink(shareToken)
  const message = buildLiveShareShareMessage(trackingLink, recipientName)

  if (recipientPhone && isValidPhone(recipientPhone)) {
    const openedWhatsApp = await openWhatsAppMessage(recipientPhone, message)
    if (openedWhatsApp) return true
  }

  try {
    const result = await Share.share(
      Platform.OS === 'ios'
        ? { message, title: 'Compartilhar localização' }
        : { message, title: 'Compartilhar localização' },
    )

    return result.action !== Share.dismissedAction
  } catch {
    Alert.alert(
      'Não foi possível compartilhar',
      'Tente novamente em instantes ou copie o link manualmente.',
    )
    return false
  }
}

/** @deprecated Use shareLiveLocationLink */
export async function shareLiveLocationWithContact({
  shareToken,
  contactName,
  contactPhone,
}: ShareLiveLocationOptions & { contactName?: string; contactPhone?: string }): Promise<boolean> {
  return shareLiveLocationLink({
    shareToken,
    recipientName: contactName,
    recipientPhone: contactPhone,
  })
}
