/**
 * Web: Screen Wake Lock API quando disponível; noop seguro caso contrário.
 * Não importa expo-keep-awake no bundle web.
 */
import { APP_KEEP_AWAKE_DEFAULT_TAG, APP_KEEP_AWAKE_WEB_LIMITATIONS } from './appKeepAwake.types'

export { APP_KEEP_AWAKE_DEFAULT_TAG, APP_KEEP_AWAKE_WEB_LIMITATIONS } from './appKeepAwake.types'

type WakeLockSentinel = {
  released: boolean
  release: () => Promise<void>
  addEventListener?: (type: 'release', listener: () => void) => void
  removeEventListener?: (type: 'release', listener: () => void) => void
  onrelease?: (() => void) | null
}

type NavigatorWithWakeLock = Navigator & {
  wakeLock?: {
    request: (type: 'screen') => Promise<WakeLockSentinel>
  }
}

const wakeLockByTag = new Map<string, WakeLockSentinel>()

function getNavigatorWakeLock() {
  if (typeof navigator === 'undefined') return null
  const nav = navigator as NavigatorWithWakeLock
  return nav.wakeLock ?? null
}

export function isAppKeepAwakeSupported(): boolean {
  return getNavigatorWakeLock() != null
}

export async function isAppKeepAwakeAvailableAsync(): Promise<boolean> {
  return isAppKeepAwakeSupported()
}

async function requestWakeLock(tag: string): Promise<void> {
  const wakeLock = getNavigatorWakeLock()
  if (!wakeLock) return

  try {
    const sentinel = await wakeLock.request('screen')
    wakeLockByTag.set(tag, sentinel)

    const handleRelease = () => {
      wakeLockByTag.delete(tag)
    }

    if (typeof sentinel.addEventListener === 'function') {
      sentinel.addEventListener('release', handleRelease)
    } else {
      sentinel.onrelease = handleRelease
    }
  } catch {
    // Tab invisível, permissão negada ou API indisponível — sessão segue sem wake lock.
  }
}

export async function activateAppKeepAwakeAsync(
  tag: string = APP_KEEP_AWAKE_DEFAULT_TAG,
): Promise<void> {
  await requestWakeLock(tag)
}

export async function deactivateAppKeepAwake(
  tag: string = APP_KEEP_AWAKE_DEFAULT_TAG,
): Promise<void> {
  const sentinel = wakeLockByTag.get(tag)
  if (!sentinel) return

  wakeLockByTag.delete(tag)

  try {
    if (!sentinel.released) {
      await sentinel.release()
    }
  } catch {
    // noop
  }
}
