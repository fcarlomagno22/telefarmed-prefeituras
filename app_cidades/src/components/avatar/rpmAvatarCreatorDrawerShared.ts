import * as Haptics from 'expo-haptics'
import { StyleSheet } from 'react-native'
import { colors } from '../../theme/colors'
import { isRpmAvatarExportedEvent, parseRpmWebViewMessage } from '../../utils/readyPlayerMe'

export type RpmAvatarCreatorDrawerProps = {
  visible: boolean
  onClose: () => void
  onAvatarExported: (avatarGlbUrl: string) => void
}

export const RPM_CREATOR_IFRAME_TITLE = 'Ready Player Me avatar creator'

export function isReadyPlayerMeOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin)
    return hostname === 'readyplayer.me' || hostname.endsWith('.readyplayer.me')
  } catch {
    return false
  }
}

export function serializeRpmCreatorMessageData(data: unknown): string | null {
  if (typeof data === 'string') return data
  if (data && typeof data === 'object') return JSON.stringify(data)
  return null
}

export function processRpmCreatorMessage(
  rawData: string,
  onAvatarExported: (avatarGlbUrl: string) => void,
  onClose: () => void,
): boolean {
  const payload = parseRpmWebViewMessage(rawData)
  if (!isRpmAvatarExportedEvent(payload)) return false

  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  onAvatarExported(payload.data.url)
  onClose()
  return true
}

export async function triggerRpmCreatorCloseHaptic() {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
}

export const rpmAvatarCreatorDrawerStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  closeButtonPressed: {
    opacity: 0.82,
  },
  toolbarTextCol: {
    flex: 1,
    gap: 2,
  },
  toolbarTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  toolbarSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
  },
  embed: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
})
