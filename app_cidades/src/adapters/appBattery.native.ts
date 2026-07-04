import * as Battery from 'expo-battery'
import type { AppBatterySnapshot, AppBatterySubscription } from './appBattery.types'
import { mapBatteryLevelToPercent } from './appBattery.types'

export { APP_BATTERY_WEB_LIMITATIONS, mapBatteryLevelToPercent } from './appBattery.types'
export type { AppBatterySnapshot, AppBatterySubscription } from './appBattery.types'

const UNAVAILABLE_SNAPSHOT: AppBatterySnapshot = {
  available: false,
  levelPercent: null,
  isCharging: false,
}

function mapBatteryState(batteryState: Battery.BatteryState): boolean {
  return (
    batteryState === Battery.BatteryState.CHARGING ||
    batteryState === Battery.BatteryState.FULL
  )
}

function mapSnapshot(level: number, batteryState: Battery.BatteryState): AppBatterySnapshot {
  const levelPercent = mapBatteryLevelToPercent(level)
  if (levelPercent == null) {
    return UNAVAILABLE_SNAPSHOT
  }

  return {
    available: true,
    levelPercent,
    isCharging: mapBatteryState(batteryState),
  }
}

export async function isDeviceBatteryAvailable(): Promise<boolean> {
  return Battery.isAvailableAsync()
}

export async function getDeviceBatterySnapshot(): Promise<AppBatterySnapshot> {
  const available = await Battery.isAvailableAsync()
  if (!available) {
    return UNAVAILABLE_SNAPSHOT
  }

  const [level, batteryState] = await Promise.all([
    Battery.getBatteryLevelAsync(),
    Battery.getBatteryStateAsync(),
  ])

  return mapSnapshot(level, batteryState)
}

export function subscribeDeviceBattery(
  callback: (snapshot: AppBatterySnapshot) => void,
): AppBatterySubscription {
  const notify = () => {
    void getDeviceBatterySnapshot()
      .then(callback)
      .catch(() => callback(UNAVAILABLE_SNAPSHOT))
  }

  const levelSub = Battery.addBatteryLevelListener(() => notify())
  const stateSub = Battery.addBatteryStateListener(() => notify())

  return {
    remove: () => {
      levelSub.remove()
      stateSub.remove()
    },
  }
}
