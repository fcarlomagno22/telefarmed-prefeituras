import * as Battery from 'expo-battery'
import { useCallback, useEffect, useState } from 'react'

export type DeviceBatteryState = {
  levelPercent: number | null
  isCharging: boolean
  isLow: boolean
  isLoading: boolean
}

const LOW_BATTERY_THRESHOLD = 20

export function useDeviceBattery() {
  const [state, setState] = useState<DeviceBatteryState>({
    levelPercent: null,
    isCharging: false,
    isLow: false,
    isLoading: true,
  })

  const refresh = useCallback(async () => {
    try {
      const [level, batteryState] = await Promise.all([
        Battery.getBatteryLevelAsync(),
        Battery.getBatteryStateAsync(),
      ])

      const levelPercent = Math.round(level * 100)
      const isCharging =
        batteryState === Battery.BatteryState.CHARGING ||
        batteryState === Battery.BatteryState.FULL
      setState({
        levelPercent,
        isCharging,
        isLow: !isCharging && levelPercent < LOW_BATTERY_THRESHOLD,
        isLoading: false,
      })
    } catch {
      setState({
        levelPercent: null,
        isCharging: false,
        isLow: false,
        isLoading: false,
      })
    }
  }, [])

  useEffect(() => {
    void refresh()

    const levelSub = Battery.addBatteryLevelListener(({ batteryLevel }) => {
      setState((prev) => {
        const levelPercent = Math.round(batteryLevel * 100)
        return {
          ...prev,
          levelPercent,
          isLow: !prev.isCharging && levelPercent < LOW_BATTERY_THRESHOLD,
        }
      })
    })

    const stateSub = Battery.addBatteryStateListener(({ batteryState }) => {
      const isCharging =
        batteryState === Battery.BatteryState.CHARGING ||
        batteryState === Battery.BatteryState.FULL
      setState((prev) => ({
        ...prev,
        isCharging,
        isLow: !isCharging && (prev.levelPercent ?? 100) < LOW_BATTERY_THRESHOLD,
      }))
    })

    return () => {
      levelSub.remove()
      stateSub.remove()
    }
  }, [refresh])

  return { ...state, refresh }
}

export function formatBatteryLevel(levelPercent: number | null, isCharging: boolean): string {
  if (levelPercent == null) return 'Indisponível'
  if (isCharging) return `${levelPercent}% (carregando)`
  return `${levelPercent}%`
}
