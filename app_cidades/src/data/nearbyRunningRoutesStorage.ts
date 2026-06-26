import AsyncStorage from '@react-native-async-storage/async-storage'
import type {
  RunningRouteSpotComment,
  RunningRouteVote,
} from '../types/nearbyRunningRoutes'

const STORAGE_KEY = '@telefarmed/nearby-running-routes'

type SpotEngagement = {
  recommendCount: number
  notRecommendCount: number
  userVote: RunningRouteVote | null
  comments: RunningRouteSpotComment[]
}

type NearbyRunningRoutesStore = Record<string, Record<string, SpotEngagement>>

async function readStore(): Promise<NearbyRunningRoutesStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as NearbyRunningRoutesStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeStore(store: NearbyRunningRoutesStore) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function createEngagement(seedRecommend: number, seedNotRecommend: number): SpotEngagement {
  return {
    recommendCount: seedRecommend,
    notRecommendCount: seedNotRecommend,
    userVote: null,
    comments: [],
  }
}

export async function loadSpotEngagement(
  patientCpf: string,
  spotId: string,
  seedRecommend: number,
  seedNotRecommend: number,
): Promise<SpotEngagement> {
  const store = await readStore()
  const patientStore = store[patientCpf]

  if (!patientStore?.[spotId]) {
    return createEngagement(seedRecommend, seedNotRecommend)
  }

  return patientStore[spotId]
}

export async function setSpotVote(
  patientCpf: string,
  spotId: string,
  seedRecommend: number,
  seedNotRecommend: number,
  nextVote: RunningRouteVote | null,
): Promise<SpotEngagement> {
  const store = await readStore()
  const patientStore = store[patientCpf] ?? {}
  const current =
    patientStore[spotId] ?? createEngagement(seedRecommend, seedNotRecommend)

  let recommendCount = current.recommendCount
  let notRecommendCount = current.notRecommendCount

  if (current.userVote === 'recommend') recommendCount -= 1
  if (current.userVote === 'not-recommend') notRecommendCount -= 1

  if (nextVote === 'recommend') recommendCount += 1
  if (nextVote === 'not-recommend') notRecommendCount += 1

  const updated: SpotEngagement = {
    ...current,
    recommendCount: Math.max(0, recommendCount),
    notRecommendCount: Math.max(0, notRecommendCount),
    userVote: nextVote,
  }

  store[patientCpf] = {
    ...patientStore,
    [spotId]: updated,
  }

  await writeStore(store)
  return updated
}

export async function addSpotComment(
  patientCpf: string,
  spotId: string,
  seedRecommend: number,
  seedNotRecommend: number,
  authorName: string,
  text: string,
): Promise<SpotEngagement> {
  const trimmed = text.trim()
  if (!trimmed) {
    return loadSpotEngagement(patientCpf, spotId, seedRecommend, seedNotRecommend)
  }

  const store = await readStore()
  const patientStore = store[patientCpf] ?? {}
  const current =
    patientStore[spotId] ?? createEngagement(seedRecommend, seedNotRecommend)

  const comment: RunningRouteSpotComment = {
    id: `user-${Date.now()}`,
    authorName,
    text: trimmed,
    createdAt: new Date().toISOString(),
  }

  const updated: SpotEngagement = {
    ...current,
    comments: [comment, ...current.comments],
  }

  store[patientCpf] = {
    ...patientStore,
    [spotId]: updated,
  }

  await writeStore(store)
  return updated
}
