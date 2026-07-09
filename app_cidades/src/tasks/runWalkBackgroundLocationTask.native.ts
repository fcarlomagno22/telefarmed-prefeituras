import * as Location from 'expo-location'
import * as TaskManager from 'expo-task-manager'
import {
  enqueueRunWalkBackgroundGpsFixes,
  mapLocationObjectToBackgroundSample,
} from '../data/runWalkBackgroundGpsQueue'
import { RUN_WALK_BACKGROUND_LOCATION_TASK } from './runWalkBackgroundLocationTask'

TaskManager.defineTask(RUN_WALK_BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) return
  if (!data) return

  const locations = (data as { locations?: Location.LocationObject[] }).locations ?? []
  if (locations.length === 0) return

  await enqueueRunWalkBackgroundGpsFixes(
    locations.map((location) => mapLocationObjectToBackgroundSample(location)),
  )
})

export { RUN_WALK_BACKGROUND_LOCATION_TASK }
