export type AppBluetoothState =
  | 'unknown'
  | 'resetting'
  | 'unsupported'
  | 'unauthorized'
  | 'poweredOff'
  | 'poweredOn'

export type AppBluetoothDevice = {
  id: string
  name: string
  rssi: number | null
}

export type AppBluetoothScanSubscription = {
  stop: () => void
}

export type AppBluetoothEnableResult = 'enabled' | 'denied' | 'unsupported'

export const APP_BLUETOOTH_WEB_LIMITATIONS = {
  unavailable:
    'Bluetooth não está disponível na versão web. Use o app no celular para parear dispositivos.',
} as const

export function rssiToSignalLevel(rssi: number | null): 1 | 2 | 3 | 4 {
  if (rssi === null || !Number.isFinite(rssi)) return 2
  if (rssi >= -55) return 4
  if (rssi >= -65) return 3
  if (rssi >= -75) return 2
  return 1
}

export function getBluetoothDeviceIcon(name: string): string {
  const normalized = name.toLowerCase()
  if (
    normalized.includes('watch') ||
    normalized.includes('relógio') ||
    normalized.includes('relogio') ||
    normalized.includes('galaxy') ||
    normalized.includes('garmin') ||
    normalized.includes('band') ||
    normalized.includes('mi ') ||
    normalized.includes('amazfit') ||
    normalized.includes('fitbit')
  ) {
    return 'watch-variant'
  }
  if (
    normalized.includes('scale') ||
    normalized.includes('balança') ||
    normalized.includes('balanca') ||
    normalized.includes('weight') ||
    normalized.includes('peso')
  ) {
    return 'scale-bathroom'
  }
  return 'bluetooth'
}
