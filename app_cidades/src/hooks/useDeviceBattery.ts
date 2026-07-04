import {
  getDeviceBatterySnapshot,
  subscribeDeviceBattery,
} from '../adapters/appBattery'
import { useCallback, useEffect, useState } from 'react'

export type DeviceBatteryState = {
  levelPercent: number | null
  isCharging: boolean
  isLow: boolean
  isLoading: boolean
  isAvailable: boolean
}

const LOW_BATTERY_THRESHOLD = 20

function snapshotToState(snapshot: {
  available: boolean
  levelPercent: number | null
  isCharging: boolean
}, isLoading: boolean): DeviceBatteryState {
  const { available, levelPercent, isCharging } = snapshot

  return {
    isAvailable: available,
    levelPercent: available ? levelPercent : null,
    isCharging: available ? isCharging : false,
    isLow: available && !isCharging && levelPercent != null && levelPercent < LOW_BATTERY_THRESHOLD,
    isLoading,
  }
}

export function useDeviceBattery() {
  const [state, setState] = useState<DeviceBatteryState>({
    levelPercent: null,
    isCharging: false,
    isLow: false,
    isLoading: true,
    isAvailable: false,
  })

  const applySnapshot = useCallback(
    (snapshot: Parameters<typeof snapshotToState>[0]) => {
      setState(snapshotToState(snapshot, false))
    },
    [],
  )

  const refresh = useCallback(async () => {
    try {
      const snapshot = await getDeviceBatterySnapshot()
      applySnapshot(snapshot)
    } catch {
      applySnapshot({ available: false, levelPercent: null, isCharging: false })
    }
  }, [applySnapshot])

  useEffect(() => {
    void refresh()

    const subscription = subscribeDeviceBattery(applySnapshot)
    return () => subscription.remove()
  }, [applySnapshot, refresh])

  return { ...state, refresh }
}

export function formatBatteryLevel(
  levelPercent: number | null,
  isCharging: boolean,
  isAvailable = true,
): string {
  if (!isAvailable || levelPercent == null) return 'Indisponível'
  if (isCharging) return `${levelPercent}% (carregando)`
  return `${levelPercent}%`
}

export function isBatteryReadyForActivity(state: DeviceBatteryState): boolean {
  if (!state.isAvailable) return true
  return state.isCharging || (state.levelPercent != null && state.levelPercent >= 15)
}
