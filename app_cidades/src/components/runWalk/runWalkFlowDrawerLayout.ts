import { Platform } from 'react-native'

export const RUN_WALK_FLOW_DRAWER_MIN_HEIGHT = '52%' as const
export const RUN_WALK_MUSIC_DRAWER_MIN_HEIGHT = '42%' as const

type RunWalkFlowDrawerKind = 'flow' | 'music'

/** Na web/PWA o sheet segue o conteúdo; no app nativo mantém altura mínima confortável. */
export function getRunWalkFlowDrawerMinHeight(
  kind: RunWalkFlowDrawerKind,
): number | `${number}%` | undefined {
  if (Platform.OS === 'web') return undefined

  return kind === 'flow' ? RUN_WALK_FLOW_DRAWER_MIN_HEIGHT : RUN_WALK_MUSIC_DRAWER_MIN_HEIGHT
}
