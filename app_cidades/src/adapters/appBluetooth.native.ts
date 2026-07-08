import { BleManager, State } from 'react-native-ble-plx'
import { Linking, PermissionsAndroid, Platform } from 'react-native'
import type {
  AppBluetoothDevice,
  AppBluetoothEnableResult,
  AppBluetoothScanSubscription,
  AppBluetoothState,
} from './appBluetooth.types'

let manager: BleManager | null = null

function getManager(): BleManager {
  if (!manager) {
    manager = new BleManager()
  }
  return manager
}

function mapBluetoothState(state: State): AppBluetoothState {
  switch (state) {
    case State.PoweredOn:
      return 'poweredOn'
    case State.PoweredOff:
      return 'poweredOff'
    case State.Unauthorized:
      return 'unauthorized'
    case State.Unsupported:
      return 'unsupported'
    case State.Resetting:
      return 'resetting'
    default:
      return 'unknown'
  }
}

export async function isBluetoothSupported(): Promise<boolean> {
  return Platform.OS === 'ios' || Platform.OS === 'android'
}

export async function requestBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true
  }

  if (Platform.Version >= 31) {
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ])

    return (
      result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
        PermissionsAndroid.RESULTS.GRANTED &&
      result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
        PermissionsAndroid.RESULTS.GRANTED
    )
  }

  const locationResult = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  )
  return locationResult === PermissionsAndroid.RESULTS.GRANTED
}

export async function getBluetoothState(): Promise<AppBluetoothState> {
  const state = await getManager().state()
  return mapBluetoothState(state)
}

async function waitForBluetoothPoweredOn(timeoutMs: number): Promise<boolean> {
  const bleManager = getManager()
  const initial = await bleManager.state()
  if (initial === State.PoweredOn) {
    return true
  }

  return new Promise((resolve) => {
    let settled = false

    const timeout = setTimeout(() => {
      if (settled) return
      settled = true
      subscription.remove()
      resolve(false)
    }, timeoutMs)

    const subscription = bleManager.onStateChange((state) => {
      if (state !== State.PoweredOn || settled) return
      settled = true
      clearTimeout(timeout)
      subscription.remove()
      resolve(true)
    }, true)
  })
}

export async function requestEnableBluetooth(): Promise<AppBluetoothEnableResult> {
  if (!(await isBluetoothSupported())) {
    return 'unsupported'
  }

  const bleManager = getManager()
  const currentState = await bleManager.state()
  if (currentState === State.PoweredOn) {
    return 'enabled'
  }

  if (Platform.OS === 'android') {
    try {
      await bleManager.enable()
      const poweredOn = await waitForBluetoothPoweredOn(10_000)
      return poweredOn ? 'enabled' : 'denied'
    } catch {
      return 'denied'
    }
  }

  const poweredOn = await waitForBluetoothPoweredOn(4_000)
  return poweredOn ? 'enabled' : 'denied'
}

export function openBluetoothSettings(): void {
  if (Platform.OS === 'ios') {
    void Linking.openURL('App-Prefs:Bluetooth').catch(() => Linking.openSettings())
    return
  }

  void Linking.openSettings()
}

function mapDiscoveredDevice(device: {
  id: string
  name: string | null
  localName: string | null
  rssi: number | null
}): AppBluetoothDevice {
  return {
    id: device.id,
    name: device.name?.trim() || device.localName?.trim() || 'Dispositivo Bluetooth',
    rssi: device.rssi,
  }
}

export function startBluetoothDeviceScan(
  onDevice: (device: AppBluetoothDevice) => void,
): AppBluetoothScanSubscription {
  const bleManager = getManager()
  const seenIds = new Set<string>()

  bleManager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
    if (error || !device?.id) return

    if (seenIds.has(device.id)) return
    seenIds.add(device.id)

    onDevice(mapDiscoveredDevice(device))
  })

  return {
    stop: () => {
      bleManager.stopDeviceScan().catch(() => undefined)
    },
  }
}

export async function connectBluetoothDevice(deviceId: string): Promise<AppBluetoothDevice> {
  const bleManager = getManager()
  bleManager.stopDeviceScan().catch(() => undefined)

  const device = await bleManager.connectToDevice(deviceId, {
    autoConnect: false,
    timeout: 12_000,
  })
  await device.discoverAllServicesAndCharacteristics()

  return mapDiscoveredDevice(device)
}

export async function disconnectBluetoothDevice(deviceId: string): Promise<void> {
  const bleManager = getManager()
  const isConnected = await bleManager.isDeviceConnected(deviceId)
  if (!isConnected) return
  await bleManager.cancelDeviceConnection(deviceId)
}

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
