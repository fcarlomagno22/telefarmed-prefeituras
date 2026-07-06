import type { AppNetworkState, AppNetworkSubscription } from './appNetwork.types'

function readNetworkState(): AppNetworkState {
  if (typeof navigator === 'undefined') {
    return { isConnected: true }
  }

  return { isConnected: navigator.onLine }
}

export async function getAppNetworkState(): Promise<AppNetworkState> {
  return readNetworkState()
}

export function subscribeAppNetwork(
  listener: (state: AppNetworkState) => void,
): AppNetworkSubscription {
  if (typeof window === 'undefined') {
    return { remove: () => undefined }
  }

  const notify = () => listener(readNetworkState())
  window.addEventListener('online', notify)
  window.addEventListener('offline', notify)

  return {
    remove: () => {
      window.removeEventListener('online', notify)
      window.removeEventListener('offline', notify)
    },
  }
}
