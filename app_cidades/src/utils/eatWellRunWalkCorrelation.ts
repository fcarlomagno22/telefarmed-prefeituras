import { getActivityDateIso, loadRunWalkActivityHistory, ensureTodayRunWalkActivity } from '../data/runWalkActivityHistoryStorage'
import type { RunWalkDayEnergy } from '../types/eatWell'
import { toLocalDateIso } from './runWalkWeeklyChart'

export async function loadRunWalkDayEnergy(
  patientCpf: string,
  dateIso: string = toLocalDateIso(new Date()),
): Promise<RunWalkDayEnergy> {
  await ensureTodayRunWalkActivity(patientCpf)
  const history = await loadRunWalkActivityHistory(patientCpf)
  const dayActivities = history.filter((activity) => getActivityDateIso(activity) === dateIso)

  return {
    totalCaloriesBurned: dayActivities.reduce(
      (sum, activity) => sum + activity.estimatedCalories,
      0,
    ),
    activities: dayActivities.map((activity) => ({
      id: activity.id,
      activityName: activity.activityName,
      modality: activity.modality,
      estimatedCalories: activity.estimatedCalories,
      activeMinutes: activity.activeMinutes,
      completedAt: activity.completedAt,
      locationCity: activity.locationCity,
      locationState: activity.locationState,
    })),
  }
}

export function getAdjustedCalorieTarget(baseCalories: number, burnedCalories: number) {
  return Math.round(baseCalories + burnedCalories)
}
