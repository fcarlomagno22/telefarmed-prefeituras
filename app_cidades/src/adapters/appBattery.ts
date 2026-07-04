export {
  getDeviceBatterySnapshot,
  isDeviceBatteryAvailable,
  mapBatteryLevelToPercent,
  subscribeDeviceBattery,
} from './appBattery.native'
export type { AppBatterySnapshot, AppBatterySubscription } from './appBattery.types'
