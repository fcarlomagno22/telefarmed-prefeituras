import type { AppNetworkState, AppNetworkSubscription } from './appNetwork.types'

const CONNECTIVITY_PROBE_URL = 'https://clients3.google.com/generate_204'
const PROBE_TIMEOUT_MS = 3_500
const POLL_INTERVAL_MS = 8_000

let lastKnownState: AppNetworkState = { isConnected: true }

async function probeConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS)
    const response = await fetch(CONNECTIVITY_PROBE_URL, {
      method: 'HEAD',
      signal: controller.signal,
    })
    clearTimeout(timeout)
    return response.ok
  } catch {
    return false
  }
}

async function refreshNetworkState(): Promise<AppNetworkState> {
  const isConnected = await probeConnectivity()
  lastKnownState = { isConnected }
  return lastKnownState
}

export async function getAppNetworkState(): Promise<AppNetworkState> {
  return refreshNetworkState()
}

export function subscribeAppNetwork(
  listener: (state: AppNetworkState) => void,
): AppNetworkSubscription {
  let active = true
  let timer: ReturnType<typeof setInterval> | null = null

  const emit = async () => {
    if (!active) return
    const next = await refreshNetworkState()
    listener(next)
  }

  void emit()
  timer = setInterval(() => {
    void emit()
  }, POLL_INTERVAL_MS)

  return {
    remove: () => {
      active = false
      if (timer) clearInterval(timer)
    },
  }
}
