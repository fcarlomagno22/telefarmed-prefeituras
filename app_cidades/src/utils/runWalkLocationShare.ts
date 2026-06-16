import { Alert, Platform, Share } from 'react-native'
import { buildLiveShareViewerLink } from './runWalkLiveShareLink'

type ShareLiveLocationOptions = {
  activityName: string
  shareToken: string
}

export function waitForShareSheet(ms = 320): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function shareLiveLocationLink({
  activityName,
  shareToken,
}: ShareLiveLocationOptions): Promise<boolean> {
  const trackingLink = buildLiveShareViewerLink(shareToken)

  const message =
    `Estou iniciando "${activityName}" agora.\n\n` +
    `Acompanhe minha localização ao vivo:\n${trackingLink}\n\n` +
    `Toque no link para ver o mapa em tempo real, com meu nome e velocidade média.`

  try {
    const result = await Share.share(
      Platform.OS === 'ios'
        ? { message, url: trackingLink, title: 'Compartilhar localização' }
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
  activityName,
  shareToken,
}: ShareLiveLocationOptions & { contactName?: string }): Promise<boolean> {
  return shareLiveLocationLink({ activityName, shareToken })
}
