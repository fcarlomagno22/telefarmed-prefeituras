import type { AppLocationPermissionResponse } from './appLocation.types'

export async function requestBackgroundLocationPermissionsAsync(): Promise<AppLocationPermissionResponse> {
  return {
    granted: false,
    status: 'undetermined',
    canAskAgain: true,
  }
}

export async function startRunWalkBackgroundLocationUpdatesAsync(): Promise<boolean> {
  return false
}

export async function stopRunWalkBackgroundLocationUpdatesAsync(): Promise<void> {
  // Web não suporta GPS contínuo com PWA fechado.
}

export async function isRunWalkBackgroundLocationRunningAsync(): Promise<boolean> {
  return false
}
