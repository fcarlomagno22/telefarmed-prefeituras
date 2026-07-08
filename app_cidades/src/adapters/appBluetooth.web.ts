import {
  APP_BLUETOOTH_WEB_LIMITATIONS,
  type AppBluetoothDevice,
  type AppBluetoothEnableResult,
  type AppBluetoothScanSubscription,
  type AppBluetoothState,
} from './appBluetooth.types'

export {
  APP_BLUETOOTH_WEB_LIMITATIONS,
  getBluetoothDeviceIcon,
  rssiToSignalLevel,
} from './appBluetooth.types'
export type {
  AppBluetoothDevice,
  AppBluetoothEnableResult,
  AppBluetoothScanSubscription,
  AppBluetoothState,
} from './appBluetooth.types'

export async function isBluetoothSupported(): Promise<boolean> {
  return false
}

export async function requestBluetoothPermissions(): Promise<boolean> {
  return false
}

export async function getBluetoothState(): Promise<AppBluetoothState> {
  return 'unsupported'
}

export async function requestEnableBluetooth(): Promise<AppBluetoothEnableResult> {
  return 'unsupported'
}

export function openBluetoothSettings(): void {
  // no-op on web
}

export function startBluetoothDeviceScan(
  _onDevice: (device: AppBluetoothDevice) => void,
): AppBluetoothScanSubscription {
  return { stop: () => undefined }
}

export async function connectBluetoothDevice(_deviceId: string): Promise<AppBluetoothDevice> {
  throw new Error(APP_BLUETOOTH_WEB_LIMITATIONS.unavailable)
}

export async function disconnectBluetoothDevice(_deviceId: string): Promise<void> {
  // no-op on web
}
