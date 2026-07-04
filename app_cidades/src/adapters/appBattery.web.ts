/**
 * Web: bateria opcional via Navigator Battery Status API quando existir.
 * Não usa expo-battery (retorna 100% falso no web).
 */
import type { AppBatterySnapshot, AppBatterySubscription } from './appBattery.types'
import { APP_BATTERY_WEB_LIMITATIONS, mapBatteryLevelToPercent } from './appBattery.types'

export { APP_BATTERY_WEB_LIMITATIONS, mapBatteryLevelToPercent } from './appBattery.types'
export type { AppBatterySnapshot, AppBatterySubscription } from './appBattery.types'

type BrowserBatteryManager = {
  level: number
  charging: boolean
  addEventListener: (type: 'levelchange' | 'chargingchange', listener: () => void) => void
  removeEventListener: (type: 'levelchange' | 'chargingchange', listener: () => void) => void
}

type NavigatorWithBattery = Navigator & {
  getBattery?: () => Promise<BrowserBatteryManager>
}

const UNAVAILABLE_SNAPSHOT: AppBatterySnapshot = {
  available: false,
  levelPercent: null,
  isCharging: false,
}

function mapBrowserBattery(manager: BrowserBatteryManager): AppBatterySnapshot {
  const levelPercent = mapBatteryLevelToPercent(manager.level)
  if (levelPercent == null) {
    return UNAVAILABLE_SNAPSHOT
  }

  return {
    available: true,
    levelPercent,
    isCharging: Boolean(manager.charging),
  }
}

async function getBrowserBatteryManager(): Promise<BrowserBatteryManager | null> {
  if (typeof navigator === 'undefined') return null

  const nav = navigator as NavigatorWithBattery
  if (typeof nav.getBattery !== 'function') return null

  try {
    return await nav.getBattery()
  } catch {
    return null
  }
}

export async function isDeviceBatteryAvailable(): Promise<boolean> {
  return (await getBrowserBatteryManager()) != null
}

export async function getDeviceBatterySnapshot(): Promise<AppBatterySnapshot> {
  const manager = await getBrowserBatteryManager()
  if (!manager) return UNAVAILABLE_SNAPSHOT

  return mapBrowserBattery(manager)
}

export function subscribeDeviceBattery(
  callback: (snapshot: AppBatterySnapshot) => void,
): AppBatterySubscription {
  let disposed = false
  let manager: BrowserBatteryManager | null = null
  let listener: (() => void) | null = null

  void getBrowserBatteryManager().then((resolved) => {
    if (disposed || !resolved) return

    manager = resolved
    listener = () => {
      callback(mapBrowserBattery(resolved))
    }

    resolved.addEventListener('levelchange', listener)
    resolved.addEventListener('chargingchange', listener)
  })

  return {
    remove: () => {
      disposed = true
      if (manager && listener) {
        manager.removeEventListener('levelchange', listener)
        manager.removeEventListener('chargingchange', listener)
      }
      manager = null
      listener = null
    },
  }
}

export function getDeviceBatteryUnavailableMessage(): string {
  return APP_BATTERY_WEB_LIMITATIONS.unavailable
}
