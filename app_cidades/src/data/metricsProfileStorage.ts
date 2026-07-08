import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  getMetricsProfile,
  updateMetricsProfile,
  type UpdateMetricsProfileInput,
} from '../lib/api/vd/metricas'
import { ProfileSnapshot } from '../types/metrics'
import { metricsProfileDtoToSnapshot } from '../utils/metricsProfile'

const STORAGE_KEY = '@telefarmed/metrics-profile'

type MetricsProfileStore = Record<string, ProfileSnapshot>

export function createDefaultMetricsProfile(): ProfileSnapshot {
  return {
    height: '',
    weight: '',
    birthDate: '',
    age: '',
    gender: '',
  }
}

async function readStore(): Promise<MetricsProfileStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as MetricsProfileStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeStore(store: MetricsProfileStore) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function normalizeProfile(record: Partial<ProfileSnapshot> | undefined): ProfileSnapshot {
  const defaults = createDefaultMetricsProfile()

  if (!record || typeof record !== 'object') {
    return defaults
  }

  return {
    height: typeof record.height === 'string' ? record.height : defaults.height,
    weight: typeof record.weight === 'string' ? record.weight : defaults.weight,
    birthDate: typeof record.birthDate === 'string' ? record.birthDate : defaults.birthDate,
    age: typeof record.age === 'string' ? record.age : defaults.age,
    gender: typeof record.gender === 'string' ? record.gender : defaults.gender,
  }
}

export async function loadCachedMetricsProfile(patientCpf: string): Promise<ProfileSnapshot> {
  const store = await readStore()
  return normalizeProfile(store[patientCpf])
}

export async function cacheMetricsProfile(patientCpf: string, profile: ProfileSnapshot) {
  const store = await readStore()
  store[patientCpf] = normalizeProfile(profile)
  await writeStore(store)
}

/** Carrega do backend; em falha usa cache local por CPF. */
export async function loadMetricsProfile(patientCpf: string): Promise<ProfileSnapshot> {
  if (patientCpf === 'guest') {
    return loadCachedMetricsProfile(patientCpf)
  }

  try {
    const dto = await getMetricsProfile()
    const profile = metricsProfileDtoToSnapshot(dto)
    await cacheMetricsProfile(patientCpf, profile)
    return profile
  } catch {
    return loadCachedMetricsProfile(patientCpf)
  }
}

/** Persiste no backend e atualiza cache local; em falha grava só o cache. */
export async function saveMetricsProfile(
  patientCpf: string,
  input: UpdateMetricsProfileInput,
  fallbackProfile?: ProfileSnapshot,
): Promise<ProfileSnapshot> {
  if (patientCpf === 'guest') {
    const profile = fallbackProfile ?? createDefaultMetricsProfile()
    await cacheMetricsProfile(patientCpf, profile)
    return profile
  }

  try {
    const dto = await updateMetricsProfile(input)
    const profile = metricsProfileDtoToSnapshot(dto)
    await cacheMetricsProfile(patientCpf, profile)
    return profile
  } catch {
    if (!fallbackProfile) {
      throw new Error('Não foi possível salvar o perfil.')
    }

    await cacheMetricsProfile(patientCpf, fallbackProfile)
    return fallbackProfile
  }
}
