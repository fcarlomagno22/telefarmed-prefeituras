import AsyncStorage from '@react-native-async-storage/async-storage'

const FAVORITES_KEY = '@telefarmed/mental-health-activity-favorites'

export async function loadMentalHealthActivityFavorites(patientCpf: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(FAVORITES_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw) as Record<string, string[]>
    return Array.isArray(parsed[patientCpf]) ? parsed[patientCpf] : []
  } catch {
    return []
  }
}

export async function toggleMentalHealthActivityFavorite(
  patientCpf: string,
  activityId: string,
): Promise<string[]> {
  const current = await loadMentalHealthActivityFavorites(patientCpf)
  const next = current.includes(activityId)
    ? current.filter((id) => id !== activityId)
    : [...current, activityId]

  const raw = await AsyncStorage.getItem(FAVORITES_KEY)
  let all: Record<string, string[]> = {}

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Record<string, string[]>
      if (parsed && typeof parsed === 'object') all = parsed
    } catch {
      all = {}
    }
  }

  all[patientCpf] = next
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(all))
  return next
}
