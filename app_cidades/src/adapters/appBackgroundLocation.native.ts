import * as Location from 'expo-location'
import { RUN_WALK_BACKGROUND_LOCATION_TASK } from '../tasks/runWalkBackgroundLocationTask'
import type { AppLocationPermissionResponse } from './appLocation.types'

function mapPermission(permission: Location.PermissionResponse): AppLocationPermissionResponse {
  return {
    granted: permission.granted,
    status: permission.status,
    canAskAgain: permission.canAskAgain,
  }
}

export async function requestBackgroundLocationPermissionsAsync(): Promise<AppLocationPermissionResponse> {
  const foreground = await Location.getForegroundPermissionsAsync()
  if (!foreground.granted) {
    const requested = await Location.requestForegroundPermissionsAsync()
    if (!requested.granted) return mapPermission(requested)
  }

  const background = await Location.getBackgroundPermissionsAsync()
  if (background.granted) return mapPermission(background)

  return mapPermission(await Location.requestBackgroundPermissionsAsync())
}

export async function startRunWalkBackgroundLocationUpdatesAsync(): Promise<boolean> {
  const hasStarted = await Location.hasStartedLocationUpdatesAsync(RUN_WALK_BACKGROUND_LOCATION_TASK)
  if (hasStarted) return true

  const background = await Location.getBackgroundPermissionsAsync()
  if (!background.granted) return false

  await Location.startLocationUpdatesAsync(RUN_WALK_BACKGROUND_LOCATION_TASK, {
    accuracy: Location.Accuracy.BestForNavigation,
    distanceInterval: 1,
    showsBackgroundLocationIndicator: true,
    pausesUpdatesAutomatically: false,
    activityType: Location.ActivityType.Fitness,
    foregroundService: {
      notificationTitle: 'Caminhada em andamento',
      notificationBody: 'Telefarmed está registrando tempo, distância e rota.',
      notificationColor: '#ff6b00',
    },
  })

  return true
}

export async function stopRunWalkBackgroundLocationUpdatesAsync(): Promise<void> {
  const hasStarted = await Location.hasStartedLocationUpdatesAsync(RUN_WALK_BACKGROUND_LOCATION_TASK)
  if (!hasStarted) return

  await Location.stopLocationUpdatesAsync(RUN_WALK_BACKGROUND_LOCATION_TASK)
}

export async function isRunWalkBackgroundLocationRunningAsync(): Promise<boolean> {
  return Location.hasStartedLocationUpdatesAsync(RUN_WALK_BACKGROUND_LOCATION_TASK)
}
