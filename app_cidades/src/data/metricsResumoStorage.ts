import AsyncStorage from '@react-native-async-storage/async-storage'
import { getMetricsResumo, type MetricsResumoDto } from '../lib/api/vd/metricas'
import {
  cacheMetricsProfile,
  createDefaultMetricsProfile,
  loadCachedMetricsProfile,
} from './metricsProfileStorage'
import {
  createEmptyMetricsResumo,
  metricsResumoToProfileSnapshot,
} from '../utils/metricsResumo'

const STORAGE_KEY = '@telefarmed/metrics-resumo'

type MetricsResumoStore = Record<string, MetricsResumoDto>

async function readStore(): Promise<MetricsResumoStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {}
    }

    return parsed as MetricsResumoStore
  } catch {
    return {}
  }
}

async function writeStore(store: MetricsResumoStore) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export async function loadCachedMetricsResumo(patientCpf: string): Promise<MetricsResumoDto> {
  const store = await readStore()
  const cached = store[patientCpf]
  if (cached) return cached

  const profile = await loadCachedMetricsProfile(patientCpf)
  return createEmptyMetricsResumo(profile)
}

export async function cacheMetricsResumo(patientCpf: string, resumo: MetricsResumoDto) {
  const store = await readStore()
  store[patientCpf] = resumo
  await writeStore(store)
}

/** Carrega resumo agregado do backend; em falha usa cache offline por CPF. */
export async function loadMetricsResumo(patientCpf: string): Promise<MetricsResumoDto> {
  if (patientCpf === 'guest') {
    return loadCachedMetricsResumo(patientCpf)
  }

  try {
    const resumo = await getMetricsResumo()
    await cacheMetricsResumo(patientCpf, resumo)
    await cacheMetricsProfile(patientCpf, metricsResumoToProfileSnapshot(resumo))
    return resumo
  } catch {
    return loadCachedMetricsResumo(patientCpf)
  }
}

export function createGuestMetricsResumo(): MetricsResumoDto {
  return createEmptyMetricsResumo(createDefaultMetricsProfile())
}
