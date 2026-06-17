import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = '@telefarmed/run-walk-joined-challenges'

type JoinedStore = Record<string, string[]>

async function readStore(): Promise<JoinedStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as JoinedStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeStore(store: JoinedStore) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export async function loadJoinedRunWalkChallengeIds(patientCpf: string): Promise<string[]> {
  const store = await readStore()
  return store[patientCpf] ?? []
}

export async function joinRunWalkChallenge(patientCpf: string, challengeId: string) {
  const store = await readStore()
  const current = store[patientCpf] ?? []

  if (current.includes(challengeId)) return

  store[patientCpf] = [...current, challengeId]
  await writeStore(store)
}

export async function isRunWalkChallengeJoined(
  patientCpf: string,
  challengeId: string,
): Promise<boolean> {
  const joined = await loadJoinedRunWalkChallengeIds(patientCpf)
  return joined.includes(challengeId)
}
